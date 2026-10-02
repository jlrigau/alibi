import { paths } from '../state/router';

export function NotFoundPage() {
  return (
    <section className="page page--narrow" aria-labelledby="page-title">
      <div className="empty">
        <span className="stamp stamp--tone-coral empty__stamp">Introuvable</span>
        <h1 id="page-title" className="page-title">
          Ce dossier s’est volatilisé
        </h1>
        <p className="empty__text">Égaré, supprimé, ou jamais existé. Le bureau décline toute responsabilité.</p>
        <a href={paths.messes} className="btn btn--primary">
          Retour à mes galères
        </a>
      </div>
    </section>
  );
}
