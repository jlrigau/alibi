import { checkCandidate, type AlibiFacts, type CoherenceWarning } from './coherence';
import { addDays, formatRelative, today as todayISO } from './dates';
import { normalize } from './ids';
import { INTENT_GROUP, TEMPLATES, type AlibiTemplate, type TemplateGroup } from './templates';
import { BOLDNESS, type Alibi, type Boldness, type Category, type Intent, type Tone } from './types';

export interface SlotPreset {
  id: string;
  label: string;
  start: string;
  end: string;
  /** Adverbial phrase appended to the date: "demain en soirée". */
  phrase: string;
}

export const SLOT_PRESETS: SlotPreset[] = [
  { id: 'morning', label: 'Matinée (8 h – 12 h)', start: '08:00', end: '12:00', phrase: 'dans la matinée' },
  { id: 'lunch', label: 'Midi (12 h – 14 h)', start: '12:00', end: '14:00', phrase: 'à midi' },
  { id: 'afternoon', label: 'Après-midi (14 h – 18 h)', start: '14:00', end: '18:00', phrase: 'dans l’après-midi' },
  { id: 'evening', label: 'Soirée (19 h – 23 h)', start: '19:00', end: '23:00', phrase: 'en soirée' },
  { id: 'day', label: 'Toute la journée (8 h – 23 h)', start: '08:00', end: '23:00', phrase: 'toute la journée' },
];

export interface GeneratorInput {
  situation: string;
  person: string;
  category: Category;
  date: string;
  startTime: string;
  endTime: string;
  /** Preset id, or 'custom'. */
  slotId: string;
  intent: Intent;
  tone: Tone;
  boldness: Boldness;
}

export interface Proposal {
  key: string;
  templateId: string;
  excuseKey: string;
  title: string;
  message: string;
  location: string;
  activity: string;
  credibility: number;
  credibilityLabel: string;
  verdict: string;
  followUps: { label: string; dueDate: string }[];
}

/** Small deterministic PRNG so a given seed always yields the same proposals (handy for tests). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


function shuffle<T>(rng: () => number, list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const OPENERS: Record<Tone, string[]> = {
  sober: ['Bonjour {person},', 'Bonjour {person}, un petit mot rapide.', 'Bonjour {person}, je préfère te prévenir dès maintenant.'],
  friendly: ['Coucou {person} !', 'Hello {person} !', '{person} ! Petit souci de mon côté…'],
  theatrical: [
    '{person}, assieds-toi. J’ai une nouvelle difficile à t’annoncer.',
    'Ô {person}, si tu savais…',
    '{person}, le sort s’acharne, et tu vas vite comprendre pourquoi.',
  ],
};

const GROUP_OPENERS: Record<Tone, string[]> = {
  sober: ['Bonjour à toutes et à tous,', 'Bonjour à tous,'],
  friendly: ['Coucou tout le monde !', 'Hello la compagnie !'],
  theatrical: ['Chers membres de ce groupe, l’heure est grave.', 'Mes amis, ce message est difficile à écrire.'],
};

const CONSEQUENCES: Record<Intent, Record<Tone, string[]>> = {
  decline: {
    sober: ['Je ne pourrai donc pas venir {when}.', 'Je vais devoir décliner pour {when}.'],
    friendly: ['Du coup, je vais devoir passer mon tour {when}, et ça me fend le cœur.', 'Je ne pourrai pas être là {when}, mais je lève mon verre à distance !'],
    theatrical: ['Je ne pourrai donc pas être des vôtres {when}. Le destin a tranché, et il a la main lourde.', 'Il me faut renoncer, {when}, à ce moment tant attendu. Ma chaise restera vide, mais mon cœur sera présent.'],
  },
  cancel: {
    sober: ['Je dois malheureusement annuler pour {when}.', 'Je suis dans l’obligation d’annuler ce qui était prévu {when}.'],
    friendly: ['Je vais devoir annuler pour {when}, je m’en veux terriblement.', 'Je dois annuler {when}, on reprogramme très vite ?'],
    theatrical: ['La mort dans l’âme, je dois annuler ce qui était prévu {when}.', 'Je dois annuler pour {when}. Je sais. Moi non plus, je ne m’en remets pas.'],
  },
  late: {
    sober: ['J’arrive dès que possible, toutes mes excuses pour le retard.', 'Je risque d’avoir un peu de retard, je fais au plus vite.'],
    friendly: ['J’arrive au plus vite, gardez-moi une place !', 'Je serai un peu en retard, commencez sans moi !'],
    theatrical: ['J’arrive, tel un héros tragique, avec un peu de retard et beaucoup de dignité.', 'Le temps s’est ligué contre moi, mais j’arrive. Lentement. Mais j’arrive.'],
  },
  leave: {
    sober: ['Je quitte donc le groupe. Merci pour tous les échanges !', 'Je vais donc quitter ce groupe. Bonne continuation à tous.'],
    friendly: ['Je file, mais vous pouvez toujours m’écrire en privé. Bises à tous !', 'Je m’éclipse du groupe, mais pas de vos vies, promis !'],
    theatrical: ['Je quitte donc ce groupe, le cœur lourd et la batterie légère. Adieu, et merci pour les mèmes.', 'Je m’en vais. Ne pleurez pas. Ou alors un peu.'],
  },
  refund: {
    sober: ['Merci d’avance !', 'Merci beaucoup, à bientôt.'],
    friendly: ['Merci, t’es au top !', 'Merci mille fois, et à charge de revanche !'],
    theatrical: ['Je compte sur toi. Mon portefeuille aussi, il te salue bien bas.', 'Mon compte en banque attend ton geste avec une émotion palpable.'],
  },
};

const CLOSINGS: Record<Tone, string[]> = {
  sober: ['Merci de ta compréhension.', 'Toutes mes excuses.', 'Merci d’avance pour ta compréhension.'],
  friendly: ['On se rattrape très vite, promis !', 'Je t’embrasse, et encore pardon !', 'Je te revaudrai ça !'],
  theatrical: ['Pense à moi. Moi, je pense surtout à ce qui m’arrive.', 'Je te laisse, le destin m’appelle (il insiste).', 'Garde ce message comme le témoignage d’une époque difficile.'],
};

const GENERIC_FOLLOW_UPS: Record<TemplateGroup, (person: string) => { label: string; offsetDays: number }[]> = {
  absence: (person) => [
    { label: 'Demander comment ça s’est passé', offsetDays: 1 },
    { label: person ? `Ne pas reprendre la même excuse avec ${person}` : 'Ne pas reprendre la même excuse', offsetDays: 7 },
  ],
  late: () => [{ label: 'Arriver avec des viennoiseries la prochaine fois', offsetDays: 1 }],
  leave: () => [{ label: 'Préparer une réponse si on me demande pourquoi', offsetDays: 2 }],
  refund: () => [{ label: 'Vérifier si le virement est arrivé', offsetDays: 5 }],
};

const AMOUNT_RE = /(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?\b|eur\b)/i;

/** Only structured bit read from free text: an explicit amount like "20 €" in the situation. */
export function extractAmount(situation: string): string | null {
  const m = situation.match(AMOUNT_RE);
  return m ? `${m[1].replace('.', ',')} €` : null;
}

function fill(text: string, vars: Record<string, string>): string {
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    if (!value) {
      out = out
        .replace(new RegExp(`\\{${key}\\}, `, 'g'), '')
        .replace(new RegExp(` \\{${key}\\}`, 'g'), '')
        .replace(new RegExp(`\\{${key}\\} ?`, 'g'), '');
    } else {
      out = out.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
  }
  // Fix sentences that now start with punctuation or lowercase after removals.
  out = out.replace(/^\s*[,!]\s*/, '').replace(/^\s*(\p{Ll})/u, (c) => c.toUpperCase());
  return out.replace(/\s{2,}/g, ' ').trim();
}

export function whenPhrase(input: Pick<GeneratorInput, 'date' | 'slotId' | 'startTime'>, ref: string = todayISO()): string {
  const day = formatRelative(input.date, ref);
  const preset = SLOT_PRESETS.find((s) => s.id === input.slotId);
  if (preset) return `${day} ${preset.phrase}`;
  const [h, m] = input.startTime.split(':');
  return `${day} vers ${Number(h)} h${m === '00' ? '' : ` ${m}`}`;
}

export function credibilityLabel(score: number): string {
  if (score >= 80) return 'Inattaquable';
  if (score >= 60) return 'Tient la route';
  if (score >= 40) return 'Fragile mais digne';
  if (score >= 20) return 'Acrobatique';
  return 'Légende urbaine';
}

const TONE_MODIFIER: Record<Tone, number> = { sober: 4, friendly: 0, theatrical: -7 };

function scoreFor(
  t: AlibiTemplate,
  input: GeneratorInput,
  history: Pick<Alibi, 'recipient' | 'excuseKey'>[],
  rng: () => number,
): number {
  const who = normalize(input.person);
  const withPerson = who ? history.filter((a) => normalize(a.recipient) === who) : [];
  let score = t.credibility + TONE_MODIFIER[input.tone];
  if (t.categories?.includes(input.category)) score += 4;
  score -= Math.min(20, withPerson.length * 4);
  if (withPerson.some((a) => a.excuseKey === t.excuseKey)) score -= 25;
  score += Math.round(rng() * 8 - 4);
  return Math.max(1, Math.min(99, Math.round(score)));
}

function candidatesFor(group: TemplateGroup, boldness: Boldness, category: Category): AlibiTemplate[] {
  const fits = (t: AlibiTemplate) => t.group === group && (!t.categories || t.categories.includes(category));
  const exact = TEMPLATES.filter((t) => fits(t) && t.boldness === boldness);
  if (exact.length >= 3) return exact;
  // Not enough stories at this level: borrow from the neighbouring level(s).
  const idx = BOLDNESS.indexOf(boldness);
  const neighbours = BOLDNESS.filter((_, i) => Math.abs(i - idx) === 1);
  return [...exact, ...TEMPLATES.filter((t) => fits(t) && neighbours.includes(t.boldness))];
}

/**
 * Builds three different proposals from local templates and rules.
 * Free text is only used verbatim (names) or for a basic amount lookup; nothing pretends to understand it.
 */
export function generateProposals(
  input: GeneratorInput,
  history: Alibi[],
  seed: number,
  ref: string = todayISO(),
): Proposal[] {
  const rng = mulberry32(seed);
  const group = INTENT_GROUP[input.intent];
  const who = normalize(input.person);
  const usedKeys = new Set(history.filter((a) => who && normalize(a.recipient) === who).map((a) => a.excuseKey));

  // Fresh stories first (never used with this person), then the rest; one story per excuse family.
  const pool = shuffle(rng, candidatesFor(group, input.boldness, input.category));
  const ordered = [...pool.filter((t) => !usedKeys.has(t.excuseKey)), ...pool.filter((t) => usedKeys.has(t.excuseKey))];
  const chosen: AlibiTemplate[] = [];
  for (const t of ordered) {
    if (chosen.length === 3) break;
    if (!chosen.some((c) => c.excuseKey === t.excuseKey)) chosen.push(t);
  }

  const when = whenPhrase(input, ref);
  const amount = extractAmount(input.situation) ?? 'les sous';
  const person = input.person.trim();
  const openers = shuffle(rng, group === 'leave' ? GROUP_OPENERS[input.tone] : OPENERS[input.tone]);
  const consequences = shuffle(rng, CONSEQUENCES[input.intent][input.tone]);
  const closings = shuffle(rng, CLOSINGS[input.tone]);

  return chosen.map((t, i) => {
    const vars = { person, when, amount };
    const parts = [
      fill(openers[i % openers.length], vars),
      `${fill(t.reason, vars)} ${fill(consequences[i % consequences.length], vars)}`,
    ];
    if (group === 'absence' || group === 'late') parts.push(fill(closings[i % closings.length], vars));
    const credibility = scoreFor(t, input, history, rng);
    const hints = [...t.followUps, ...GENERIC_FOLLOW_UPS[group](person)];
    const followUps = hints.map((h) => {
      const due = addDays(input.date, h.offsetDays);
      return { label: h.label, dueDate: due < ref ? ref : due };
    });
    return {
      key: `${seed}-${t.id}`,
      templateId: t.id,
      excuseKey: t.excuseKey,
      title: t.title,
      message: parts.join('\n\n'),
      location: t.location,
      activity: t.activity,
      credibility,
      credibilityLabel: credibilityLabel(credibility),
      verdict: t.verdict,
      followUps,
    };
  });
}

/** Coherence preview for a proposal that is not saved yet. */
export function previewWarnings(
  proposal: Pick<Proposal, 'excuseKey' | 'title' | 'location' | 'activity'>,
  input: Pick<GeneratorInput, 'person' | 'date' | 'startTime' | 'endTime'>,
  history: AlibiFacts[],
): CoherenceWarning[] {
  return checkCandidate(
    {
      id: '__candidate__',
      excuseKey: proposal.excuseKey,
      title: proposal.title,
      recipient: input.person,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      location: proposal.location,
      activity: proposal.activity,
    },
    history,
  );
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
