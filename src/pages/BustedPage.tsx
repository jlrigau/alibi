import { useState } from 'react';
import { CopyButton } from '../components/CopyButton';
import { BUSTED_KINDS, bustedMessage, type BustedKind } from '../domain/busted';
import { paths } from '../state/router';
import { useStore } from '../state/store';
import { useToast } from '../state/toast';
import { NotFoundPage } from './NotFoundPage';

export function BustedPage({ id }: { id: string }) {
  const { data, setStatus } = useStore();
  const toast = useToast();
  const mess = data.messes.find((m) => m.id === id);
  const [indexes, setIndexes] = useState<Record<BustedKind, number>>({ admit: 0, apologize: 0, makeAmends: 0 });
  const [texts, setTexts] = useState<Record<BustedKind, string>>(() =>
    mess
      ? {
          admit: bustedMessage('admit', 0, mess.person, mess.title),
          apologize: bustedMessage('apologize', 0, mess.person, mess.title),
          makeAmends: bustedMessage('makeAmends', 0, mess.person, mess.title),
        }
      : { admit: '', apologize: '', makeAmends: '' },
  );
  if (!mess) return <NotFoundPage />;

  const reroll = (kind: BustedKind) => {
    const next = indexes[kind] + 1;
    setIndexes((i) => ({ ...i, [kind]: next }));
    setTexts((t) => ({ ...t, [kind]: bustedMessage(kind, next, mess.person, mess.title) }));
  };

  return (
    <section className="page" aria-labelledby="page-title">
      <a href={paths.mess(mess.id)} className="back-link">
        ← Retour au dossier
      </a>
      <div className="page-head busted-head">
        <span className="busted-siren" aria-hidden="true">
          🚨
        </span>
        <p className="eyebrow">Procédure d’urgence</p>
        <h1 id="page-title" className="page-title">
          Ils m’ont grillé
        </h1>
        <p className="page-lede">
          Pour « {mess.title} ». Respirez. Trois portes de sortie, toutes modifiables. Rien n’est envoyé : vous copiez, vous assumez.
        </p>
        {mess.status !== 'busted' && (
          <button
            type="button"
            className="btn btn--danger-outline"
            onClick={() => {
              setStatus(mess.id, 'busted');
              toast('Dossier tamponné « Grillé ». Le bureau compatit.');
            }}
          >
            Tamponner le dossier « Grillé »
          </button>
        )}
      </div>

      <div className="proposals">
        {BUSTED_KINDS.map(({ kind, label, hint }) => (
          <article key={kind} className="card proposal" aria-labelledby={`b-${kind}-title`}>
            <header className="proposal__head">
              <h2 id={`b-${kind}-title`} className="proposal__title">
                {label}
              </h2>
            </header>
            <p className="muted small">{hint}</p>
            <div className="field">
              <label htmlFor={`b-${kind}`}>Message (modifiable)</label>
              <textarea
                id={`b-${kind}`}
                className="textarea textarea--message"
                rows={6}
                value={texts[kind]}
                onChange={(e) => setTexts((t) => ({ ...t, [kind]: e.target.value }))}
              />
            </div>
            <div className="proposal__actions">
              <button type="button" className="btn btn--ghost" onClick={() => reroll(kind)}>
                Autre version
              </button>
              <CopyButton text={texts[kind]} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
