import type { ReactNode } from 'react';
import { today } from '../domain/dates';
import { paths, type Route } from '../state/router';
import { useStore } from '../state/store';

type Tab = 'messes' | 'history' | 'followUps' | 'data' | null;

function activeTab(route: Route): Tab {
  switch (route.name) {
    case 'messes':
    case 'mess':
    case 'messNew':
    case 'messEdit':
    case 'factory':
    case 'busted':
      return 'messes';
    case 'history':
      return 'history';
    case 'followUps':
      return 'followUps';
    case 'data':
      return 'data';
    default:
      return null;
  }
}

function Banners() {
  const { loadIssue, saveError, dismissLoadIssue } = useStore();
  return (
    <>
      {loadIssue?.status === 'corrupt' && (
        <div className="banner banner--warn" role="alert">
          <p>
            <strong>Dossier illisible.</strong> Les données enregistrées dans ce navigateur étaient abîmées ({loadIssue.error}).{' '}
            {loadIssue.backupKey
              ? 'La version endommagée a été mise de côté, et un dossier vierge a été ouvert.'
              : 'Un dossier vierge a été ouvert.'}
          </p>
          <button type="button" className="btn btn--small btn--ghost" onClick={dismissLoadIssue}>
            Compris
          </button>
        </div>
      )}
      {loadIssue?.status === 'unavailable' && (
        <div className="banner banner--warn" role="alert">
          <p>
            <strong>Stockage local indisponible.</strong> Vos galères ne survivront pas à la fermeture de l’onglet (navigation privée ?).
          </p>
          <button type="button" className="btn btn--small btn--ghost" onClick={dismissLoadIssue}>
            Tant pis
          </button>
        </div>
      )}
      {saveError && (
        <div className="banner banner--error" role="alert">
          <p>
            <strong>Sauvegarde impossible.</strong> {saveError} Vos dernières modifications restent affichées mais risquent d’être
            perdues : pensez à <a href={paths.data}>exporter vos données</a>.
          </p>
        </div>
      )}
    </>
  );
}

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  const { data } = useStore();
  const tab = activeTab(route);
  const overdue = data.followUps.filter((f) => !f.done && f.dueDate < today()).length;
  const showFab = route.name === 'messes' || route.name === 'history' || route.name === 'followUps';

  const navItems: { id: Exclude<Tab, null | 'data'>; href: string; label: string; icon: string; badge?: number }[] = [
    { id: 'messes', href: paths.messes, label: 'Mes galères', icon: '🗂️' },
    { id: 'history', href: paths.history, label: 'Historique', icon: '📜' },
    { id: 'followUps', href: paths.followUps, label: 'Suivis', icon: '⏳', badge: overdue },
  ];

  return (
    <div className="app">
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          // Plain "#main" would be read as a route by the hash router.
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Aller au contenu
      </a>
      <header className="topbar">
        <div className="topbar__inner">
          <a href={paths.messes} className="brand" aria-label="Ça s’arrange — accueil">
            <span className="brand__seal" aria-hidden="true">
              Ç
            </span>
            <span className="brand__text">
              <span className="brand__name">Ça s’arrange</span>
              <span className="brand__tagline">Les solutions discutables à vos problèmes évitables.</span>
            </span>
          </a>
          <nav className="topnav" aria-label="Navigation principale">
            {navItems.map((item) => (
              <a key={item.id} href={item.href} className="topnav__link" aria-current={tab === item.id ? 'page' : undefined}>
                {item.label}
                {item.badge ? <span className="nav-badge" aria-label={`${item.badge} en retard`}>{item.badge}</span> : null}
              </a>
            ))}
          </nav>
          <div className="topbar__actions">
            <a href={paths.data} className="icon-link" aria-current={tab === 'data' ? 'page' : undefined}>
              <span aria-hidden="true">⚙️</span>
              <span className="icon-link__label">Données</span>
            </a>
            <a href={paths.messNew} className="btn btn--primary topbar__cta">
              <span aria-hidden="true">＋</span> Déclarer une galère
            </a>
          </div>
        </div>
      </header>

      <Banners />

      <main id="main" className="main" tabIndex={-1}>
        {children}
      </main>

      <footer className="footer">
        <p>
          🔒 Vos données restent dans ce navigateur, sur cet appareil. Aucune synchronisation, aucun compte, aucun témoin.{' '}
          <a href={paths.data}>Exporter ou importer</a>
        </p>
      </footer>

      {showFab && (
        <a href={paths.messNew} className="fab" aria-label="Déclarer une galère">
          <span aria-hidden="true">＋</span>
          <span className="fab__label">Déclarer une galère</span>
        </a>
      )}

      <nav className="bottomnav" aria-label="Navigation principale (mobile)">
        {navItems.map((item) => (
          <a key={item.id} href={item.href} className="bottomnav__link" aria-current={tab === item.id ? 'page' : undefined}>
            <span className="bottomnav__icon" aria-hidden="true">
              {item.icon}
              {item.badge ? <span className="nav-badge nav-badge--dot">{item.badge}</span> : null}
            </span>
            <span>{item.label}</span>
            {item.badge ? <span className="visually-hidden">, {item.badge} en retard</span> : null}
          </a>
        ))}
      </nav>
    </div>
  );
}
