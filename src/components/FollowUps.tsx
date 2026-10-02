import { useId, useState, type FormEvent } from 'react';
import { daysBetween, formatShort, isValidISODate, today, addDays } from '../domain/dates';
import type { FollowUp, Mess } from '../domain/types';
import { paths } from '../state/router';
import { useStore } from '../state/store';
import { useToast } from '../state/toast';

export const FOLLOW_UP_SUGGESTIONS = [
  'Dire que ça va mieux',
  'Demander comment s’est passé le dîner',
  'Ne pas reprendre la même excuse vendredi',
  'Relancer pour le remboursement',
];

function dueLabel(f: FollowUp, ref: string): string {
  if (f.done) return 'Terminé';
  const d = daysBetween(ref, f.dueDate);
  if (d === 0) return 'Aujourd’hui';
  if (d === 1) return 'Demain';
  if (d > 1) return `Dans ${d} jours`;
  return d === -1 ? 'En retard d’un jour' : `En retard de ${-d} jours`;
}

export function FollowUpItem({ followUp, mess }: { followUp: FollowUp; mess?: Mess }) {
  const { setFollowUpDone, deleteFollowUp } = useStore();
  const toast = useToast();
  const ref = today();
  const overdue = !followUp.done && followUp.dueDate < ref;
  const id = `fu-${followUp.id}`;
  return (
    <li className={`followup ${overdue ? 'followup--overdue' : ''} ${followUp.done ? 'followup--done' : ''}`}>
      <input
        id={id}
        type="checkbox"
        className="checkbox"
        checked={followUp.done}
        onChange={(e) => {
          setFollowUpDone(followUp.id, e.target.checked);
          if (e.target.checked) toast('Suivi terminé. L’histoire tient toujours.');
        }}
      />
      <div className="followup__body">
        <label htmlFor={id} className="followup__label">
          {followUp.label}
        </label>
        <p className="followup__meta">
          <span className={`due ${overdue ? 'due--late' : ''}`}>{dueLabel(followUp, ref)}</span> ·{' '}
          <time dateTime={followUp.dueDate}>{formatShort(followUp.dueDate)}</time>
          {mess && (
            <>
              {' '}
              · <a href={paths.mess(mess.id)}>{mess.title}</a>
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        className="icon-btn"
        aria-label={`Supprimer le suivi « ${followUp.label} »`}
        onClick={() => {
          deleteFollowUp(followUp.id);
          toast('Suivi supprimé.');
        }}
      >
        ✕
      </button>
    </li>
  );
}

export function AddFollowUpForm({ messId, messes }: { messId?: string; messes?: Mess[] }) {
  const { addFollowUp } = useStore();
  const toast = useToast();
  const uid = useId();
  const [label, setLabel] = useState('');
  const [dueDate, setDueDate] = useState(addDays(today(), 1));
  const [linked, setLinked] = useState(messId ?? '');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Précisez ce qu’il faudra faire.');
      document.getElementById(`${uid}-label`)?.focus();
      return;
    }
    if (!isValidISODate(dueDate)) {
      setError('Indiquez une échéance valide.');
      return;
    }
    addFollowUp({ label, dueDate, messId: (messId ?? linked) || null });
    setLabel('');
    setError(null);
    toast('Suivi ajouté. Votre version des faits sera entretenue.');
  };

  return (
    <form className="followup-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor={`${uid}-label`}>Action de suivi</label>
        <input
          id={`${uid}-label`}
          className="input"
          value={label}
          maxLength={300}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex. : Dire que ça va mieux"
          aria-invalid={!!error && !label.trim()}
          aria-describedby={error ? `${uid}-error` : undefined}
        />
        <div className="suggestions" role="group" aria-label="Suggestions">
          {FOLLOW_UP_SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip chip--button" onClick={() => setLabel(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="form__row">
        <div className="field">
          <label htmlFor={`${uid}-due`}>Échéance</label>
          <input id={`${uid}-due`} className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        {!messId && messes && (
          <div className="field">
            <label htmlFor={`${uid}-mess`}>Galère liée</label>
            <select id={`${uid}-mess`} className="select" value={linked} onChange={(e) => setLinked(e.target.value)}>
              <option value="">Aucune</option>
              {messes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {error && (
        <p id={`${uid}-error`} className="field__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--secondary">
        Ajouter le suivi
      </button>
    </form>
  );
}
