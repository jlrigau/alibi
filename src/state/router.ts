import { useEffect, useState } from 'react';

export type Route =
  | { name: 'messes' }
  | { name: 'messNew' }
  | { name: 'messEdit'; id: string }
  | { name: 'mess'; id: string }
  | { name: 'factory'; id: string }
  | { name: 'busted'; id: string }
  | { name: 'history' }
  | { name: 'followUps' }
  | { name: 'data' }
  | { name: 'notFound' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [a, b, c] = parts;
  if (!a) return { name: 'messes' };
  if (a === 'historique' && !b) return { name: 'history' };
  if (a === 'suivis' && !b) return { name: 'followUps' };
  if (a === 'donnees' && !b) return { name: 'data' };
  if (a === 'galere') {
    if (b === 'nouvelle' && !c) return { name: 'messNew' };
    if (b && !c) return { name: 'mess', id: b };
    if (b && c === 'modifier') return { name: 'messEdit', id: b };
    if (b && c === 'alibi') return { name: 'factory', id: b };
    if (b && c === 'grille') return { name: 'busted', id: b };
  }
  return { name: 'notFound' };
}

export const paths = {
  messes: '#/',
  messNew: '#/galere/nouvelle',
  mess: (id: string) => `#/galere/${encodeURIComponent(id)}`,
  messEdit: (id: string) => `#/galere/${encodeURIComponent(id)}/modifier`,
  factory: (id: string) => `#/galere/${encodeURIComponent(id)}/alibi`,
  busted: (id: string) => `#/galere/${encodeURIComponent(id)}/grille`,
  history: '#/historique',
  followUps: '#/suivis',
  data: '#/donnees',
};

export function navigate(hash: string) {
  window.location.hash = hash;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
