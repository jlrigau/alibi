import { useRef, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { today } from '../domain/dates';
import { exportData, parseImport } from '../domain/storage';
import type { AppData } from '../domain/types';
import { useStore } from '../state/store';
import { useToast } from '../state/toast';

export function DataPage() {
  const { data, replaceAll, reset } = useStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ data: AppData; name: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const download = () => {
    const blob = new Blob([exportData(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ca-sarrange-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Export prêt. Gardez-le en lieu sûr, loin des curieux.');
  };

  const onFile = async (file: File | undefined) => {
    setImportError(null);
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      setImportError('Impossible de lire ce fichier.');
      return;
    }
    const result = parseImport(text);
    if (!result.ok) {
      setImportError(result.error);
    } else {
      setPending({ data: result.data, name: file.name });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <section className="page page--narrow" aria-labelledby="page-title">
      <div className="page-head">
        <p className="eyebrow">Greffe</p>
        <h1 id="page-title" className="page-title">
          Vos données
        </h1>
        <p className="page-lede">
          Tout est stocké dans ce navigateur (localStorage), sur cet appareil uniquement. Pas de compte, pas de serveur, pas de
          synchronisation entre appareils. Vider les données du navigateur efface vos dossiers : exportez-les de temps en temps.
        </p>
      </div>

      <div className="card data-summary" aria-label="Contenu actuel">
        <div>
          <strong>{data.messes.length}</strong> galère{data.messes.length > 1 ? 's' : ''}
        </div>
        <div>
          <strong>{data.alibis.length}</strong> alibi{data.alibis.length > 1 ? 's' : ''}
        </div>
        <div>
          <strong>{data.followUps.length}</strong> suivi{data.followUps.length > 1 ? 's' : ''}
        </div>
      </div>

      <section className="card section" aria-labelledby="export-title">
        <h2 id="export-title" className="section-title">
          Exporter
        </h2>
        <p className="muted">Télécharge un fichier JSON contenant l’intégralité de votre dossier.</p>
        <button type="button" className="btn btn--primary" onClick={download}>
          Exporter mes données (JSON)
        </button>
      </section>

      <section className="card section" aria-labelledby="import-title">
        <h2 id="import-title" className="section-title">
          Importer
        </h2>
        <p className="muted">
          Le fichier est vérifié avant toute modification. Une fois validé, il remplacera vos données actuelles, après confirmation.
        </p>
        <label htmlFor="import-file" className="btn btn--secondary file-btn">
          Choisir un fichier JSON
        </label>
        <input
          ref={fileRef}
          id="import-file"
          className="visually-hidden-file"
          type="file"
          accept="application/json,.json"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {importError && (
          <p className="field__error" role="alert">
            Import refusé : {importError} Vos données actuelles n’ont pas été touchées.
          </p>
        )}
      </section>

      <section className="card section section--danger" aria-labelledby="reset-title">
        <h2 id="reset-title" className="section-title">
          Réinitialiser
        </h2>
        <p className="muted">Efface toutes les galères, alibis et suivis de ce navigateur. Repartir de zéro, comme si de rien n’était.</p>
        <button type="button" className="btn btn--danger" onClick={() => setConfirmReset(true)}>
          Tout effacer
        </button>
      </section>

      <ConfirmDialog
        open={!!pending}
        title="Remplacer vos données ?"
        confirmLabel="Remplacer"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) replaceAll(pending.data);
          setPending(null);
          toast('Import réussi. Votre passé a été restauré.');
        }}
      >
        {pending && (
          <p>
            « {pending.name} » contient {pending.data.messes.length} galère(s), {pending.data.alibis.length} alibi(s) et{' '}
            {pending.data.followUps.length} suivi(s). Il remplacera les {data.messes.length} galère(s), {data.alibis.length} alibi(s)
            et {data.followUps.length} suivi(s) actuels.
          </p>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmReset}
        title="Tout effacer ?"
        confirmLabel="Oui, tout effacer"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          reset();
          setConfirmReset(false);
          toast('Dossier remis à zéro. Nouvelle vie, nouvelles excuses.');
        }}
      >
        <p>Cette action est définitive. Pensez à exporter avant, si jamais vous regrettez votre passé.</p>
      </ConfirmDialog>
    </section>
  );
}
