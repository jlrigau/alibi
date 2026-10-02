import { useRef, useState, type FormEvent } from 'react';
import { CopyButton } from '../components/CopyButton';
import { WarningList } from '../components/Warnings';
import { formatShort, isValidISODate, isValidTime } from '../domain/dates';
import { SLOT_PRESETS, generateProposals, previewWarnings, randomSeed, type GeneratorInput, type Proposal } from '../domain/generator';
import { BOLDNESS_LABELS, INTENT_LABELS, TONE_LABELS } from '../domain/labels';
import { BOLDNESS, INTENTS, TONES, type Mess } from '../domain/types';
import { navigate, paths } from '../state/router';
import { useStore } from '../state/store';
import { useToast } from '../state/toast';
import { NotFoundPage } from './NotFoundPage';

const BOLDNESS_HINTS = {
  plausible: 'Passe crème.',
  bold: 'Ça passe ou ça casse.',
  absurd: 'Pour l’art.',
} as const;

const TONE_HINTS = {
  sober: 'Courtois, factuel.',
  friendly: 'Chaleureux, un brin complice.',
  theatrical: 'Tragédie en trois actes.',
} as const;

interface Edit {
  message: string;
  location: string;
  followUps: boolean[];
}

function initialInput(mess: Mess): GeneratorInput {
  return {
    situation: mess.title,
    person: mess.person,
    category: mess.category,
    date: mess.eventDate,
    slotId: 'evening',
    startTime: '19:00',
    endTime: '23:00',
    intent: 'decline',
    tone: 'friendly',
    boldness: 'plausible',
  };
}

export function FactoryPage({ id }: { id: string }) {
  const { data, addAlibi } = useStore();
  const toast = useToast();
  const mess = data.messes.find((m) => m.id === id);
  const [input, setInput] = useState<GeneratorInput>(() => (mess ? initialInput(mess) : ({} as GeneratorInput)));
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [usedInput, setUsedInput] = useState<GeneratorInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLHeadingElement>(null);

  if (!mess) return <NotFoundPage />;

  const set = <K extends keyof GeneratorInput>(key: K, value: GeneratorInput[K]) => setInput((i) => ({ ...i, [key]: value }));

  const chooseSlot = (slotId: string) => {
    const preset = SLOT_PRESETS.find((s) => s.id === slotId);
    setInput((i) => (preset ? { ...i, slotId, startTime: preset.start, endTime: preset.end } : { ...i, slotId }));
  };

  const generate = (e?: FormEvent) => {
    e?.preventDefault();
    if (!isValidISODate(input.date) || !isValidTime(input.startTime) || !isValidTime(input.endTime)) {
      setError('Il nous faut une date et un créneau valides pour bâtir une version crédible.');
      return;
    }
    setError(null);
    const props = generateProposals(input, data.alibis, randomSeed());
    setProposals(props);
    setUsedInput(input);
    setEdits(
      Object.fromEntries(
        props.map((p) => [p.key, { message: p.message, location: p.location, followUps: p.followUps.map((_, i) => i === 0) }]),
      ),
    );
    window.setTimeout(() => resultsRef.current?.focus(), 0);
  };

  const save = (p: Proposal) => {
    if (!usedInput) return;
    const edit = edits[p.key];
    addAlibi(
      {
        messId: mess.id,
        templateId: p.templateId,
        excuseKey: p.excuseKey,
        title: p.title,
        message: edit.message.trim(),
        recipient: usedInput.person.trim(),
        date: usedInput.date,
        startTime: usedInput.startTime,
        endTime: usedInput.endTime,
        location: edit.location.trim(),
        activity: p.activity,
        tone: usedInput.tone,
        boldness: usedInput.boldness,
        intent: usedInput.intent,
        credibility: p.credibility,
      },
      p.followUps.filter((_, i) => edit.followUps[i]).map((f) => ({ ...f, messId: mess.id })),
    );
    toast('Alibi enregistré. Affaire classée. Pour l’instant.');
    navigate(paths.mess(mess.id));
  };

  return (
    <section className="page" aria-labelledby="page-title">
      <a href={paths.mess(mess.id)} className="back-link">
        ← Retour au dossier
      </a>
      <div className="page-head">
        <p className="eyebrow">Fabrique d’alibis · Atelier n° 3</p>
        <h1 id="page-title" className="page-title">
          Fabriquer un alibi
        </h1>
        <p className="page-lede">
          Pour « {mess.title} ». Trois versions des faits, artisanales, assemblées localement à partir de modèles. Aucune IA n’a été
          dérangée.
        </p>
      </div>

      <form className="card form factory-form" onSubmit={generate} noValidate>
        <div className="form__row">
          <div className="field">
            <label htmlFor="fa-situation">Situation à éviter</label>
            <input id="fa-situation" className="input" value={input.situation} maxLength={200} onChange={(e) => set('situation', e.target.value)} aria-describedby="fa-situation-hint" />
            <p id="fa-situation-hint" className="field__hint">
              Pour votre mémoire. Seul un montant (ex. « 20 € ») est repris dans les messages.
            </p>
          </div>
          <div className="field">
            <label htmlFor="fa-person">Personne concernée</label>
            <input id="fa-person" className="input" value={input.person} maxLength={200} onChange={(e) => set('person', e.target.value)} placeholder="Destinataire du message" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="fa-intent">Nature de la manœuvre</label>
          <select id="fa-intent" className="select" value={input.intent} onChange={(e) => set('intent', e.target.value as GeneratorInput['intent'])}>
            {INTENTS.map((i) => (
              <option key={i} value={i}>
                {INTENT_LABELS[i]}
              </option>
            ))}
          </select>
        </div>

        <div className="form__row">
          <div className="field">
            <label htmlFor="fa-date">Date</label>
            <input id="fa-date" className="input" type="date" value={input.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="fa-slot">Créneau</label>
            <select id="fa-slot" className="select" value={input.slotId} onChange={(e) => chooseSlot(e.target.value)}>
              {SLOT_PRESETS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
              <option value="custom">Horaires précis…</option>
            </select>
          </div>
        </div>
        {input.slotId === 'custom' && (
          <div className="form__row">
            <div className="field">
              <label htmlFor="fa-start">Début</label>
              <input id="fa-start" className="input" type="time" value={input.startTime} onChange={(e) => set('startTime', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="fa-end">Fin</label>
              <input id="fa-end" className="input" type="time" value={input.endTime} onChange={(e) => set('endTime', e.target.value)} />
            </div>
          </div>
        )}

        <fieldset className="field">
          <legend>Ton</legend>
          <div className="segmented segmented--3">
            {TONES.map((t) => (
              <label key={t} className="segmented__option">
                <input type="radio" name="tone" value={t} checked={input.tone === t} onChange={() => set('tone', t)} />
                <span>
                  {TONE_LABELS[t]}
                  <small>{TONE_HINTS[t]}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>Niveau de mauvaise foi</legend>
          <div className="segmented segmented--3">
            {BOLDNESS.map((b) => (
              <label key={b} className={`segmented__option boldness-opt boldness-opt--${b}`}>
                <input type="radio" name="boldness" value={b} checked={input.boldness === b} onChange={() => set('boldness', b)} />
                <span>
                  {BOLDNESS_LABELS[b]}
                  <small>{BOLDNESS_HINTS[b]}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
        <div className="form__actions">
          <button type="submit" className="btn btn--primary btn--large">
            {proposals.length ? '🔄 Trois autres versions' : '🪄 Générer trois alibis'}
          </button>
        </div>
      </form>

      {proposals.length > 0 && usedInput && (
        <section className="section" aria-labelledby="proposals-title">
          <h2 id="proposals-title" className="section-title" tabIndex={-1} ref={resultsRef}>
            Versions proposées
          </h2>
          <p className="muted small">
            Pour {usedInput.person || 'votre destinataire'}, le {formatShort(usedInput.date)}. Les indices de crédibilité sont des
            appréciations ludiques, pas des probabilités.
          </p>
          <div className="proposals">
            {proposals.map((p, idx) => {
              const edit = edits[p.key];
              const warnings = previewWarnings({ ...p, location: edit.location }, usedInput, data.alibis);
              return (
                <article key={p.key} className="card proposal" style={{ animationDelay: `${idx * 70}ms` }} aria-labelledby={`${p.key}-title`}>
                  <header className="proposal__head">
                    <span className="proposal__num" aria-hidden="true">
                      {idx + 1}
                    </span>
                    <h3 id={`${p.key}-title`} className="proposal__title">
                      {p.title}
                    </h3>
                  </header>
                  <div className="credibility" aria-label={`Indice de crédibilité : ${p.credibility} sur 100, ${p.credibilityLabel}`}>
                    <div className="credibility__bar" aria-hidden="true">
                      <span style={{ width: `${p.credibility}%` }} />
                    </div>
                    <p className="credibility__text">
                      <strong>{p.credibility}/100</strong> · <span className="stamp stamp--tone-ink stamp--tiny">{p.credibilityLabel}</span>
                    </p>
                    <p className="credibility__verdict">{p.verdict}</p>
                  </div>

                  <div className="field">
                    <label htmlFor={`${p.key}-msg`}>Message (modifiable)</label>
                    <textarea
                      id={`${p.key}-msg`}
                      className="textarea textarea--message"
                      rows={8}
                      value={edit.message}
                      onChange={(e) => setEdits((all) => ({ ...all, [p.key]: { ...edit, message: e.target.value } }))}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor={`${p.key}-loc`}>Lieu invoqué</label>
                    <input
                      id={`${p.key}-loc`}
                      className="input"
                      value={edit.location}
                      maxLength={200}
                      placeholder="Aucun lieu mentionné"
                      onChange={(e) => setEdits((all) => ({ ...all, [p.key]: { ...edit, location: e.target.value } }))}
                      aria-describedby={`${p.key}-loc-hint`}
                    />
                    <p id={`${p.key}-loc-hint`} className="field__hint">
                      Engagement invoqué : {p.activity}. Sert aux vérifications de cohérence.
                    </p>
                  </div>

                  <WarningList warnings={warnings} compact />

                  {p.followUps.length > 0 && (
                    <fieldset className="field proposal__followups">
                      <legend>Suivis à programmer</legend>
                      {p.followUps.map((f, i) => (
                        <label key={i} className="check">
                          <input
                            type="checkbox"
                            checked={edit.followUps[i]}
                            onChange={(e) =>
                              setEdits((all) => ({
                                ...all,
                                [p.key]: { ...edit, followUps: edit.followUps.map((v, j) => (j === i ? e.target.checked : v)) },
                              }))
                            }
                          />
                          <span>
                            {f.label} <span className="muted">({formatShort(f.dueDate)})</span>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  )}

                  <div className="proposal__actions">
                    <CopyButton text={edit.message} />
                    <button type="button" className="btn btn--primary" onClick={() => save(p)} disabled={!edit.message.trim()}>
                      Retenir cet alibi
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
