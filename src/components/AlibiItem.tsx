import { useState } from 'react';
import { warningsFor, type CoherenceWarning } from '../domain/coherence';
import { formatShort } from '../domain/dates';
import { credibilityLabel } from '../domain/generator';
import { BOLDNESS_LABELS, INTENT_LABELS, TONE_LABELS } from '../domain/labels';
import type { Alibi, Mess } from '../domain/types';
import { paths } from '../state/router';
import { useStore } from '../state/store';
import { useToast } from '../state/toast';
import { ConfirmDialog } from './ConfirmDialog';
import { CopyButton } from './CopyButton';
import { WarningList } from './Warnings';

const hm = (t: string) => t.replace(':', ' h ').replace(' h 00', ' h');

export function AlibiItem({ alibi, mess, warnings }: { alibi: Alibi; mess?: Mess; warnings: CoherenceWarning[] }) {
  const { deleteAlibi } = useStore();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const mine = warningsFor(alibi.id, warnings);

  return (
    <article className={`card alibi-item ${mine.length ? 'alibi-item--warn' : ''}`}>
      <header className="alibi-item__head">
        <div>
          <h3 className="alibi-item__title">{alibi.title}</h3>
          <p className="alibi-item__meta">
            {alibi.recipient ? <>Pour <strong>{alibi.recipient}</strong> · </> : null}
            <time dateTime={alibi.date}>{formatShort(alibi.date)}</time>, {hm(alibi.startTime)} – {hm(alibi.endTime)}
          </p>
        </div>
        {mine.length > 0 ? (
          <span className="stamp stamp--tone-coral alibi-item__stamp">À risque</span>
        ) : (
          <span className="stamp stamp--tone-green alibi-item__stamp">Cohérent</span>
        )}
      </header>
      {mess && (
        <p className="alibi-item__mess">
          Dossier : <a href={paths.mess(mess.id)}>{mess.title}</a>
        </p>
      )}
      <ul className="tags" aria-label="Caractéristiques">
        <li className="tag">{INTENT_LABELS[alibi.intent]}</li>
        <li className="tag">{TONE_LABELS[alibi.tone]}</li>
        <li className="tag">{BOLDNESS_LABELS[alibi.boldness]}</li>
        {alibi.location && <li className="tag">📍 {alibi.location}</li>}
        {alibi.activity && <li className="tag">⏰ {alibi.activity}</li>}
        <li className="tag tag--score">
          Crédibilité {alibi.credibility}/100 · {credibilityLabel(alibi.credibility)}
        </li>
      </ul>
      <details className="alibi-item__details">
        <summary>Voir le message</summary>
        <p className="message-preview">{alibi.message}</p>
      </details>
      <WarningList warnings={mine} compact />
      <div className="alibi-item__actions">
        <CopyButton text={alibi.message} label="Copier le message" />
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setConfirm(true)}>
          Supprimer
        </button>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Effacer cet alibi ?"
        confirmLabel="Effacer"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          deleteAlibi(alibi.id);
          toast('Alibi effacé. Il n’a jamais existé.');
        }}
      >
        <p>« {alibi.title} » disparaîtra de l’historique. Les vérifications de cohérence ne le prendront plus en compte.</p>
      </ConfirmDialog>
    </article>
  );
}
