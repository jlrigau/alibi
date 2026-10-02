import { addDays, today } from './dates';
import { newId, nowISO } from './ids';
import type { Alibi, AppData, FollowUp, Mess } from './types';

/** Fictional dossiers, loaded only when the user asks for them. */
export function buildSamples(ref: string = today()): Pick<AppData, 'messes' | 'alibis' | 'followUps'> {
  const now = nowISO();
  const mess = (m: Omit<Mess, 'id' | 'createdAt' | 'updatedAt' | 'notes'> & { notes?: string }): Mess => ({
    id: newId('mess'),
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...m,
  });

  const dinner = mess({
    title: 'Dîner chez Tante Odile',
    person: 'Tante Odile',
    category: 'family',
    eventDate: addDays(ref, 3),
    urgency: 3,
    status: 'ready',
    notes: 'Gratin de chou-fleur annoncé. Troisième fois ce trimestre.',
  });
  const farewell = mess({
    title: 'Pot de départ de Bertrand (compta)',
    person: 'Bertrand',
    category: 'work',
    eventDate: addDays(ref, 3),
    urgency: 2,
    status: 'ready',
  });
  const group = mess({
    title: 'Quitter le groupe « Rando des copains 2019 »',
    person: 'Rando des copains 2019',
    category: 'friends',
    eventDate: addDays(ref, 1),
    urgency: 2,
    status: 'todo',
    notes: '412 messages non lus. Aucune rando depuis 2019.',
  });
  const money = mess({
    title: 'Récupérer les 20 € prêtés à Karim',
    person: 'Karim',
    category: 'friends',
    eventDate: addDays(ref, -12),
    urgency: 1,
    status: 'ongoing',
  });
  const passport = mess({
    title: 'Expliquer le retard du dossier de passeport',
    person: 'Guichet de la mairie',
    category: 'admin',
    eventDate: addDays(ref, 6),
    urgency: 4,
    status: 'todo',
  });

  const alibi = (a: Omit<Alibi, 'id' | 'createdAt'>, minutesAgo: number): Alibi => ({
    id: newId('alibi'),
    createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    ...a,
  });

  const alibis: Alibi[] = [
    alibi(
      {
        messId: dinner.id,
        templateId: 'abs-cold',
        excuseKey: 'illness',
        title: 'Le rhume carabiné',
        message:
          'Coucou Tante Odile !\n\nJ’ai attrapé un rhume carabiné et je préfère ne contaminer personne. Ma boîte de mouchoirs et moi, on reste à la maison. Du coup, je vais devoir passer mon tour, et ça me fend le cœur.\n\nOn se rattrape très vite, promis !',
        recipient: 'Tante Odile',
        date: dinner.eventDate,
        startTime: '19:00',
        endTime: '23:00',
        location: 'Chez moi',
        activity: 'Convalescence sous plaid',
        tone: 'friendly',
        boldness: 'plausible',
        intent: 'decline',
        credibility: 84,
      },
      60,
    ),
    alibi(
      {
        messId: farewell.id,
        templateId: 'custom-lyon',
        excuseKey: 'business-trip',
        title: 'Le séminaire à Lyon',
        message:
          'Bonjour Bertrand,\n\nJe suis en séminaire à Lyon ce jour-là, je ne pourrai donc pas venir à ton pot. Je te souhaite le meilleur pour la suite !',
        recipient: 'Bertrand',
        date: farewell.eventDate,
        startTime: '18:00',
        endTime: '21:00',
        location: 'Lyon',
        activity: 'Séminaire',
        tone: 'sober',
        boldness: 'bold',
        intent: 'decline',
        credibility: 61,
      },
      30,
    ),
  ];

  const followUp = (label: string, dueDate: string, messId: string): FollowUp => ({
    id: newId('fu'),
    messId,
    label,
    dueDate,
    done: false,
    doneAt: null,
    createdAt: now,
  });

  return {
    messes: [dinner, farewell, group, money, passport],
    alibis,
    followUps: [
      followUp('Relancer Karim pour les 20 €', addDays(ref, -2), money.id),
      followUp('Dire à Tante Odile que ça va mieux', addDays(dinner.eventDate, 1), dinner.id),
      followUp('Ne pas reprendre l’excuse du rhume vendredi', addDays(ref, 8), dinner.id),
    ],
  };
}
