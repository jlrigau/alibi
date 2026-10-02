import type { Status } from '../domain/types';
import { STATUS_LABELS } from '../domain/labels';

export function StatusStamp({ status, className = '' }: { status: Status; className?: string }) {
  return <span className={`stamp stamp--${status} ${className}`}>{STATUS_LABELS[status]}</span>;
}

export function Stamp({ children, tone = 'ink' }: { children: React.ReactNode; tone?: 'ink' | 'coral' | 'green' | 'amber' }) {
  return <span className={`stamp stamp--tone-${tone}`}>{children}</span>;
}
