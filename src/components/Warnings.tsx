import type { CoherenceWarning } from '../domain/coherence';

const ICONS = { reused: '♻️', location: '📍', commitment: '⏰' } as const;

export function WarningList({ warnings, compact = false }: { warnings: CoherenceWarning[]; compact?: boolean }) {
  if (warnings.length === 0) return null;
  return (
    <ul className={`warnings ${compact ? 'warnings--compact' : ''}`}>
      {warnings.map((w, i) => (
        <li key={`${w.kind}-${w.alibiIds.join('-')}-${i}`} className={`warning warning--${w.kind}`}>
          <span className="warning__icon" aria-hidden="true">
            {ICONS[w.kind]}
          </span>
          <div>
            <strong className="warning__title">{w.title}</strong>
            <p className="warning__text">{w.message}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
