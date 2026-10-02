import type { Boldness, Category, Intent, Status, Tone, Urgency } from './types';

export const CATEGORY_LABELS: Record<Category, string> = {
  family: 'Famille',
  friends: 'Amis',
  work: 'Travail',
  admin: 'Administratif',
  other: 'Autre',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  family: '🏡',
  friends: '🍻',
  work: '💼',
  admin: '🗂️',
  other: '🌀',
};

export const STATUS_LABELS: Record<Status, string> = {
  todo: 'À gérer',
  ready: 'Alibi prêt',
  ongoing: 'En cours',
  resolved: 'Résolu',
  busted: 'Grillé',
};

export const URGENCY_LABELS: Record<Urgency, string> = {
  1: 'Ça peut attendre',
  2: 'À surveiller',
  3: 'Urgent',
  4: 'Alerte rouge',
};

export const TONE_LABELS: Record<Tone, string> = {
  sober: 'Sobre',
  friendly: 'Sympathique',
  theatrical: 'Théâtral',
};

export const BOLDNESS_LABELS: Record<Boldness, string> = {
  plausible: 'Plausible',
  bold: 'Audacieux',
  absurd: 'Franchement absurde',
};

export const INTENT_LABELS: Record<Intent, string> = {
  decline: 'Décliner une invitation',
  cancel: 'Annuler un engagement',
  late: 'Justifier un retard',
  leave: 'Quitter un groupe',
  refund: 'Récupérer un dû',
};
