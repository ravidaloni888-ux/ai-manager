import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMandantStore } from '../store/mandantStore'
import { useProfilStore } from '../store/mandantProfil'
import type { Rolle, IsoZiel, Branche } from '../store/mandantProfil'
import { StepId, ALL_STEP_IDS } from '../store/wizardStore'
import { scopedSet } from '../lib/mandantData'
import { useUseCasesStore } from '../store/useCasesStore'
import { useWizardStore } from '../store/wizardStore'
import { STEPS } from './StartPage'

// ─────────────────────────────────────────────────────────────────────────
// Interview beim Anlegen einer neuen Firma: Auftrag, Profil und Vorhandenes
// werden abgefragt — daraus entsteht ausschliesslich die Arbeitsliste
// (Wizard-Schritte und Häkchen). Referenz- und Wissensinhalte bleiben
// draussen; die gibt es nur im Demo-Mandanten.
// ─────────────────────────────────────────────────────────────────────────

type IStep = 'firma' | 'auftrag' | 'profil' | 'vorhanden' | 'summary'
const ORDER: IStep[] = ['firma', 'auftrag', 'profil', 'vorhanden', 'summary']
const LABEL: Record<IStep, string> = {
  firma: 'Firma',
  auftrag: 'Auftrag',
  profil: 'Rahmen',
  vorhanden: 'Vorhandenes',
  summary: 'Anlegen',
}

interface Ziel { key: string; label: string; desc: string; steps: StepId[] }

const ZIELE: Ziel[] = [
  { key: 'strategie',  label: 'Strategie & Standortbestimmung',
    desc: 'KI-Vision festlegen und Reifegrad einschätzen.',
    steps: ['vision', 'maturity'] },
  { key: 'governance', label: 'Governance & Organisation',
    desc: 'Richtlinie, Rollen und Stakeholder-Landkarte aufbauen.',
    steps: ['governance', 'roles', 'stakeholders'] },
  { key: 'compliance', label: 'Compliance-Prüfung des Bestands',
    desc: 'KI-Systeme inventarisieren, nach EU AI Act einstufen, Massnahmenplan und Risiken.',
    steps: ['usecases', 'eu-act', 'project-plan', 'risks'] },
  { key: 'usecase',    label: 'Use-Case-Entwicklung',
    desc: 'Fälle erfassen, Datenqualität prüfen, priorisieren, Abnahmekriterien und ROI.',
    steps: ['usecases', 'data-quality', 'score', 'qa', 'roi'] },
  { key: 'invest',     label: 'Roadmap & Investitionsplanung',
    desc: 'Portfolio in Quartale bringen und Budgetentscheidung vorbereiten.',
    steps: ['roadmap', 'roi', 'risks'] },
  { key: 'betrieb',    label: 'Einführung & Betrieb',
    desc: 'Datenintegrität, Change-Begleitung und Schulung der Teams.',
    steps: ['data-integrity', 'change', 'enablement'] },
]

/** Dinge, die es beim Kunden schon geben kann — vorhandene bekommen den Haken. */
const VORHANDEN: { id: StepId; label: string }[] = [
  { id: 'vision',       label: 'Eine KI-Strategie / Vision existiert bereits' },
  { id: 'maturity',     label: 'Der KI-Reifegrad wurde schon eingeschätzt' },
  { id: 'governance',   label: 'Eine KI-Richtlinie ist vorhanden' },
  { id: 'roles',        label: 'Verantwortlichkeiten sind benannt' },
  { id: 'stakeholders', label: 'Eine Stakeholder-Analyse liegt vor' },
  { id: 'usecases',     label: 'Ein Inventar der KI-Systeme existiert' },
]

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'

function Choice<T extends string>({ options, value, onChange }: {
  options: [T, string][]; value: T | null; onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(([v, l]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
            value === v ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}>
          {l}
        </button>
      ))}
    </div>
  )
}

export default function MandantInterviewPage() {
  const navigate = useNavigate()
  const addClient = useMandantStore((s) => s.addClient)
  const setActive = useMandantStore((s) => s.setActive)
  const setProfil = useProfilStore((p) => p.set)
  const resetCases = useUseCasesStore((s) => s.resetStore)
  const initCases = useUseCasesStore((s) => s.init)
  const initWizard = useWizardStore((s) => s.init)

  const [step, setStep] = useState<IStep>('firma')

  // Firma
  const [name, setName] = useState('')
  const [note, setNote] = useState('')

  // Auftrag
  const [ziele, setZiele] = useState<Set<string>>(new Set())

  // Rahmen (Profil)
  const [rolle, setRolle] = useState<Rolle | null>(null)
  const [betriebsrat, setBetriebsrat] = useState<boolean | null>(null)
  const [iso, setIso] = useState<IsoZiel | null>(null)
  const [branche, setBranche] = useState<Branche | null>(null)

  // Vorhandenes
  const [vorhanden, setVorhanden] = useState<Set<StepId>>(new Set())

  const idx = ORDER.indexOf(step)

  // Abgeleiteter Umfang: nur Arbeitsschritte aus den gewählten Zielen,
  // in der fachlichen Gesamtreihenfolge. Wissensmodule kommen nie hinein.
  const scopeSet = new Set<StepId>(
    ZIELE.filter((z) => ziele.has(z.key)).flatMap((z) => z.steps),
  )
  // ISO 42001 angestrebt → Governance wird gebraucht, auch ohne Governance-Ziel
  if (iso === 'ja') scopeSet.add('governance')
  const scope = ALL_STEP_IDS.filter((id) => scopeSet.has(id))

  const erledigt = scope.filter((id) => vorhanden.has(id))
  const offen = scope.filter((id) => !vorhanden.has(id))
  const titelVon = (id: StepId) => STEPS.find((s) => s.id === id)?.title ?? id

  const kannWeiter: Record<IStep, boolean> = {
    firma: name.trim().length > 0,
    auftrag: ziele.size > 0,
    profil: rolle !== null && betriebsrat !== null && iso !== null && branche !== null,
    vorhanden: true,
    summary: true,
  }

  const anlegen = () => {
    const id = addClient(name.trim(), note.trim() || undefined, scope, 'interview')
    setActive(id)
    // Profil des neuen Mandanten füllen (wirkt auf den aktiven Mandanten)
    setProfil({
      rolle: rolle ?? undefined,
      betriebsrat: betriebsrat ?? undefined,
      iso42001: iso ?? undefined,
      branche: branche ?? undefined,
    })
    // Vorhandenes bekommt direkt den Haken
    if (erledigt.length > 0) scopedSet('wizard', erledigt)
    // Stores auf den neuen Mandanten umstellen
    resetCases()
    setTimeout(() => { initCases(); initWizard() }, 0)
    navigate('/guide')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Neue Firma anlegen</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Vier kurze Fragenblöcke — daraus entsteht die Arbeitsliste für dieses Mandat.
          Nur To-dos, keine Theorie.
        </p>
      </div>

      {/* Schritt-Leiste */}
      <div className="flex items-center gap-1 flex-wrap">
        {ORDER.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <button
              type="button"
              disabled={i > idx}
              onClick={() => i < idx && setStep(s)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                s === step ? 'bg-blue-600 text-white'
                : i < idx ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-slate-100 text-slate-400'
              }`}
            >
              <span>{i < idx ? '✓' : i + 1}</span>
              {LABEL[s]}
            </button>
            {i < ORDER.length - 1 && <span className="text-slate-300 text-xs">·</span>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        {step === 'firma' && (
          <>
            <div>
              <label className={labelCls}>Wie heisst die Firma? *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Müller Maschinenbau GmbH" autoFocus />
            </div>
            <div>
              <label className={labelCls}>Kurznotiz (optional)</label>
              <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Branche, Projektname oder Ansprechpartner" />
            </div>
            <p className="text-[11px] text-slate-400">
              Kundendaten bleiben ausschliesslich lokal in diesem Browser.
            </p>
          </>
        )}

        {step === 'auftrag' && (
          <>
            <label className={labelCls}>Was ist bei dieser Firma gefragt? (Mehrfachauswahl)</label>
            <div className="space-y-2">
              {ZIELE.map((z) => {
                const on = ziele.has(z.key)
                return (
                  <button key={z.key} type="button"
                    onClick={() => setZiele((prev) => {
                      const next = new Set(prev)
                      on ? next.delete(z.key) : next.add(z.key)
                      return next
                    })}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      on ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                        on ? 'bg-blue-600 text-white' : 'border border-slate-300 text-transparent'
                      }`}>✓</span>
                      <p className="text-sm font-semibold text-slate-800">{z.label}</p>
                      <span className="ml-auto text-[10px] text-slate-400 flex-shrink-0">{z.steps.length} Schritte</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 ml-6 leading-relaxed">{z.desc}</p>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 'profil' && (
          <>
            <div>
              <label className={labelCls}>Rolle nach EU AI Act</label>
              <Choice<Rolle>
                options={[['betreiber', 'Betreiber — setzt KI ein'], ['anbieter', 'Anbieter — entwickelt/vertreibt KI']]}
                value={rolle} onChange={setRolle} />
            </div>
            <div>
              <label className={labelCls}>Gibt es einen Betriebsrat?</label>
              <Choice options={[['ja', 'Ja'], ['nein', 'Nein']] as ['ja' | 'nein', string][]}
                value={betriebsrat === null ? null : betriebsrat ? 'ja' : 'nein'}
                onChange={(v) => setBetriebsrat(v === 'ja')} />
            </div>
            <div>
              <label className={labelCls}>Wird eine ISO-42001-Zertifizierung angestrebt?</label>
              <Choice<IsoZiel>
                options={[['ja', 'Ja'], ['nein', 'Nein'], ['spaeter', 'Später entscheiden']]}
                value={iso} onChange={setIso} />
            </div>
            <div>
              <label className={labelCls}>Branche</label>
              <Choice<Branche>
                options={[['sonstige', 'Sonstige'], ['medizin', 'Medizin'], ['finanzen', 'Finanzen'], ['oeffentlich', 'Öffentliche Hand']]}
                value={branche} onChange={setBranche} />
            </div>
          </>
        )}

        {step === 'vorhanden' && (
          <>
            <label className={labelCls}>Was existiert bei der Firma schon? Das bekommt direkt den Haken.</label>
            <div className="space-y-2">
              {VORHANDEN.filter((v) => scopeSet.has(v.id)).map((v) => {
                const on = vorhanden.has(v.id)
                return (
                  <button key={v.id} type="button"
                    onClick={() => setVorhanden((prev) => {
                      const next = new Set(prev)
                      on ? next.delete(v.id) : next.add(v.id)
                      return next
                    })}
                    className={`w-full text-left rounded-lg border px-3 py-2 flex items-center gap-2 transition-colors ${
                      on ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                    <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                      on ? 'bg-green-500 text-white' : 'border border-slate-300 text-transparent'
                    }`}>✓</span>
                    <span className="text-sm text-slate-700">{v.label}</span>
                  </button>
                )
              })}
              {VORHANDEN.filter((v) => scopeSet.has(v.id)).length === 0 && (
                <p className="text-xs text-slate-400">
                  Für den gewählten Auftrag gibt es hier nichts abzufragen — weiter zur Zusammenfassung.
                </p>
              )}
            </div>
          </>
        )}

        {step === 'summary' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">{name}</p>
              {note && <p className="text-xs text-slate-400">{note}</p>}
            </div>

            <div>
              <p className={labelCls}>Arbeitsliste — {offen.length} offen{erledigt.length > 0 && `, ${erledigt.length} bereits erledigt`}</p>
              <div className="space-y-1">
                {scope.map((id, i) => {
                  const done = vorhanden.has(id)
                  return (
                    <div key={id} className="flex items-center gap-2.5 py-1">
                      <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                        done ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {done ? '✓' : i + 1}
                      </span>
                      <span className={`text-sm ${done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {titelVon(id)}
                      </span>
                    </div>
                  )
                })}
                {scope.length === 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Noch kein Auftrag gewählt — zurück zu Schritt 2.
                  </p>
                )}
              </div>
            </div>

            {iso === 'ja' && !ziele.has('governance') && (
              <p className="text-[11px] text-slate-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                ISO 42001 wird angestrebt — die Governance-Richtlinie wurde deshalb mit aufgenommen.
              </p>
            )}
            <p className="text-[11px] text-slate-400">
              Referenz- und Wissensinhalte (EU AI Act-Grundlagen, DSGVO-Theorie, Ethik-Rahmen) sind
              bewusst nicht Teil der Liste — zum Nachschlagen stehen sie im Demo-Mandanten.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (idx > 0 ? setStep(ORDER[idx - 1]) : navigate(-1))}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-2"
        >
          ← {idx > 0 ? 'Zurück' : 'Abbrechen'}
        </button>
        <div className="ml-auto">
          {step !== 'summary' ? (
            <button
              type="button"
              disabled={!kannWeiter[step]}
              onClick={() => setStep(ORDER[idx + 1])}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              Weiter →
            </button>
          ) : (
            <button
              type="button"
              disabled={scope.length === 0}
              onClick={anlegen}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:bg-slate-300 transition-colors"
            >
              Firma anlegen — {offen.length} To-dos starten ✓
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
