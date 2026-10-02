import { useMemo, useState } from 'react';
import { MessCard } from '../components/MessCard';
import { CATEGORY_LABELS, STATUS_LABELS } from '../domain/labels';
import { CATEGORIES, STATUSES, type Category, type Status } from '../domain/types';
import { paths } from '../state/router';
import { useStore } from '../state/store';
import { useToast } from '../state/toast';

type StatusFilter = Status | 'all' | 'open';

export function MessesPage() {
  const { data, warnings, setStatus, loadSamples } = useStore();
  const toast = useToast();
  const [status, setStatusFilter] = useState<StatusFilter>('open');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
    data.messes.forEach((m) => c[m.status]++);
    return c;
  }, [data.messes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.messes
      .filter((m) => {
        if (status === 'open' && (m.status === 'resolved' || m.status === 'busted')) return false;
        if (status !== 'open' && status !== 'all' && m.status !== status) return false;
        if (category !== 'all' && m.category !== category) return false;
        if (q && !`${m.title} ${m.person}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate) || b.urgency - a.urgency);
  }, [data.messes, status, category, query]);

  if (data.messes.length === 0) {
    return (
      <section className="page" aria-labelledby="page-title">
        <div className="empty">
          <div className="empty__art" aria-hidden="true">
            <span className="empty__tray">📥</span>
            <span className="stamp stamp--tone-coral empty__stamp">Néant</span>
          </div>
          <h1 id="page-title" className="page-title">Aucune galère déclarée</h1>
          <p className="empty__text">
            Votre dossier de mauvaise foi est vierge. Profitez-en, ça ne durera pas. Déclarez votre première galère et le bureau
            s’occupe du reste (ou presque).
          </p>
          <div className="empty__actions">
            <a href={paths.messNew} className="btn btn--primary btn--large">
              ＋ Déclarer une galère
            </a>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                loadSamples();
                toast('Exemples fictifs chargés. Toute ressemblance serait fortuite.');
              }}
            >
              Charger des exemples fictifs
            </button>
          </div>
        </div>
      </section>
    );
  }

  const openCount = data.messes.length - counts.resolved - counts.busted;
  const warnCount = (messId: string) => {
    const ids = new Set(data.alibis.filter((a) => a.messId === messId).map((a) => a.id));
    return warnings.filter((w) => w.alibiIds.some((id) => ids.has(id))).length;
  };

  return (
    <section className="page" aria-labelledby="page-title">
      <div className="page-head">
        <p className="eyebrow">Bureau des petites catastrophes</p>
        <h1 id="page-title" className="page-title">
          Votre dossier de mauvaise foi
        </h1>
        <p className="page-lede">
          {openCount === 0
            ? 'Tout est sous contrôle. C’est suspect.'
            : `${openCount} affaire${openCount > 1 ? 's' : ''} en souffrance. Le bureau est sur le coup.`}
        </p>
      </div>

      <div className="stats" aria-label="Répartition par statut">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`stat stat--${s}`}
            aria-pressed={status === s}
            onClick={() => setStatusFilter(status === s ? 'open' : s)}
          >
            <span className="stat__num">{counts[s]}</span>
            <span className="stat__label">{STATUS_LABELS[s]}</span>
          </button>
        ))}
      </div>

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="field field--inline">
          <label htmlFor="f-status">Statut</label>
          <select id="f-status" className="select" value={status} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
            <option value="open">Affaires en cours</option>
            <option value="all">Toutes</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="field field--inline">
          <label htmlFor="f-category">Catégorie</label>
          <select id="f-category" className="select" value={category} onChange={(e) => setCategory(e.target.value as Category | 'all')}>
            <option value="all">Toutes</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="field field--inline field--grow">
          <label htmlFor="f-query">Rechercher</label>
          <input id="f-query" className="input" type="search" placeholder="Titre ou personne" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </form>

      <p className="results-count" aria-live="polite">
        {filtered.length} dossier{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="empty empty--small">
          <p>Aucun dossier ne correspond. Soit vous êtes irréprochable, soit les filtres sont trop stricts.</p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setStatusFilter('all');
              setCategory('all');
              setQuery('');
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid">
          {filtered.map((m) => (
            <MessCard
              key={m.id}
              mess={m}
              alibiCount={data.alibis.filter((a) => a.messId === m.id).length}
              warningCount={warnCount(m.id)}
              onStatusChange={(s) => {
                setStatus(m.id, s);
                toast(s === 'resolved' ? 'Affaire classée. Pour l’instant.' : `Statut mis à jour : ${STATUS_LABELS[s]}.`);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
