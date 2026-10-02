export const CATEGORIES = ['family', 'friends', 'work', 'admin', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ['todo', 'ready', 'ongoing', 'resolved', 'busted'] as const;
export type Status = (typeof STATUSES)[number];

export const URGENCIES = [1, 2, 3, 4] as const;
export type Urgency = (typeof URGENCIES)[number];

export const TONES = ['sober', 'friendly', 'theatrical'] as const;
export type Tone = (typeof TONES)[number];

export const BOLDNESS = ['plausible', 'bold', 'absurd'] as const;
export type Boldness = (typeof BOLDNESS)[number];

export const INTENTS = ['decline', 'cancel', 'late', 'leave', 'refund'] as const;
export type Intent = (typeof INTENTS)[number];

export interface Mess {
  id: string;
  title: string;
  person: string;
  category: Category;
  /** Event date, YYYY-MM-DD. */
  eventDate: string;
  urgency: Urgency;
  status: Status;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alibi {
  id: string;
  messId: string;
  templateId: string;
  /** Family of excuse, used to spot reuse with the same person. */
  excuseKey: string;
  title: string;
  message: string;
  recipient: string;
  /** Date covered by the alibi, YYYY-MM-DD. */
  date: string;
  /** HH:MM */
  startTime: string;
  /** HH:MM */
  endTime: string;
  /** Where the alibi claims you are. Empty when not stated. */
  location: string;
  /** What the alibi claims you are busy doing. */
  activity: string;
  tone: Tone;
  boldness: Boldness;
  intent: Intent;
  credibility: number;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  messId: string | null;
  label: string;
  /** YYYY-MM-DD */
  dueDate: string;
  done: boolean;
  doneAt: string | null;
  createdAt: string;
}

export const SCHEMA_VERSION = 1;

export interface AppData {
  version: typeof SCHEMA_VERSION;
  messes: Mess[];
  alibis: Alibi[];
  followUps: FollowUp[];
}

export function emptyData(): AppData {
  return { version: SCHEMA_VERSION, messes: [], alibis: [], followUps: [] };
}
