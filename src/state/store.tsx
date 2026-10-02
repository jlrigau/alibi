import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { checkHistory, type CoherenceWarning } from '../domain/coherence';
import { newId, nowISO } from '../domain/ids';
import { buildSamples } from '../domain/samples';
import { getBrowserStorage, loadData, saveData, type LoadResult } from '../domain/storage';
import { emptyData, type Alibi, type AppData, type FollowUp, type Mess, type Status } from '../domain/types';

export type MessDraft = Omit<Mess, 'id' | 'createdAt' | 'updatedAt'>;
export type AlibiDraft = Omit<Alibi, 'id' | 'createdAt'>;
export type FollowUpDraft = Pick<FollowUp, 'label' | 'dueDate' | 'messId'>;

interface Store {
  data: AppData;
  warnings: CoherenceWarning[];
  loadIssue: LoadResult | null;
  saveError: string | null;
  dismissLoadIssue(): void;
  addMess(draft: MessDraft): Mess;
  updateMess(id: string, draft: MessDraft): void;
  setStatus(id: string, status: Status): void;
  deleteMess(id: string): void;
  addAlibi(draft: AlibiDraft, followUps: FollowUpDraft[]): Alibi;
  deleteAlibi(id: string): void;
  addFollowUp(draft: FollowUpDraft): void;
  setFollowUpDone(id: string, done: boolean): void;
  deleteFollowUp(id: string): void;
  loadSamples(): void;
  replaceAll(data: AppData): void;
  reset(): void;
}

const StoreContext = createContext<Store | null>(null);

const makeFollowUp = (d: FollowUpDraft): FollowUp => ({
  id: newId('fu'),
  messId: d.messId,
  label: d.label.trim(),
  dueDate: d.dueDate,
  done: false,
  doneAt: null,
  createdAt: nowISO(),
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(() => getBrowserStorage(), []);
  const [initial] = useState(() => loadData(storage));
  const [data, setData] = useState<AppData>(initial.data);
  const [loadIssue, setLoadIssue] = useState<LoadResult | null>(
    initial.status === 'corrupt' || initial.status === 'unavailable' ? initial : null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const result = saveData(storage, data);
    setSaveError(result.ok ? null : result.error);
  }, [data, storage]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);

  const addMess = useCallback(
    (draft: MessDraft) => {
      const now = nowISO();
      const mess: Mess = { ...draft, id: newId('mess'), createdAt: now, updatedAt: now };
      update((d) => ({ ...d, messes: [...d.messes, mess] }));
      return mess;
    },
    [update],
  );

  const updateMess = useCallback(
    (id: string, draft: MessDraft) =>
      update((d) => ({
        ...d,
        messes: d.messes.map((m) => (m.id === id ? { ...m, ...draft, updatedAt: nowISO() } : m)),
      })),
    [update],
  );

  const setStatus = useCallback(
    (id: string, status: Status) =>
      update((d) => ({
        ...d,
        messes: d.messes.map((m) => (m.id === id ? { ...m, status, updatedAt: nowISO() } : m)),
      })),
    [update],
  );

  const deleteMess = useCallback(
    (id: string) =>
      update((d) => ({
        ...d,
        messes: d.messes.filter((m) => m.id !== id),
        alibis: d.alibis.filter((a) => a.messId !== id),
        followUps: d.followUps.filter((f) => f.messId !== id),
      })),
    [update],
  );

  const addAlibi = useCallback(
    (draft: AlibiDraft, followUps: FollowUpDraft[]) => {
      const alibi: Alibi = { ...draft, id: newId('alibi'), createdAt: nowISO() };
      update((d) => ({
        ...d,
        alibis: [...d.alibis, alibi],
        followUps: [...d.followUps, ...followUps.map(makeFollowUp)],
        // A dossier still "à gérer" now has its alibi ready.
        messes: d.messes.map((m) =>
          m.id === draft.messId && m.status === 'todo' ? { ...m, status: 'ready', updatedAt: nowISO() } : m,
        ),
      }));
      return alibi;
    },
    [update],
  );

  const value: Store = {
    data,
    warnings: useMemo(() => checkHistory(data.alibis), [data.alibis]),
    loadIssue,
    saveError,
    dismissLoadIssue: () => setLoadIssue(null),
    addMess,
    updateMess,
    setStatus,
    deleteMess,
    addAlibi,
    deleteAlibi: (id) => update((d) => ({ ...d, alibis: d.alibis.filter((a) => a.id !== id) })),
    addFollowUp: (draft) => update((d) => ({ ...d, followUps: [...d.followUps, makeFollowUp(draft)] })),
    setFollowUpDone: (id, done) =>
      update((d) => ({
        ...d,
        followUps: d.followUps.map((f) => (f.id === id ? { ...f, done, doneAt: done ? nowISO() : null } : f)),
      })),
    deleteFollowUp: (id) => update((d) => ({ ...d, followUps: d.followUps.filter((f) => f.id !== id) })),
    loadSamples: () =>
      update((d) => {
        const s = buildSamples();
        return {
          ...d,
          messes: [...d.messes, ...s.messes],
          alibis: [...d.alibis, ...s.alibis],
          followUps: [...d.followUps, ...s.followUps],
        };
      }),
    replaceAll: (next) => setData(next),
    reset: () => setData(emptyData()),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
