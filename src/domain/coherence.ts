import { formatShort, timeToMinutes } from './dates';
import { normalize } from './ids';
import type { Alibi } from './types';

export type WarningKind = 'reused' | 'location' | 'commitment';

export interface CoherenceWarning {
  kind: WarningKind;
  /** The two alibis involved: [earlier/existing, later/candidate]. */
  alibiIds: [string, string];
  title: string;
  message: string;
}

/** Fields the rules look at: a saved alibi or a proposal not yet saved. */
export type AlibiFacts = Pick<
  Alibi,
  'id' | 'excuseKey' | 'title' | 'recipient' | 'date' | 'startTime' | 'endTime' | 'location' | 'activity'
>;

const PREPOSITIONS = /^(chez|au|aux|à|a|en|sur|dans|devant|derrière|sous|près|vers|hors)(?=\s|$)/iu;

/** "Chez moi" → "chez moi", "Lyon" → "à Lyon": reads naturally after "être". */
export function placePhrase(location: string): string {
  const place = location.trim();
  if (PREPOSITIONS.test(place)) return place.charAt(0).toLowerCase() + place.slice(1);
  return `à ${place}`;
}

/** Same day and overlapping [start, end) slots. A slot ending before it starts is read as running past midnight. */
export function slotsOverlap(a: AlibiFacts, b: AlibiFacts): boolean {
  if (a.date !== b.date) return false;
  const range = (x: AlibiFacts): [number, number] => {
    const s = timeToMinutes(x.startTime);
    let e = timeToMinutes(x.endTime);
    if (e <= s) e += 24 * 60;
    return [s, e];
  };
  const [as, ae] = range(a);
  const [bs, be] = range(b);
  return as < be && bs < ae;
}

function checkPair(prev: AlibiFacts, next: AlibiFacts): CoherenceWarning[] {
  const warnings: CoherenceWarning[] = [];
  const ids: [string, string] = [prev.id, next.id];
  const who = next.recipient.trim();

  if (who && normalize(prev.recipient) === normalize(who) && prev.excuseKey === next.excuseKey) {
    warnings.push({
      kind: 'reused',
      alibiIds: ids,
      title: 'Cette excuse a déjà beaucoup servi',
      message: `${who} a déjà eu droit à « ${prev.title} » (${formatShort(prev.date)}). Même la meilleure excuse s’use quand on s’en sert.`,
    });
  }

  if (!slotsOverlap(prev, next)) return warnings;

  const prevPlace = normalize(prev.location);
  const nextPlace = normalize(next.location);
  if (prevPlace && nextPlace && prevPlace !== nextPlace) {
    warnings.push({
      kind: 'location',
      alibiIds: ids,
      title: 'Cohérence narrative compromise',
      message: `Tu es déjà censé être ${placePhrase(prev.location)} à cette heure-là. La téléportation reste une défense fragile.`,
    });
  } else if (
    normalize(prev.activity) &&
    normalize(next.activity) &&
    normalize(prev.activity) !== normalize(next.activity)
  ) {
    warnings.push({
      kind: 'commitment',
      alibiIds: ids,
      title: 'Engagements incompatibles',
      message: `Au même moment, ta version officielle te consacre à la fois à « ${prev.activity.trim()} » et à « ${next.activity.trim()} ». Le don d’ubiquité n’est pas reconnu par l’administration.`,
    });
  }
  return warnings;
}

/** Warnings a candidate would raise against already saved alibis. */
export function checkCandidate(candidate: AlibiFacts, history: AlibiFacts[]): CoherenceWarning[] {
  return history.filter((a) => a.id !== candidate.id).flatMap((a) => checkPair(a, candidate));
}

/** All warnings within the saved history, each pair reported once (older alibi first). */
export function checkHistory(alibis: (AlibiFacts & { createdAt: string })[]): CoherenceWarning[] {
  const sorted = [...alibis].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const warnings: CoherenceWarning[] = [];
  for (let i = 1; i < sorted.length; i++) {
    for (let j = 0; j < i; j++) warnings.push(...checkPair(sorted[j], sorted[i]));
  }
  return warnings;
}

export function warningsFor(alibiId: string, warnings: CoherenceWarning[]): CoherenceWarning[] {
  return warnings.filter((w) => w.alibiIds.includes(alibiId));
}
