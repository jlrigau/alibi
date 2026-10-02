import { CATEGORY_ICONS, CATEGORY_LABELS, STATUS_LABELS } from '../domain/labels';
import { formatCountdown, formatShort } from '../domain/dates';
import { STATUSES, type Mess, type Status } from '../domain/types';
import { paths } from '../state/router';
import { StatusStamp } from './Stamp';
import { UrgencyMeter } from './UrgencyMeter';

interface Props {
  mess: Mess;
  alibiCount: number;
  warningCount: number;
  onStatusChange(status: Status): void;
}

export function MessCard({ mess, alibiCount, warningCount, onStatusChange }: Props) {
  const selectId = `status-${mess.id}`;
  return (
    <article className={`card mess-card mess-card--${mess.status}`}>
      <div className="mess-card__top">
        <span className="chip">
          <span aria-hidden="true">{CATEGORY_ICONS[mess.category]}</span> {CATEGORY_LABELS[mess.category]}
        </span>
        <StatusStamp status={mess.status} className="mess-card__stamp" />
      </div>
      <h3 className="mess-card__title">
        <a href={paths.mess(mess.id)} className="stretched-link">
          {mess.title}
        </a>
      </h3>
      <dl className="mess-card__meta">
        {mess.person && (
          <div>
            <dt>Concerné·e</dt>
            <dd>{mess.person}</dd>
          </div>
        )}
        <div>
          <dt>Échéance</dt>
          <dd>
            <time dateTime={mess.eventDate}>{formatShort(mess.eventDate)}</time> · {formatCountdown(mess.eventDate)}
          </dd>
        </div>
      </dl>
      <div className="mess-card__bottom">
        <UrgencyMeter level={mess.urgency} />
        <div className="mess-card__badges">
          {alibiCount > 0 && <span className="mini-badge">{alibiCount} alibi{alibiCount > 1 ? 's' : ''}</span>}
          {warningCount > 0 && (
            <span className="mini-badge mini-badge--warn" title="Cohérence narrative compromise">
              ⚠ {warningCount}
            </span>
          )}
        </div>
      </div>
      <div className="mess-card__status">
        <label htmlFor={selectId} className="visually-hidden">
          Changer le statut de « {mess.title} »
        </label>
        <select id={selectId} value={mess.status} onChange={(e) => onStatusChange(e.target.value as Status)} className="select select--small">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}
