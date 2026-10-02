import { describe, expect, it } from 'vitest';
import { checkCandidate, checkHistory, placePhrase, slotsOverlap, type AlibiFacts } from './coherence';

const base = (over: Partial<AlibiFacts & { createdAt: string }>): AlibiFacts & { createdAt: string } => ({
  id: 'a',
  excuseKey: 'illness',
  title: 'Le rhume carabiné',
  recipient: 'Tante Odile',
  date: '2026-10-10',
  startTime: '19:00',
  endTime: '23:00',
  location: 'Chez moi',
  activity: 'Convalescence',
  createdAt: '2026-10-01T10:00:00.000Z',
  ...over,
});

describe('slotsOverlap', () => {
  it('detects overlapping slots on the same day', () => {
    expect(slotsOverlap(base({}), base({ startTime: '22:00', endTime: '23:30' }))).toBe(true);
  });
  it('treats touching slots as compatible', () => {
    expect(slotsOverlap(base({ startTime: '14:00', endTime: '18:00' }), base({ startTime: '18:00', endTime: '20:00' }))).toBe(false);
  });
  it('ignores other days', () => {
    expect(slotsOverlap(base({}), base({ date: '2026-10-11' }))).toBe(false);
  });
  it('handles slots running past midnight', () => {
    expect(slotsOverlap(base({ startTime: '22:00', endTime: '02:00' }), base({ startTime: '23:30', endTime: '23:45' }))).toBe(true);
  });
});

describe('reused excuse rule', () => {
  it('warns when the same excuse goes to the same person, whatever the case and accents', () => {
    const prev = base({ id: 'p', date: '2026-09-01' });
    const next = base({ id: 'n', recipient: '  tante odile ', date: '2026-10-20' });
    const w = checkCandidate(next, [prev]);
    expect(w).toHaveLength(1);
    expect(w[0].kind).toBe('reused');
    expect(w[0].title).toBe('Cette excuse a déjà beaucoup servi');
  });
  it('stays quiet for another person or another excuse', () => {
    const prev = base({ id: 'p', date: '2026-09-01' });
    expect(checkCandidate(base({ id: 'n', recipient: 'Karim', date: '2026-10-20' }), [prev])).toEqual([]);
    expect(checkCandidate(base({ id: 'n', excuseKey: 'delivery', date: '2026-10-20' }), [prev])).toEqual([]);
  });
  it('ignores an empty recipient', () => {
    const prev = base({ id: 'p', recipient: '', date: '2026-09-01' });
    expect(checkCandidate(base({ id: 'n', recipient: '', date: '2026-10-20' }), [prev])).toEqual([]);
  });
});

describe('location rule', () => {
  it('warns about different places on overlapping slots', () => {
    const prev = base({ id: 'p', recipient: 'Bertrand', excuseKey: 'trip', location: 'Lyon', activity: 'Séminaire' });
    const next = base({ id: 'n' });
    const w = checkCandidate(next, [prev]);
    expect(w.map((x) => x.kind)).toEqual(['location']);
    expect(w[0].message).toContain('censé être à Lyon à cette heure-là');
    expect(w[0].message).toContain('téléportation');
  });
  it('considers places equal when only case or accents differ', () => {
    const prev = base({ id: 'p', recipient: 'Bertrand', excuseKey: 'x', location: 'chez MOI' });
    expect(checkCandidate(base({ id: 'n' }), [prev]).filter((w) => w.kind === 'location')).toEqual([]);
  });
  it('skips when a place is not stated or slots do not overlap', () => {
    const prev = base({ id: 'p', recipient: 'Bertrand', excuseKey: 'x', location: '', activity: '' });
    expect(checkCandidate(base({ id: 'n' }), [prev])).toEqual([]);
    const far = base({ id: 'p', recipient: 'Bertrand', excuseKey: 'x', location: 'Lyon', startTime: '08:00', endTime: '12:00' });
    expect(checkCandidate(base({ id: 'n' }), [far])).toEqual([]);
  });
});

describe('commitment rule', () => {
  it('warns about two different commitments at the same time and place', () => {
    const prev = base({ id: 'p', recipient: 'Karim', excuseKey: 'delivery', activity: 'Attente d’un colis' });
    const w = checkCandidate(base({ id: 'n' }), [prev]);
    expect(w.map((x) => x.kind)).toEqual(['commitment']);
    expect(w[0].message).toContain('Attente d’un colis');
  });
  it('also applies when one place is unknown', () => {
    const prev = base({ id: 'p', recipient: 'Karim', excuseKey: 'x', location: '', activity: 'Réunion client' });
    expect(checkCandidate(base({ id: 'n' }), [prev]).map((x) => x.kind)).toEqual(['commitment']);
  });
  it('does not double-report a location conflict as a commitment conflict', () => {
    const prev = base({ id: 'p', recipient: 'Karim', excuseKey: 'x', location: 'Lyon', activity: 'Séminaire' });
    expect(checkCandidate(base({ id: 'n' }), [prev]).map((x) => x.kind)).toEqual(['location']);
  });
});

describe('checkHistory', () => {
  it('reports each conflicting pair once, older alibi first', () => {
    const a = base({ id: 'a', createdAt: '2026-10-01T10:00:00.000Z' });
    const b = base({ id: 'b', recipient: 'Bertrand', excuseKey: 'trip', location: 'Lyon', createdAt: '2026-10-02T10:00:00.000Z' });
    const c = base({ id: 'c', date: '2026-12-01', createdAt: '2026-10-03T10:00:00.000Z' });
    const w = checkHistory([c, b, a]);
    expect(w).toHaveLength(2);
    expect(w.find((x) => x.kind === 'location')?.alibiIds).toEqual(['a', 'b']);
    expect(w.find((x) => x.kind === 'reused')?.alibiIds).toEqual(['a', 'c']);
  });
  it('returns nothing for a clean history', () => {
    expect(checkHistory([base({ id: 'a' })])).toEqual([]);
  });
});

describe('placePhrase', () => {
  it('keeps prepositional places and prefixes bare ones', () => {
    expect(placePhrase('Chez moi')).toBe('chez moi');
    expect(placePhrase('Au bureau')).toBe('au bureau');
    expect(placePhrase('À la préfecture')).toBe('à la préfecture');
    expect(placePhrase(' Lyon ')).toBe('à Lyon');
  });
});
