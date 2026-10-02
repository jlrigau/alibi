export type BustedKind = 'admit' | 'apologize' | 'makeAmends';

export const BUSTED_KINDS: { kind: BustedKind; label: string; hint: string }[] = [
  { kind: 'admit', label: 'Reconnaître les faits avec humour', hint: 'Pour désamorcer avec panache.' },
  { kind: 'apologize', label: 'Présenter des excuses simplement', hint: 'Pour les cas où l’humour aggraverait tout.' },
  { kind: 'makeAmends', label: 'Proposer un geste', hint: 'Pour que les actes parlent plus fort que les alibis.' },
];

const VARIANTS: Record<BustedKind, string[]> = {
  admit: [
    '{person}, je crois que mon histoire a pris l’eau. Je reconnais les faits : j’ai un peu arrangé la réalité. J’accepte la sentence avec dignité (et beaucoup de honte).',
    'Je plaide coupable. Mon excuse avait de l’ambition, mais pas beaucoup de fondations. Le tribunal de l’amitié peut délibérer.',
    'Affaire « {title} » : les faits sont établis, la défense reconnaît tout. Circonstances atténuantes demandées : un excès d’imagination.',
    '{person}, tu as raison, ce n’était pas tout à fait vrai. J’ai voulu enjoliver, j’ai surtout compliqué. La prochaine fois, je dirai juste que je n’ai pas le courage.',
  ],
  apologize: [
    '{person}, je te dois des excuses. Je n’ai pas été honnête avec toi et je le regrette sincèrement. Pardon.',
    '{person}, je te présente mes excuses, sincèrement. J’aurais dû te dire la vérité directement, tu méritais mieux qu’une histoire inventée.',
    'Pardon {person}. Ce n’était pas correct de ma part de te raconter des histoires. Je comprends que ça t’agace, et j’aimerais qu’on en parle.',
  ],
  makeAmends: [
    '{person}, pour me faire pardonner, je t’invite au restaurant de ton choix. Oui, même celui qui est trop cher. Surtout celui-là.',
    'Je propose une réparation en nature : je m’occupe de la prochaine sortie, de A à Z, sans râler. Marché conclu, {person} ?',
    '{person}, je t’apporte des croissants (ou des chouquettes, je te laisse choisir la peine) et on reprend tout depuis le début ?',
    'Laisse-moi me rattraper : la prochaine fois, je viens, j’arrive à l’heure et j’apporte le dessert. Trois promesses, zéro excuse.',
  ],
};

function fillPerson(text: string, person: string, title: string): string {
  const out = person
    ? text.replace(/\{person\}/g, person)
    : text.replace(/\{person\}, /g, '').replace(/ \{person\}/g, '').replace(/\{person\}/g, '');
  return out.replace(/\{title\}/g, title).replace(/^(\p{Ll})/u, (c) => c.toUpperCase());
}

export function variantCount(kind: BustedKind): number {
  return VARIANTS[kind].length;
}

/** Busted message `index` (wraps around) for the given dossier. */
export function bustedMessage(kind: BustedKind, index: number, person: string, title: string): string {
  const list = VARIANTS[kind];
  return fillPerson(list[((index % list.length) + list.length) % list.length], person.trim(), title.trim());
}
