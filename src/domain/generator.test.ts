import { describe, expect, it } from 'vitest';
import { extractAmount, generateProposals, whenPhrase, type GeneratorInput } from './generator';
import { TEMPLATES } from './templates';
import { BOLDNESS, CATEGORIES, INTENTS, TONES, type Alibi } from './types';

const input = (over: Partial<GeneratorInput> = {}): GeneratorInput => ({
  situation: 'Dîner chez Tante Odile',
  person: 'Tante Odile',
  category: 'family',
  date: '2026-10-03',
  startTime: '19:00',
  endTime: '23:00',
  slotId: 'evening',
  intent: 'decline',
  tone: 'friendly',
  boldness: 'plausible',
  ...over,
});

describe('templates', () => {
  it('ships at least 30 templates with unique ids', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
  });
});

describe('generateProposals', () => {
  it('always returns three distinct, fully filled proposals', () => {
    for (const intent of INTENTS)
      for (const tone of TONES)
        for (const boldness of BOLDNESS)
          for (const category of CATEGORIES) {
            const props = generateProposals(input({ intent, tone, boldness, category }), [], 42, '2026-10-02');
            expect(props).toHaveLength(3);
            expect(new Set(props.map((p) => p.excuseKey)).size).toBe(3);
            for (const p of props) {
              expect(p.message).not.toMatch(/[{}]/);
              expect(p.credibility).toBeGreaterThanOrEqual(1);
              expect(p.credibility).toBeLessThanOrEqual(99);
            }
          }
  });

  it('is deterministic for a seed and varies across seeds', () => {
    const a = generateProposals(input(), [], 1, '2026-10-02');
    expect(generateProposals(input(), [], 1, '2026-10-02')).toEqual(a);
    const seen = new Set<string>();
    for (let s = 0; s < 20; s++) generateProposals(input(), [], s, '2026-10-02').forEach((p) => seen.add(p.templateId));
    expect(seen.size).toBeGreaterThan(3);
  });

  it('prefers stories not yet used with this person and lowers the score of reused ones', () => {
    const used = { recipient: 'tante odile', excuseKey: 'illness' } as Alibi;
    for (let s = 0; s < 30; s++) {
      const props = generateProposals(input(), [used], s, '2026-10-02');
      expect(props.map((p) => p.excuseKey)).not.toContain('illness');
    }
  });

  it('works without a person name', () => {
    const [p] = generateProposals(input({ person: '' }), [], 3, '2026-10-02');
    expect(p.message.startsWith(' ')).toBe(false);
    expect(p.message).not.toMatch(/ ,|  |^[,!]/m);
  });

  it('uses the amount found in the situation for refunds', () => {
    const props = generateProposals(input({ intent: 'refund', situation: 'Récupérer les 20 € prêtés' }), [], 5, '2026-10-02');
    expect(props.every((p) => p.message.includes('20 €'))).toBe(true);
  });
});

describe('helpers', () => {
  it('extracts amounts', () => {
    expect(extractAmount('les 20 € de Karim')).toBe('20 €');
    expect(extractAmount('rendre 12.50 euros')).toBe('12,50 €');
    expect(extractAmount('rien')).toBeNull();
  });
  it('builds a readable time phrase', () => {
    expect(whenPhrase({ date: '2026-10-03', slotId: 'evening', startTime: '19:00' }, '2026-10-02')).toBe('demain en soirée');
    expect(whenPhrase({ date: '2026-10-02', slotId: 'custom', startTime: '18:30' }, '2026-10-02')).toBe('aujourd’hui vers 18 h 30');
  });
});
