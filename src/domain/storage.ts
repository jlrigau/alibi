import { isValidISODate, isValidTime } from './dates';
import {
  BOLDNESS,
  CATEGORIES,
  INTENTS,
  SCHEMA_VERSION,
  STATUSES,
  TONES,
  URGENCIES,
  emptyData,
  type Alibi,
  type AppData,
  type FollowUp,
  type Mess,
} from './types';

export const STORAGE_KEY = 'ca-sarrange:data';
export const CORRUPT_BACKUP_PREFIX = 'ca-sarrange:corrupt:';
export const EXPORT_APP_ID = 'ca-sarrange';

const MAX_TEXT = 5000;

export type ValidationResult = { ok: true; data: AppData } | { ok: false; error: string };

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown, max = MAX_TEXT): v is string => typeof v === 'string' && v.length <= max;
const isId = (v: unknown): v is string => isStr(v, 100) && v.length > 0;
const isTimestamp = (v: unknown): v is string => isStr(v, 40) && !Number.isNaN(Date.parse(v));
const oneOf = <T>(list: readonly T[], v: unknown): v is T => list.includes(v as T);

function checkMess(v: unknown): string | null {
  if (!isObj(v)) return 'une galère n’est pas un objet';
  if (!isId(v.id)) return 'identifiant de galère invalide';
  if (!isStr(v.title, 200) || !v.title.trim()) return 'titre de galère manquant';
  if (!isStr(v.person, 200)) return 'personne concernée invalide';
  if (!oneOf(CATEGORIES, v.category)) return 'catégorie inconnue';
  if (!isValidISODate(v.eventDate)) return 'date d’événement invalide';
  if (!oneOf(URGENCIES, v.urgency)) return 'niveau d’urgence invalide';
  if (!oneOf(STATUSES, v.status)) return 'statut inconnu';
  if (!isStr(v.notes)) return 'notes invalides';
  if (!isTimestamp(v.createdAt) || !isTimestamp(v.updatedAt)) return 'horodatage de galère invalide';
  return null;
}

function checkAlibi(v: unknown): string | null {
  if (!isObj(v)) return 'un alibi n’est pas un objet';
  if (!isId(v.id) || !isId(v.messId)) return 'identifiant d’alibi invalide';
  if (!isStr(v.templateId, 100) || !isStr(v.excuseKey, 100)) return 'modèle d’alibi invalide';
  if (!isStr(v.title, 200) || !isStr(v.message) || !isStr(v.recipient, 200)) return 'texte d’alibi invalide';
  if (!isValidISODate(v.date)) return 'date d’alibi invalide';
  if (!isValidTime(v.startTime) || !isValidTime(v.endTime)) return 'créneau d’alibi invalide';
  if (!isStr(v.location, 200) || !isStr(v.activity, 200)) return 'lieu ou activité invalide';
  if (!oneOf(TONES, v.tone) || !oneOf(BOLDNESS, v.boldness) || !oneOf(INTENTS, v.intent))
    return 'réglages d’alibi inconnus';
  if (typeof v.credibility !== 'number' || v.credibility < 0 || v.credibility > 100) return 'indice de crédibilité invalide';
  if (!isTimestamp(v.createdAt)) return 'horodatage d’alibi invalide';
  return null;
}

function checkFollowUp(v: unknown): string | null {
  if (!isObj(v)) return 'un suivi n’est pas un objet';
  if (!isId(v.id)) return 'identifiant de suivi invalide';
  if (v.messId !== null && !isId(v.messId)) return 'galère liée au suivi invalide';
  if (!isStr(v.label, 300) || !v.label.trim()) return 'intitulé de suivi manquant';
  if (!isValidISODate(v.dueDate)) return 'échéance de suivi invalide';
  if (typeof v.done !== 'boolean') return 'état de suivi invalide';
  if (v.doneAt !== null && !isTimestamp(v.doneAt)) return 'date de fin de suivi invalide';
  if (!isTimestamp(v.createdAt)) return 'horodatage de suivi invalide';
  return null;
}

function checkList(list: unknown, name: string, check: (v: unknown) => string | null): string | null {
  if (!Array.isArray(list)) return `la liste « ${name} » est absente`;
  const ids = new Set<string>();
  for (let i = 0; i < list.length; i++) {
    const err = check(list[i]);
    if (err) return `${name} n°${i + 1} : ${err}`;
    const id = (list[i] as Obj).id as string;
    if (ids.has(id)) return `${name} n°${i + 1} : identifiant en double`;
    ids.add(id);
  }
  return null;
}

/**
 * Upgrades older payloads to the current schema. Only version 1 exists so far;
 * future versions add a step here instead of breaking existing browsers.
 */
export function migrate(raw: unknown): unknown {
  if (!isObj(raw)) return raw;
  if (raw.version === SCHEMA_VERSION) return raw;
  return raw;
}

/** Validates an untrusted payload (localStorage or imported file) against the current schema. */
export function validateData(input: unknown): ValidationResult {
  const raw = migrate(input);
  if (!isObj(raw)) return { ok: false, error: 'Le contenu n’est pas un dossier valide.' };
  if (typeof raw.version !== 'number') return { ok: false, error: 'Version du schéma absente.' };
  if (raw.version > SCHEMA_VERSION)
    return { ok: false, error: 'Ce dossier vient d’une version plus récente de l’application.' };
  if (raw.version !== SCHEMA_VERSION) return { ok: false, error: `Version de schéma inconnue (${raw.version}).` };

  const err =
    checkList(raw.messes, 'Galère', checkMess) ??
    checkList(raw.alibis, 'Alibi', checkAlibi) ??
    checkList(raw.followUps, 'Suivi', checkFollowUp);
  if (err) return { ok: false, error: err.charAt(0).toUpperCase() + err.slice(1) + '.' };

  return {
    ok: true,
    data: {
      version: SCHEMA_VERSION,
      messes: raw.messes as Mess[],
      alibis: raw.alibis as Alibi[],
      followUps: raw.followUps as FollowUp[],
    },
  };
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LoadResult =
  | { status: 'empty'; data: AppData }
  | { status: 'ok'; data: AppData }
  | { status: 'corrupt'; data: AppData; backupKey: string | null; error: string }
  | { status: 'unavailable'; data: AppData };

/** Reads saved data. Corrupt content is moved aside (never silently discarded) and an empty dossier is returned. */
export function loadData(storage: StorageLike | null): LoadResult {
  if (!storage) return { status: 'unavailable', data: emptyData() };
  let text: string | null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    return { status: 'unavailable', data: emptyData() };
  }
  if (text === null) return { status: 'empty', data: emptyData() };

  let error: string;
  try {
    const result = validateData(JSON.parse(text));
    if (result.ok) return { status: 'ok', data: result.data };
    error = result.error;
  } catch {
    error = 'Le contenu enregistré n’est pas du JSON lisible.';
  }

  let backupKey: string | null = CORRUPT_BACKUP_PREFIX + new Date().toISOString();
  try {
    storage.setItem(backupKey, text);
    storage.removeItem(STORAGE_KEY);
  } catch {
    backupKey = null;
  }
  return { status: 'corrupt', data: emptyData(), backupKey, error };
}

export function saveData(storage: StorageLike | null, data: AppData): { ok: true } | { ok: false; error: string } {
  if (!storage) return { ok: false, error: 'Le stockage local est indisponible dans ce navigateur.' };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (e) {
    const quota = e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22);
    return {
      ok: false,
      error: quota ? 'Le stockage de ce navigateur est plein.' : 'Le navigateur a refusé l’enregistrement.',
    };
  }
}

export function getBrowserStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Serializes data in the export envelope. */
export function exportData(data: AppData, now: Date = new Date()): string {
  return JSON.stringify({ app: EXPORT_APP_ID, exportedAt: now.toISOString(), ...data }, null, 2);
}

/** Parses an export file. Nothing is modified here: the caller applies the result only after confirmation. */
export function parseImport(text: string): ValidationResult {
  if (text.length > 5_000_000) return { ok: false, error: 'Fichier trop volumineux pour un dossier de mauvaise foi.' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Ce fichier n’est pas du JSON valide.' };
  }
  if (!isObj(raw)) return { ok: false, error: 'Le fichier ne contient pas un dossier.' };
  if (raw.app !== EXPORT_APP_ID) return { ok: false, error: 'Ce fichier ne provient pas de « Ça s’arrange ».' };
  const { app: _app, exportedAt: _exportedAt, ...rest } = raw;
  return validateData(rest);
}
