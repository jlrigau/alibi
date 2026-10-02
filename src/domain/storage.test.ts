import { describe, expect, it } from 'vitest';
import { buildSamples } from './samples';
import {
  CORRUPT_BACKUP_PREFIX,
  STORAGE_KEY,
  exportData,
  loadData,
  parseImport,
  saveData,
  validateData,
  type StorageLike,
} from './storage';
import { SCHEMA_VERSION, type AppData } from './types';

class MemoryStorage implements StorageLike {
  map = new Map<string, string>();
  failWrites = false;
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (this.failWrites) throw new DOMException('full', 'QuotaExceededError');
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

const sampleData = (): AppData => ({ version: SCHEMA_VERSION, ...buildSamples('2026-10-02') });

describe('export / import', () => {
  it('round-trips the full dossier', () => {
    const data = sampleData();
    const result = parseImport(exportData(data));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(data);
  });

  it('rejects invalid JSON', () => {
    const r = parseImport('{pas du json');
    expect(r).toEqual({ ok: false, error: 'Ce fichier n’est pas du JSON valide.' });
  });

  it('rejects files from another app', () => {
    const r = parseImport(JSON.stringify({ ...sampleData(), app: 'autre-chose' }));
    expect(r.ok).toBe(false);
  });

  it('rejects a newer schema version', () => {
    const r = parseImport(JSON.stringify({ app: 'ca-sarrange', ...sampleData(), version: 99 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/plus récente/);
  });

  it('pinpoints the faulty record', () => {
    const data = sampleData();
    (data.messes[1] as unknown as Record<string, unknown>).status = 'disparu';
    const r = parseImport(exportData(data));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Galère n°2 : statut inconnu.');
  });

  it('rejects impossible dates, bad times and duplicate ids', () => {
    const badDate = sampleData();
    badDate.messes[0].eventDate = '2026-02-30';
    expect(parseImport(exportData(badDate)).ok).toBe(false);

    const badTime = sampleData();
    badTime.alibis[0].startTime = '25:00';
    expect(parseImport(exportData(badTime)).ok).toBe(false);

    const dup = sampleData();
    dup.followUps[1].id = dup.followUps[0].id;
    const r = parseImport(exportData(dup));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/double/);
  });

  it('rejects a missing list', () => {
    const { followUps: _f, ...rest } = sampleData();
    expect(parseImport(JSON.stringify({ app: 'ca-sarrange', ...rest })).ok).toBe(false);
  });
});

describe('local persistence', () => {
  it('starts empty without saved data', () => {
    expect(loadData(new MemoryStorage()).status).toBe('empty');
  });

  it('reloads what was saved', () => {
    const storage = new MemoryStorage();
    const data = sampleData();
    expect(saveData(storage, data)).toEqual({ ok: true });
    const loaded = loadData(storage);
    expect(loaded.status).toBe('ok');
    expect(loaded.data).toEqual(data);
  });

  it('sets corrupt content aside instead of deleting it', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{"version":1,"messes":[{"oops"');
    const loaded = loadData(storage);
    expect(loaded.status).toBe('corrupt');
    expect(loaded.data.messes).toEqual([]);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    const backups = [...storage.map.keys()].filter((k) => k.startsWith(CORRUPT_BACKUP_PREFIX));
    expect(backups).toHaveLength(1);
    expect(storage.getItem(backups[0])).toBe('{"version":1,"messes":[{"oops"');
  });

  it('treats structurally invalid data as corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, messes: 'nope', alibis: [], followUps: [] }));
    expect(loadData(storage).status).toBe('corrupt');
  });

  it('reports save failures instead of throwing', () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    const r = saveData(storage, sampleData());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/plein/);
  });

  it('handles a missing storage', () => {
    expect(loadData(null).status).toBe('unavailable');
    expect(saveData(null, sampleData()).ok).toBe(false);
  });

  it('validates sample data', () => {
    expect(validateData(sampleData()).ok).toBe(true);
  });
});
