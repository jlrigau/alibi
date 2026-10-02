import { useState } from 'react';
import { AlibiItem } from '../components/AlibiItem';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AddFollowUpForm, FollowUpItem } from '../components/FollowUps';
import { StatusStamp } from '../components/Stamp';
import { UrgencyMeter } from '../components/UrgencyMeter';
import { formatCountdown, formatLong } from '../domain/dates';
import { CATEGORY_ICONS, CATEGORY_LABELS, STATUS_LABELS } from '../domain/labels';
import { STATUSES } from '../domain/types';
import { navigate, paths } from '../state/router';
import { useStore } from '../state/store';
import { useToast } from '../state/toast';
import { NotFoundPage } from './NotFoundPage';

export function MessDetailPage({ id }: { id: string }) {
  const { data, warnings, setStatus, deleteMess } = useStore();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mess = data.messes.find((m) => m.id === id);
  if (!mess) return <NotFoundPage />;

  const alibis = data.alibis.filter((a) => a.messId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const followUps = data.followUps
    .filter((f) => f.messId === id)
    .sort((a, b) => Number(a.done) - Number(b.done) || a.dueDate.localeCompare(b.dueDate));

  return (
    <section className="page" aria-labelledby="page-title">
      <a href={paths.messes} className="back-link">
        ← Retour aux galères
      </a>

      <div className={`card dossier dossier--${mess.status}`}>
        <div className="dossier__head">
          <p className="eyebrow">
            Dossier n° {mess.id.slice(-6).toUpperCase()} · <span aria-hidden="true">{CATEGORY_ICONS[mess.category]}</span>{' '}
            {CATEGORY_LABELS[mess.category]}
          </p>
          <StatusStamp status={mess.status} className="dossier__stamp" />
        </div>
        <h1 id="page-title" className="page-title dossier__title">
          {mess.title}
        </h1>
        <dl className="dossier__meta">
          <div>
            <dt>Personne concernée</dt>
            <dd>{mess.person || <em>Non renseignée</em>}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>
              <time dateTime={mess.eventDate}>{formatLong(mess.eventDate)}</time> ({formatCountdown(mess.eventDate).toLowerCase()})
            </dd>
          </div>
          <div>
            <dt>Urgence</dt>
            <dd>
              <UrgencyMeter level={mess.urgency} />
            </dd>
          </div>
        </dl>
        {mess.notes && <p className="dossier__notes">{mess.notes}</p>}

        <fieldset className="status-picker">
          <legend>Statut du dossier</legend>
          <div className="segmented">
            {STATUSES.map((s) => (
              <label key={s} className={`segmented__option status-opt status-opt--${s}`}>
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={mess.status === s}
                  onChange={() => {
                    setStatus(mess.id, s);
                    toast(s === 'resolved' ? 'Affaire classée. Pour l’instant.' : `Statut : ${STATUS_LABELS[s]}.`);
                  }}
                />
                <span>{STATUS_LABELS[s]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="dossier__actions">
          <a href={paths.factory(mess.id)} className="btn btn--primary">
            🪄 Fabriquer un alibi
          </a>
          <a href={paths.busted(mess.id)} className="btn btn--danger-outline">
            🚨 Ils m’ont grillé
          </a>
          <a href={paths.messEdit(mess.id)} className="btn btn--ghost">
            Modifier
          </a>
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmDelete(true)}>
            Supprimer
          </button>
        </div>
      </div>

      <div className="two-cols">
        <section aria-labelledby="alibis-title" className="section">
          <h2 id="alibis-title" className="section-title">
            Alibis retenus <span className="count">{alibis.length}</span>
          </h2>
          {alibis.length === 0 ? (
            <div className="empty empty--small">
              <p>Aucun alibi pour l’instant. La vérité, peut-être ? Non ? Alors direction la fabrique.</p>
              <a href={paths.factory(mess.id)} className="btn btn--secondary">
                Ouvrir la fabrique d’alibis
              </a>
            </div>
          ) : (
            <div className="stack">
              {alibis.map((a) => (
                <AlibiItem key={a.id} alibi={a} warnings={warnings} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="fu-title" className="section">
          <h2 id="fu-title" className="section-title">
            Suivi de l’histoire <span className="count">{followUps.filter((f) => !f.done).length}</span>
          </h2>
          {followUps.length > 0 ? (
            <ul className="followups card">
              {followUps.map((f) => (
                <FollowUpItem key={f.id} followUp={f} />
              ))}
            </ul>
          ) : (
            <p className="muted">Aucun suivi. Une bonne histoire s’entretient, pourtant.</p>
          )}
          <div className="card">
            <AddFollowUpForm messId={mess.id} />
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Détruire ce dossier ?"
        confirmLabel="Passer à la broyeuse"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteMess(mess.id);
          toast('Dossier détruit. Aucune trace, aucun témoin.');
          navigate(paths.messes);
        }}
      >
        <p>
          « {mess.title} » sera supprimé avec ses {alibis.length} alibi{alibis.length > 1 ? 's' : ''} et ses {followUps.length} suivi
          {followUps.length > 1 ? 's' : ''}. Cette action est définitive.
        </p>
      </ConfirmDialog>
    </section>
  );
}
