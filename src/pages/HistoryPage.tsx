import { useMemo, useState } from 'react';
import { AlibiItem } from '../components/AlibiItem';
import { WarningList } from '../components/Warnings';
import { normalize } from '../domain/ids';
import { paths } from '../state/router';
import { useStore } from '../state/store';

export function HistoryPage() {
  const { data, warnings } = useStore();
  const [recipient, setRecipient] = useState('all');

  const recipients = useMemo(() => {
    const map = new Map<string, string>();
    data.alibis.forEach((a) => a.recipient && map.set(normalize(a.recipient), a.recipient));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'fr'));
  }, [data.alibis]);

  const alibis = data.alibis
    .filter((a) => recipient === 'all' || normalize(a.recipient) === recipient)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <section className="page" aria-labelledby="page-title">
      <div className="page-head">
        <p className="eyebrow">Archives</p>
        <h1 id="page-title" className="page-title">
          Historique des alibis
        </h1>
        <p className="page-lede">Tout ce que vous avez raconté, à qui, et quand. Pour ne jamais se contredire (trop).</p>
      </div>

      {data.alibis.length === 0 ? (
        <div className="empty empty--small">
          <p>Aucun alibi archivé. Votre casier est vierge, pour le moment.</p>
          <a href={paths.messes} className="btn btn--secondary">
            Voir mes galères
          </a>
        </div>
      ) : (
        <>
          <section className={`card coherence ${warnings.length ? 'coherence--warn' : 'coherence--ok'}`} aria-labelledby="coherence-title">
            <h2 id="coherence-title" className="section-title">
              {warnings.length ? 'Cohérence narrative compromise' : 'Cohérence narrative : RAS'}
            </h2>
            {warnings.length ? (
              <>
                <p className="muted small">
                  {warnings.length} point{warnings.length > 1 ? 's' : ''} de vigilance détecté{warnings.length > 1 ? 's' : ''} par des
                  règles simples : même excuse à la même personne, lieux ou engagements incompatibles sur des créneaux qui se
                  chevauchent. Rien n’est bloqué, c’est votre réputation.
                </p>
                <WarningList warnings={warnings} />
              </>
            ) : (
              <p className="muted">Aucune contradiction détectée. Votre version des faits tient debout. Pour l’instant.</p>
            )}
          </section>

          {recipients.length > 1 && (
            <div className="filters">
              <div className="field field--inline">
                <label htmlFor="h-recipient">Destinataire</label>
                <select id="h-recipient" className="select" value={recipient} onChange={(e) => setRecipient(e.target.value)}>
                  <option value="all">Tout le monde</option>
                  {recipients.map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="stack">
            {alibis.map((a) => (
              <AlibiItem key={a.id} alibi={a} mess={data.messes.find((m) => m.id === a.messId)} warnings={warnings} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
