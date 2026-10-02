const pad = (n: number) => String(n).padStart(2, '0');

/** Local date as YYYY-MM-DD. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): string {
  return toISODate(new Date());
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  const ms = parseISODate(to).getTime() - parseISODate(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function isValidISODate(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return toISODate(parseISODate(s)) === s;
}

export function isValidTime(s: unknown): s is string {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const longFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const shortFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });

export function formatLong(iso: string): string {
  return longFormat.format(parseISODate(iso));
}

export function formatShort(iso: string): string {
  return shortFormat.format(parseISODate(iso));
}

/** Human date relative to `ref`: "aujourd'hui", "demain", "samedi", "le samedi 14 octobre". */
export function formatRelative(iso: string, ref: string = today()): string {
  const diff = daysBetween(ref, iso);
  if (diff === 0) return 'aujourd’hui';
  if (diff === 1) return 'demain';
  if (diff === -1) return 'hier';
  if (diff > 1 && diff < 7) return weekdayFormat.format(parseISODate(iso));
  return `le ${formatLong(iso)}`;
}

/** Short label for cards: "Aujourd'hui", "Dans 3 j", "Il y a 2 j". */
export function formatCountdown(iso: string, ref: string = today()): string {
  const diff = daysBetween(ref, iso);
  if (diff === 0) return 'Aujourd’hui';
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  if (diff > 0) return `Dans ${diff} j`;
  return `Il y a ${-diff} j`;
}
