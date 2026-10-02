import { AddFollowUpForm, FollowUpItem } from '../components/FollowUps';
import { today } from '../domain/dates';
import type { FollowUp } from '../domain/types';
import { useStore } from '../state/store';

export function FollowUpsPage() {
  const { data } = useStore();
  const ref = today();
  const byDue = (a: FollowUp, b: FollowUp) => a.dueDate.localeCompare(b.dueDate);
  const overdue = data.followUps.filter((f) => !f.done && f.dueDate < ref).sort(byDue);
  const upcoming = data.followUps.filter((f) => !f.done && f.dueDate >= ref).sort(byDue);
  const done = data.followUps.filter((f) => f.done).sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''));
  const messOf = (f: FollowUp) => data.messes.find((m) => m.id === f.messId);

  const list = (items: FollowUp[]) => (
    <ul className="followups card">
      {items.map((f) => (
        <FollowUpItem key={f.id} followUp={f} mess={messOf(f)} />
      ))}
    </ul>
  );

  return (
    <section className="page" aria-labelledby="page-title">
      <div className="page-head">
        <p className="eyebrow">Service après-mensonge</p>
        <h1 id="page-title" className="page-title">
          Suivis
        </h1>
        <p className="page-lede">
          Une bonne histoire s’entretient. Les rappels s’affichent ici quand l’application est ouverte : aucune notification ne
          viendra vous chercher.
        </p>
      </div>

      <div className="two-cols">
        <div>
          <section className="section" aria-labelledby="late-title">
            <h2 id="late-title" className="section-title">
              En retard <span className="count count--late">{overdue.length}</span>
            </h2>
            {overdue.length ? list(overdue) : <p className="muted">Rien en retard. Vous êtes d’une rigueur inquiétante.</p>}
          </section>

          <section className="section" aria-labelledby="next-title">
            <h2 id="next-title" className="section-title">
              À venir <span className="count">{upcoming.length}</span>
            </h2>
            {upcoming.length ? list(upcoming) : <p className="muted">Aucun suivi programmé.</p>}
          </section>

          {done.length > 0 && (
            <details className="section">
              <summary className="section-title section-title--summary">
                Terminés <span className="count">{done.length}</span>
              </summary>
              {list(done)}
            </details>
          )}
        </div>

        <section className="section" aria-labelledby="add-title">
          <h2 id="add-title" className="section-title">
            Programmer un suivi
          </h2>
          <div className="card">
            <AddFollowUpForm messes={data.messes} />
          </div>
        </section>
      </div>
    </section>
  );
}
