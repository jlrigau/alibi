import type { Boldness, Category, Intent } from './types';

export type TemplateGroup = 'absence' | 'late' | 'leave' | 'refund';

export const INTENT_GROUP: Record<Intent, TemplateGroup> = {
  decline: 'absence',
  cancel: 'absence',
  late: 'late',
  leave: 'leave',
  refund: 'refund',
};

export interface FollowUpHint {
  label: string;
  /** Days after the alibi date. */
  offsetDays: number;
}

export interface AlibiTemplate {
  id: string;
  /** Family of excuse: two templates with the same key tell the same story. */
  excuseKey: string;
  group: TemplateGroup;
  boldness: Boldness;
  /** Categories the story fits; omitted = all. */
  categories?: Category[];
  title: string;
  /** First-person story. Placeholders: {amount} (refund group). */
  reason: string;
  /** Claimed commitment, used by coherence rules. */
  activity: string;
  /** Claimed place, used by coherence rules. Empty = not stated. */
  location: string;
  /** Starting point of the playful credibility score (0–100). */
  credibility: number;
  verdict: string;
  followUps: FollowUpHint[];
}

const NOT_FAMILY: Category[] = ['friends', 'work', 'admin', 'other'];
const NOT_WORK: Category[] = ['family', 'friends', 'admin', 'other'];

export const TEMPLATES: AlibiTemplate[] = [
  // ── Absence (décliner / annuler) ─────────────────────────────── plausible
  {
    id: 'abs-plumber', excuseKey: 'home-repair', group: 'absence', boldness: 'plausible',
    title: 'Le plombier, ce héros',
    reason: 'Le plombier peut enfin passer pour la fuite sous l’évier et, évidemment, c’est pile sur ce créneau. Si je le rate, il ne revient pas avant le mois prochain.',
    activity: 'Rendez-vous avec le plombier', location: 'Chez moi', credibility: 82,
    verdict: 'Invérifiable et universellement redouté.',
    followUps: [{ label: 'Raconter que la fuite est enfin réparée', offsetDays: 2 }],
  },
  {
    id: 'abs-cold', excuseKey: 'illness', group: 'absence', boldness: 'plausible',
    title: 'Le rhume carabiné',
    reason: 'J’ai attrapé un rhume carabiné et je préfère ne contaminer personne. Ma boîte de mouchoirs et moi, on reste à la maison.',
    activity: 'Convalescence sous plaid', location: 'Chez moi', credibility: 85,
    verdict: 'Classique, sobre, efficace. Éviter d’être vu au cinéma.',
    followUps: [{ label: 'Dire que ça va mieux', offsetDays: 1 }],
  },
  {
    id: 'abs-niece', excuseKey: 'babysitting', group: 'absence', boldness: 'plausible', categories: NOT_FAMILY,
    title: 'La garde au pied levé',
    reason: 'Ma sœur a un imprévu et je dois garder ma nièce au pied levé. Impossible de dire non à une enfant de six ans qui a déjà préparé un spectacle.',
    activity: 'Garde de la nièce', location: 'Chez ma sœur', credibility: 78,
    verdict: 'Solide, tant que personne ne connaît votre sœur.',
    followUps: [{ label: 'Raconter le spectacle de la nièce', offsetDays: 1 }],
  },
  {
    id: 'abs-deadline', excuseKey: 'work-overload', group: 'absence', boldness: 'plausible', categories: NOT_WORK,
    title: 'Le dossier de dernière minute',
    reason: 'On vient de me confier un dossier urgent à rendre demain matin. Je vais devoir rester dessus jusqu’à ce qu’il soit bouclé.',
    activity: 'Dossier urgent', location: 'Au bureau', credibility: 80,
    verdict: 'Personne n’ose contester une deadline.',
    followUps: [{ label: 'Soupirer en évoquant « ce fameux dossier »', offsetDays: 1 }],
  },
  {
    id: 'abs-delivery', excuseKey: 'delivery', group: 'absence', boldness: 'plausible',
    title: 'Le livreur insaisissable',
    reason: 'J’attends une livraison qui ne peut être remise qu’en main propre, sur un créneau de quatre heures. Je suis officiellement otage de mon interphone.',
    activity: 'Attente d’un colis', location: 'Chez moi', credibility: 76,
    verdict: 'Tout le monde a déjà été otage d’un livreur.',
    followUps: [{ label: 'Mentionner que le colis est enfin arrivé', offsetDays: 1 }],
  },
  {
    id: 'abs-doctor', excuseKey: 'medical', group: 'absence', boldness: 'plausible',
    title: 'Le rendez-vous médical déplacé',
    reason: 'Mon rendez-vous chez le médecin a été déplacé et c’est le seul créneau disponible avant trois semaines. Je ne peux pas me permettre de le laisser filer.',
    activity: 'Rendez-vous médical', location: 'Au cabinet médical', credibility: 84,
    verdict: 'Le désert médical est votre meilleur allié.',
    followUps: [{ label: 'Répondre « rien de grave, merci » si on demande', offsetDays: 2 }],
  },
  {
    id: 'abs-client', excuseKey: 'work-conflict', group: 'absence', boldness: 'plausible', categories: ['work'],
    title: 'Le chevauchement de réunions',
    reason: 'Une réunion client vient d’être calée exactement sur ce créneau et je ne peux pas la décaler.',
    activity: 'Réunion client', location: 'Au bureau', credibility: 83,
    verdict: 'Indiscutable, à condition de ne pas publier de story.',
    followUps: [{ label: 'Préparer un compte rendu crédible de la réunion', offsetDays: 1 }],
  },
  // ── Absence ─────────────────────────────────────────────────────── bold
  {
    id: 'abs-cat', excuseKey: 'pet-emergency', group: 'absence', boldness: 'bold',
    title: 'Le chat de la voisine',
    reason: 'Le chat de ma voisine est coincé sur mon balcon et je suis apparemment la seule personne en qui il a confiance. La voisine est en déplacement, la négociation s’annonce longue.',
    activity: 'Sauvetage félin', location: 'Chez moi', credibility: 58,
    verdict: 'Attendrissant. Prévoir une photo de chat.',
    followUps: [{ label: 'Donner des nouvelles du chat', offsetDays: 1 }],
  },
  {
    id: 'abs-car', excuseKey: 'car-trouble', group: 'absence', boldness: 'bold',
    title: 'La batterie à plat',
    reason: 'Ma voiture refuse de démarrer et la dépanneuse m’annonce un passage « entre maintenant et jamais ». Je monte la garde sur le parking.',
    activity: 'Attente de la dépanneuse', location: 'Sur un parking', credibility: 62,
    verdict: 'Crédible, sauf si vous n’avez pas de voiture.',
    followUps: [{ label: 'Se plaindre du prix du garagiste', offsetDays: 3 }],
  },
  {
    id: 'abs-visitor', excuseKey: 'surprise-visit', group: 'absence', boldness: 'bold',
    title: 'La visite surprise',
    reason: 'Un vieil ami de passage en ville débarque à l’improviste et repart dès le lendemain. Je ne peux pas le laisser errer seul dans le quartier.',
    activity: 'Accueil d’un ami de passage', location: 'Chez moi', credibility: 55,
    verdict: 'Plausible, mais suscite des questions sur cet « ami ».',
    followUps: [{ label: 'Choisir un prénom pour cet ami et s’y tenir', offsetDays: 0 }],
  },
  {
    id: 'abs-keys', excuseKey: 'locked-out', group: 'absence', boldness: 'bold',
    title: 'La porte claquée',
    reason: 'Mes clés sont restées à l’intérieur, la porte a claqué et le serrurier a une liste d’attente digne d’un restaurant étoilé.',
    activity: 'Attente du serrurier', location: 'Devant chez moi', credibility: 60,
    verdict: 'Classique du genre, légèrement usé aux entournures.',
    followUps: [{ label: 'Raconter le tarif scandaleux du serrurier', offsetDays: 1 }],
  },
  {
    id: 'abs-training', excuseKey: 'training', group: 'absence', boldness: 'bold',
    title: 'La formation obligatoire',
    reason: 'On m’impose une formation en ligne obligatoire sur la gestion du stress, pile sur ce créneau. L’ironie ne m’échappe pas.',
    activity: 'Formation obligatoire', location: 'Chez moi', credibility: 57,
    verdict: 'L’ironie renforce la crédibilité. Un peu.',
    followUps: [{ label: 'Citer une phrase inspirante de la formation', offsetDays: 1 }],
  },
  {
    id: 'abs-prefecture', excuseKey: 'paperwork', group: 'absence', boldness: 'bold',
    title: 'Le rendez-vous en préfecture',
    reason: 'J’ai enfin décroché un rendez-vous en préfecture. Le refuser, c’est repartir pour six mois de captcha.',
    activity: 'Rendez-vous en préfecture', location: 'À la préfecture', credibility: 64,
    verdict: 'Personne ne lutte contre la préfecture.',
    followUps: [{ label: 'Se plaindre de la file d’attente', offsetDays: 1 }],
  },
  {
    id: 'abs-gym', excuseKey: 'gym', group: 'absence', boldness: 'bold',
    title: 'La dignité financière',
    reason: 'Mon abonnement à la salle de sport expire et je dois y aller au moins une fois pour ne pas avoir tout payé pour rien. C’est une question de dignité financière.',
    activity: 'Séance de sport symbolique', location: 'À la salle de sport', credibility: 45,
    verdict: 'Honnête dans sa malhonnêteté.',
    followUps: [{ label: 'Avoir l’air courbaturé', offsetDays: 1 }],
  },
  // ── Absence ───────────────────────────────────────────────────── absurd
  {
    id: 'abs-goose', excuseKey: 'wildlife', group: 'absence', boldness: 'absurd',
    title: 'L’oie territoriale',
    reason: 'Une oie s’est installée devant ma porte et refuse catégoriquement de me laisser sortir. J’ai tenté la négociation, elle a sifflé.',
    activity: 'Négociation avec une oie', location: 'Devant chez moi', credibility: 12,
    verdict: 'Absurde, mais personne n’osera vérifier.',
    followUps: [{ label: 'Donner des nouvelles de l’oie', offsetDays: 2 }],
  },
  {
    id: 'abs-mercury', excuseKey: 'astrology', group: 'absence', boldness: 'absurd',
    title: 'Mercure rétrograde',
    reason: 'Mon horoscope m’interdit formellement toute vie sociale sur ce créneau. Mercure est rétrograde, et moi aussi.',
    activity: 'Retraite astrologique', location: 'Chez moi', credibility: 18,
    verdict: 'Dépend fortement de la crédulité du destinataire.',
    followUps: [{ label: 'Annoncer que Mercure est revenu à de meilleurs sentiments', offsetDays: 3 }],
  },
  {
    id: 'abs-wardrobe', excuseKey: 'flatpack', group: 'absence', boldness: 'absurd',
    title: 'L’armoire suédoise',
    reason: 'Je monte une armoire suédoise depuis trois jours. Il me reste une vis et un doute existentiel : je ne peux pas abandonner maintenant.',
    activity: 'Montage d’armoire', location: 'Chez moi', credibility: 28,
    verdict: 'Étrangement crédible pour qui a déjà vécu ça.',
    followUps: [{ label: 'Envoyer une photo de l’armoire (bancale)', offsetDays: 1 }],
  },
  {
    id: 'abs-sourdough', excuseKey: 'sourdough', group: 'absence', boldness: 'absurd',
    title: 'Le levain capricieux',
    reason: 'Mon levain entre dans une phase critique et je ne peux pas le laisser seul. C’est un être vivant, il a besoin de moi.',
    activity: 'Veille du levain', location: 'Chez moi', credibility: 22,
    verdict: 'Touchant. Apporter du pain la prochaine fois.',
    followUps: [{ label: 'Offrir du pain maison pour se faire pardonner', offsetDays: 4 }],
  },
  {
    id: 'abs-lookalike', excuseKey: 'lookalike', group: 'absence', boldness: 'absurd',
    title: 'Le sosie en liberté',
    reason: 'Mon sosie a été repéré en ville et je dois rester discret pour éviter toute confusion. C’est une question d’ordre public.',
    activity: 'Gestion de crise de sosie', location: 'Dans un lieu tenu secret', credibility: 5,
    verdict: 'Rien ne tient debout. C’est presque beau.',
    followUps: [{ label: 'Ne jamais reparler du sosie', offsetDays: 7 }],
  },
  // ── Retard ──────────────────────────────────────────────────── plausible
  {
    id: 'late-train', excuseKey: 'train', group: 'late', boldness: 'plausible',
    title: 'Le train fantôme',
    reason: 'Mon train est annoncé avec un retard « indéterminé », ce qui, en langage ferroviaire, veut dire « bonne chance ».',
    activity: 'Trajet en train', location: 'En gare', credibility: 86,
    verdict: 'Personne ne remet en cause un retard de train.',
    followUps: [{ label: 'Ne pas reprendre l’excuse du train cette semaine', offsetDays: 7 }],
  },
  {
    id: 'late-traffic', excuseKey: 'traffic', group: 'late', boldness: 'plausible',
    title: 'Le bouchon monumental',
    reason: 'Il y a un accident sur le périphérique et tout est bloqué. J’avance à la vitesse d’un escargot qui hésite.',
    activity: 'Trajet en voiture', location: 'Sur la route', credibility: 84,
    verdict: 'Imparable, sauf face à une appli de trafic.',
    followUps: [],
  },
  {
    id: 'late-call', excuseKey: 'endless-call', group: 'late', boldness: 'plausible',
    title: 'L’appel qui déborde',
    reason: 'Un appel qui devait durer cinq minutes en est à sa quarante-cinquième. Je raccroche dès que j’arrive à placer un mot.',
    activity: 'Appel interminable', location: 'Au bureau', credibility: 80,
    verdict: 'Tout le monde connaît quelqu’un qui ne raccroche jamais.',
    followUps: [],
  },
  {
    id: 'late-keys', excuseKey: 'lost-keys', group: 'late', boldness: 'plausible',
    title: 'Les clés introuvables',
    reason: 'Mes clés ont disparu au moment de partir. Je viens de les retrouver dans le frigo, ne pose pas de questions.',
    activity: 'Recherche de clés', location: 'Chez moi', credibility: 72,
    verdict: 'Le détail du frigo donne un charme authentique.',
    followUps: [],
  },
  // ── Retard ──────────────────────────────────────────────────────── bold
  {
    id: 'late-wrong-way', excuseKey: 'wrong-way', group: 'late', boldness: 'bold',
    title: 'La mauvaise direction',
    reason: 'J’ai pris le métro dans le mauvais sens avec une assurance remarquable. Demi-tour en cours.',
    activity: 'Trajet en métro', location: 'Dans le métro', credibility: 60,
    verdict: 'Humiliant, donc crédible.',
    followUps: [],
  },
  {
    id: 'late-coffee', excuseKey: 'wardrobe', group: 'late', boldness: 'bold',
    title: 'L’accident de café',
    reason: 'J’ai renversé mon café sur mes vêtements au moment de sortir. Changement de tenue express en cours.',
    activity: 'Changement de tenue', location: 'Chez moi', credibility: 63,
    verdict: 'Vérifiable uniquement si quelqu’un renifle votre manche.',
    followUps: [],
  },
  {
    id: 'late-elevator', excuseKey: 'elevator', group: 'late', boldness: 'bold',
    title: 'L’ascenseur rebelle',
    reason: 'L’ascenseur de mon immeuble s’est bloqué entre deux étages avec moi dedans. Tout va bien, mais j’ai eu le temps de réfléchir à ma vie.',
    activity: 'Captivité en ascenseur', location: 'Dans mon immeuble', credibility: 48,
    verdict: 'Dramatique juste ce qu’il faut.',
    followUps: [{ label: 'Raconter la libération de l’ascenseur', offsetDays: 0 }],
  },
  // ── Retard ────────────────────────────────────────────────────── absurd
  {
    id: 'late-sheep', excuseKey: 'sheep', group: 'late', boldness: 'absurd',
    title: 'La transhumance',
    reason: 'Un troupeau de moutons traverse la route. Ils sont nombreux, ils sont lents, et ils ont la priorité.',
    activity: 'Attente de moutons', location: 'Sur une route de campagne', credibility: 15,
    verdict: 'Fonctionne surtout si vous habitez en ville. Non, en fait.',
    followUps: [],
  },
  {
    id: 'late-timezone', excuseKey: 'timezone', group: 'late', boldness: 'absurd',
    title: 'Le fuseau horaire',
    reason: 'Mon téléphone s’est mis tout seul à l’heure de Montréal. Techniquement, je suis très en avance.',
    activity: 'Décalage horaire involontaire', location: 'Chez moi', credibility: 20,
    verdict: 'Techniquement inattaquable, moralement discutable.',
    followUps: [],
  },
  {
    id: 'late-brass-band', excuseKey: 'brass-band', group: 'late', boldness: 'absurd',
    title: 'La fanfare imprévue',
    reason: 'Une fanfare défile dans ma rue et la police refuse de me laisser traverser avant la fin du morceau. Il dure longtemps.',
    activity: 'Attente de fin de fanfare', location: 'Dans ma rue', credibility: 25,
    verdict: 'Bruyant, festif, invérifiable.',
    followUps: [],
  },
  // ── Quitter un groupe ───────────────────────────────────────── plausible
  {
    id: 'leave-detox', excuseKey: 'digital-detox', group: 'leave', boldness: 'plausible',
    title: 'Le tri des notifications',
    reason: 'Je fais un grand tri dans mes notifications pour retrouver un semblant de concentration, alors je quitte quelques groupes, dont celui-ci.',
    activity: 'Détox numérique', location: '', credibility: 82,
    verdict: 'Sobre, moderne, presque admirable.',
    followUps: [{ label: 'Ne pas réagir aux photos du groupe ailleurs', offsetDays: 3 }],
  },
  {
    id: 'leave-storage', excuseKey: 'phone-storage', group: 'leave', boldness: 'plausible',
    title: 'Le téléphone saturé',
    reason: 'Mon téléphone n’a plus de place et, après enquête, ce groupe représente à lui seul 4 Go de vidéos. Je dois m’en séparer.',
    activity: 'Ménage du téléphone', location: '', credibility: 75,
    verdict: 'Statistiquement probable.',
    followUps: [],
  },
  {
    id: 'leave-channel', excuseKey: 'other-channel', group: 'leave', boldness: 'plausible',
    title: 'Le changement de canal',
    reason: 'Je ne regarde presque plus cette messagerie et je préfère quitter le groupe plutôt que de rater des messages. Pour me joindre, un message perso fera très bien l’affaire.',
    activity: 'Changement de messagerie', location: '', credibility: 80,
    verdict: 'Diplomatique. Laisse une porte ouverte (petite).',
    followUps: [],
  },
  // ── Quitter un groupe ───────────────────────────────────────────── bold
  {
    id: 'leave-thumb', excuseKey: 'thumb', group: 'leave', boldness: 'bold',
    title: 'Le pouce autonome',
    reason: 'Je crois que mon pouce va appuyer tout seul sur « Quitter le groupe ». J’ai décidé de respecter sa décision.',
    activity: 'Respect du libre arbitre du pouce', location: '', credibility: 50,
    verdict: 'Assumé. Le pouce porte la responsabilité.',
    followUps: [],
  },
  {
    id: 'leave-candle', excuseKey: 'mindfulness', group: 'leave', boldness: 'bold',
    title: 'La sobriété numérique',
    reason: 'Je me lance dans une démarche de sobriété numérique très sérieuse, avec un livre de développement personnel et une bougie parfumée.',
    activity: 'Sobriété numérique', location: '', credibility: 55,
    verdict: 'La bougie parfumée apporte un vernis de sincérité.',
    followUps: [{ label: 'Poster quelque chose seulement dans trois semaines', offsetDays: 21 }],
  },
  {
    id: 'leave-new-phone', excuseKey: 'new-phone', group: 'leave', boldness: 'bold',
    title: 'Le grand déménagement',
    reason: 'Je change de téléphone et je profite de la migration pour ne pas tout transférer. Ce groupe n’a pas passé la sélection, rien de personnel.',
    activity: 'Migration de téléphone', location: '', credibility: 52,
    verdict: 'Franc. Peut-être un peu trop.',
    followUps: [],
  },
  // ── Quitter un groupe ─────────────────────────────────────────── absurd
  {
    id: 'leave-pigeon', excuseKey: 'pigeon', group: 'leave', boldness: 'absurd',
    title: 'Le pigeon voyageur',
    reason: 'Je passe exclusivement au pigeon voyageur. Mon pigeon s’appelle Gérard et il ne lit pas les groupes.',
    activity: 'Formation de Gérard', location: '', credibility: 8,
    verdict: 'Gérard n’a pas confirmé.',
    followUps: [],
  },
  {
    id: 'leave-witness', excuseKey: 'witness', group: 'leave', boldness: 'absurd',
    title: 'La protection des témoins',
    reason: 'Pour des raisons que je ne peux pas détailler, je dois disparaître de tous les groupes de discussion. Si on vous demande, vous ne me connaissez pas.',
    activity: 'Programme de protection', location: '', credibility: 10,
    verdict: 'Mystérieux. Génère plus de questions que de réponses.',
    followUps: [],
  },
  {
    id: 'leave-monastery', excuseKey: 'monastery', group: 'leave', boldness: 'absurd',
    title: 'Le monastère sans wifi',
    reason: 'Je rejoins un monastère dans le Vercors où le wifi est considéré comme un péché. Je prierai pour ce groupe.',
    activity: 'Retraite spirituelle', location: 'Dans le Vercors', credibility: 12,
    verdict: 'Spirituellement élevé, crédibilité au ras du sol.',
    followUps: [],
  },
  // ── Récupérer un dû ─────────────────────────────────────────── plausible
  {
    id: 'refund-budget', excuseKey: 'budget', group: 'refund', boldness: 'plausible',
    title: 'Le point budget',
    reason: 'Je fais mes comptes du mois et je me rends compte qu’on avait oublié {amount}. Tu pourrais me les rendre quand ça t’arrange ?',
    activity: 'Comptes du mois', location: '', credibility: 84,
    verdict: 'Neutre, comptable, imparable.',
    followUps: [{ label: 'Relancer gentiment si toujours rien', offsetDays: 7 }],
  },
  {
    id: 'refund-reminder', excuseKey: 'soft-reminder', group: 'refund', boldness: 'plausible',
    title: 'Le petit rappel tout doux',
    reason: 'Petit rappel tout doux pour {amount} de l’autre fois. Aucune urgence, mais mon banquier commence à poser des questions.',
    activity: 'Rappel amical', location: '', credibility: 80,
    verdict: 'Le banquier est un excellent bouc émissaire.',
    followUps: [{ label: 'Relancer gentiment si toujours rien', offsetDays: 7 }],
  },
  {
    id: 'refund-gift', excuseKey: 'gift-pool', group: 'refund', boldness: 'plausible',
    title: 'La cagnotte providentielle',
    reason: 'Je participe à une cagnotte pour un cadeau et il me manque justement {amount} que je t’avais avancés. Le timing est parfait, non ?',
    activity: 'Cagnotte cadeau', location: '', credibility: 72,
    verdict: 'Crédible tant qu’on ne demande pas pour qui est le cadeau.',
    followUps: [{ label: 'Avoir une réponse prête : « c’est pour un collègue »', offsetDays: 0 }],
  },
  // ── Récupérer un dû ─────────────────────────────────────────────── bold
  {
    id: 'refund-invoice', excuseKey: 'invoice', group: 'refund', boldness: 'bold',
    title: 'La facture officielle',
    reason: 'Après étude de ton dossier, mon service comptabilité (moi) a relevé {amount} en attente de règlement. Un virement suffira à classer l’affaire.',
    activity: 'Recouvrement amiable', location: '', credibility: 55,
    verdict: 'L’humour administratif adoucit la créance.',
    followUps: [{ label: 'Envoyer une « mise en demeure » avec un émoji', offsetDays: 10 }],
  },
  {
    id: 'refund-interest', excuseKey: 'interest', group: 'refund', boldness: 'bold',
    title: 'La renonciation aux intérêts',
    reason: 'Je te rappelle {amount} que je t’avais avancés. Je renonce généreusement aux intérêts, ce qui est un geste très fort.',
    activity: 'Recouvrement généreux', location: '', credibility: 58,
    verdict: 'Grand seigneur, petite pique.',
    followUps: [{ label: 'Relancer gentiment si toujours rien', offsetDays: 7 }],
  },
  {
    id: 'refund-nostalgia', excuseKey: 'nostalgia', group: 'refund', boldness: 'bold',
    title: 'Le souvenir ému',
    reason: 'Je repensais à ce super moment où je t’ai avancé {amount}. Ce serait chouette d’en créer un nouveau, où tu me les rends.',
    activity: 'Nostalgie intéressée', location: '', credibility: 56,
    verdict: 'Sentimental avec une arrière-pensée bancaire.',
    followUps: [],
  },
  // ── Récupérer un dû ───────────────────────────────────────────── absurd
  {
    id: 'refund-mug', excuseKey: 'ransom', group: 'refund', boldness: 'absurd',
    title: 'La rançon de la tasse',
    reason: 'Ta tasse préférée est toujours chez moi. Je la rendrai contre {amount}. Pas de police, pas d’embrouille.',
    activity: 'Négociation de rançon', location: '', credibility: 15,
    verdict: 'Juridiquement fragile, émotionnellement efficace.',
    followUps: [{ label: 'Rendre la tasse (vraiment)', offsetDays: 3 }],
  },
  {
    id: 'refund-psychic', excuseKey: 'psychic', group: 'refund', boldness: 'absurd',
    title: 'La prédiction de la voyante',
    reason: 'Ma voyante m’a dit que quelqu’un me devait {amount} et qu’il fallait régler ça avant la pleine lune. Je ne fais que transmettre.',
    activity: 'Consultation de voyance', location: '', credibility: 18,
    verdict: 'La pleine lune n’a jamais remboursé personne.',
    followUps: [],
  },
  {
    id: 'refund-exhibition', excuseKey: 'exhibition', group: 'refund', boldness: 'absurd',
    title: 'L’exposition des dettes oubliées',
    reason: 'Je monte une exposition sur les dettes oubliées. Tu y figures en bonne place, sauf si tu me rends {amount} avant le vernissage.',
    activity: 'Préparation d’exposition', location: '', credibility: 20,
    verdict: 'Culturel et menaçant à la fois.',
    followUps: [],
  },
];
