import { URGENCY_LABELS } from '../domain/labels';
import type { Urgency } from '../domain/types';

export function UrgencyMeter({ level }: { level: Urgency }) {
  return (
    <span className={`urgency urgency--${level}`} title={URGENCY_LABELS[level]}>
      <span className="urgency__bars" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={n <= level ? 'on' : ''} />
        ))}
      </span>
      <span className="urgency__label">{URGENCY_LABELS[level]}</span>
    </span>
  );
}
