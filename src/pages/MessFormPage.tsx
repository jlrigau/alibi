import { useState, type FormEvent } from 'react';
import { CATEGORY_LABELS, STATUS_LABELS, URGENCY_LABELS } from '../domain/labels';
import { isValidISODate, today } from '../domain/dates';
import { CATEGORIES, STATUSES, URGENCIES, type Urgency } from '../domain/types';
import { navigate, paths } from '../state/router';
import { useStore, type MessDraft } from '../state/store';
import { useToast } from '../state/toast';
import { NotFoundPage } from './NotFoundPage';

export function MessFormPage({ id }: { id?: string }) {
  const { data, addMess, updateMess } = useStore();
  const toast = useToast();
  const existing = id ? data.messes.find((m) => m.id === id) : undefined;
  const [draft, setDraft] = useState<MessDraft>(() =>
    existing
      ? {
          title: existing.title,
          person: existing.person,
          category: existing.category,
          eventDate: existing.eventDate,
          urgency: existing.urgency,
          status: existing.status,
          notes: existing.notes,
        }
      : { title: '', person: '', category: 'family', eventDate: today(), urgency: 2, status: 'todo', notes: '' },
  );
  const [errors, setErrors] = useState<Partial<Record<'title' | 'eventDate', string>>>({});

  if (id && !existing) return <NotFoundPage />;

  const set = <K extends keyof MessDraft>(key: K, value: MessDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!draft.title.trim()) next.title = 'Une galère sans titre, c’est une galère qu’on ne peut pas classer.';
    if (!isValidISODate(draft.eventDate)) next.eventDate = 'Indiquez une date valide.';
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(next.title ? 'mess-title' : 'mess-date')?.focus();
      return;
    }
    const clean = { ...draft, title: draft.title.trim(), person: draft.person.trim(), notes: draft.notes.trim() };
    if (existing) {
      updateMess(existing.id, clean);
      toast('Dossier mis à jour. La vérité a été légèrement ajustée.');
      navigate(paths.mess(existing.id));
    } else {
      const created = addMess(clean);
      toast('Galère déclarée. Le bureau prend l’affaire en main.');
      navigate(paths.mess(created.id));
    }
  };

  return (
    <section className="page page--narrow" aria-labelledby="page-title">
      <a href={existing ? paths.mess(existing.id) : paths.messes} className="back-link">
        ← {existing ? 'Retour au dossier' : 'Retour aux galères'}
      </a>
      <div className="page-head">
        <p className="eyebrow">Formulaire Cerfa n° 0-SOUCI</p>
        <h1 id="page-title" className="page-title">
          {existing ? 'Modifier la galère' : 'Déclarer une galère'}
        </h1>
        <p className="page-lede">Remplissez avec sincérité. C’est la dernière fois qu’on vous le demandera.</p>
      </div>

      <form className="card form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="mess-title">
            Intitulé de la galère <span className="req">obligatoire</span>
          </label>
          <input
            id="mess-title"
            className="input"
            value={draft.title}
            maxLength={200}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Ex. : Dîner chez les beaux-parents"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'mess-title-error' : undefined}
            required
          />
          {errors.title && (
            <p id="mess-title-error" className="field__error">
              {errors.title}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="mess-person">Personne concernée</label>
          <input
            id="mess-person"
            className="input"
            value={draft.person}
            maxLength={200}
            onChange={(e) => set('person', e.target.value)}
            placeholder="Ex. : Tante Odile, le groupe « Rando 2019 »"
            aria-describedby="mess-person-hint"
          />
          <p id="mess-person-hint" className="field__hint">
            Sert à repérer les excuses déjà servies à la même personne.
          </p>
        </div>

        <div className="form__row">
          <div className="field">
            <label htmlFor="mess-category">Catégorie</label>
            <select id="mess-category" className="select" value={draft.category} onChange={(e) => set('category', e.target.value as MessDraft['category'])}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="mess-date">Date de l’événement</label>
            <input
              id="mess-date"
              className="input"
              type="date"
              value={draft.eventDate}
              onChange={(e) => set('eventDate', e.target.value)}
              aria-invalid={!!errors.eventDate}
              aria-describedby={errors.eventDate ? 'mess-date-error' : undefined}
              required
            />
            {errors.eventDate && (
              <p id="mess-date-error" className="field__error">
                {errors.eventDate}
              </p>
            )}
          </div>
        </div>

        <fieldset className="field">
          <legend>Niveau d’urgence</legend>
          <div className="segmented segmented--4">
            {URGENCIES.map((u) => (
              <label key={u} className={`segmented__option urgency-opt urgency-opt--${u}`}>
                <input type="radio" name="urgency" value={u} checked={draft.urgency === u} onChange={() => set('urgency', u as Urgency)} />
                <span>{URGENCY_LABELS[u]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="mess-status">Statut</label>
          <select id="mess-status" className="select" value={draft.status} onChange={(e) => set('status', e.target.value as MessDraft['status'])}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="mess-notes">Détails du dossier</label>
          <textarea
            id="mess-notes"
            className="textarea"
            rows={3}
            maxLength={2000}
            value={draft.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Circonstances aggravantes, pièces à conviction…"
          />
        </div>

        <div className="form__actions">
          <a href={existing ? paths.mess(existing.id) : paths.messes} className="btn btn--ghost">
            Annuler
          </a>
          <button type="submit" className="btn btn--primary">
            {existing ? 'Enregistrer les modifications' : 'Déclarer la galère'}
          </button>
        </div>
      </form>
    </section>
  );
}
