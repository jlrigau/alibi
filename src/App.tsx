import { useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { BustedPage } from './pages/BustedPage';
import { DataPage } from './pages/DataPage';
import { FactoryPage } from './pages/FactoryPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { HistoryPage } from './pages/HistoryPage';
import { MessDetailPage } from './pages/MessDetailPage';
import { MessFormPage } from './pages/MessFormPage';
import { MessesPage } from './pages/MessesPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { useRoute, type Route } from './state/router';

const TITLES: Partial<Record<Route['name'], string>> = {
  messes: 'Mes galères',
  messNew: 'Déclarer une galère',
  messEdit: 'Modifier la galère',
  mess: 'Dossier',
  factory: 'Fabrique d’alibis',
  busted: 'Ils m’ont grillé',
  history: 'Historique',
  followUps: 'Suivis',
  data: 'Données',
};

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'messes':
      return <MessesPage />;
    case 'messNew':
      return <MessFormPage />;
    case 'messEdit':
      return <MessFormPage key={route.id} id={route.id} />;
    case 'mess':
      return <MessDetailPage id={route.id} />;
    case 'factory':
      return <FactoryPage key={route.id} id={route.id} />;
    case 'busted':
      return <BustedPage key={route.id} id={route.id} />;
    case 'history':
      return <HistoryPage />;
    case 'followUps':
      return <FollowUpsPage />;
    case 'data':
      return <DataPage />;
    default:
      return <NotFoundPage />;
  }
}

export function App() {
  const route = useRoute();
  const key = JSON.stringify(route);
  const first = useRef(true);

  useEffect(() => {
    document.title = `${TITLES[route.name] ?? 'Introuvable'} · Ça s’arrange`;
    if (first.current) {
      first.current = false;
      return;
    }
    // On navigation, bring the reader to the top and move focus to the new page heading.
    window.scrollTo(0, 0);
    const heading = document.querySelector<HTMLElement>('#main h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }, [key, route.name]);

  return (
    <Layout route={route}>
      <div key={key} className="page-enter">
        <Page route={route} />
      </div>
    </Layout>
  );
}
