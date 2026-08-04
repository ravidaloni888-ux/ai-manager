import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { STEPS } from './StartPage'
import { useWizardStore, StepId, useActiveScope, deriveStepNotes } from '../store/wizardStore'
import { useProfil, useProfilStore } from '../store/mandantProfil'
import { useUseCasesStore } from '../store/useCasesStore'
import { useMandantStore, MANDANT_STYLE } from '../store/mandantStore'
import { useIsDemo } from '../store/mandantStore'
import MandatProfil from '../components/start/MandatProfil'
import FaelleAuswahl from '../components/start/FaelleAuswahl'
import CanvasPage from './CanvasPage'

// ─────────────────────────────────────────────────────────────────────────
// Geführter Modus — Plan und Werkzeug auf einer Seite.
//
// Die Schiene links zeigt jederzeit, was erledigt ist und was ansteht; rechts
// wird das Werkzeug des aktuellen Schritts direkt eingebettet. Es gibt keinen
// Seitenwechsel, deshalb geht der Faden nicht verloren.
// ─────────────────────────────────────────────────────────────────────────

const StrategyPage         = lazy(() => import('./StrategyPage'))
const MaturityPage         = lazy(() => import('./MaturityPage'))
const DsgvoPage            = lazy(() => import('./DsgvoPage'))
const EthikPage            = lazy(() => import('./EthikPage'))
const EuAiActPage          = lazy(() => import('./EuAiActPage'))
const GovernancePage       = lazy(() => import('./GovernancePage'))
const StakeholderPage      = lazy(() => import('./StakeholderPage'))
const ListPage             = lazy(() => import('./ListPage'))
const RiskPage             = lazy(() => import('./RiskPage'))
const RoadmapPage          = lazy(() => import('./RoadmapPage'))
const RoiPage              = lazy(() => import('./RoiPage'))
const QAPage               = lazy(() => import('./QAPage'))
const DataGovernancePage   = lazy(() => import('./DataGovernancePage'))
const ChangeManagementPage = lazy(() => import('./ChangeManagementPage'))
const EnablementPage       = lazy(() => import('./EnablementPage'))

/** Welches Werkzeug gehört zu welchem Schritt? */
const TOOL: Record<StepId, React.LazyExoticComponent<() => JSX.Element>> = {
  'vision':         StrategyPage,
  'maturity':       MaturityPage,
  'eu-act-basics':  EuAiActPage,
  'dsgvo':          DsgvoPage,
  'ethics':         EthikPage,
  'governance':     GovernancePage,
  'roles':          GovernancePage,
  'stakeholders':   StakeholderPage,
  'usecases':       ListPage,
  'data-quality':   ListPage,
  'score':          ListPage,
  'eu-act':         ListPage,
  'project-plan':   ListPage,
  'risks':          RiskPage,
  'roadmap':        RoadmapPage,
  'roi':            RoiPage,
  'qa':             QAPage,
  'data-integrity': DataGovernancePage,
  'change':         ChangeManagementPage,
  'enablement':     EnablementPage,
} as Record<StepId, React.LazyExoticComponent<() => JSX.Element>>

/** Schritte, deren Eingaben im einzelnen Anwendungsfall stattfinden. */
const IM_FALL: StepId[] = ['usecases', 'data-quality', 'score', 'eu-act', 'project-plan']

export default function GuidePage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const activeId  = useMandantStore((s) => s.activeId)
  const mandanten = useMandantStore((s) => s.mandanten)
  const scope = useActiveScope()
  const { done, toggle, init } = useWizardStore()
  const profil = useProfil()
  const initProfil = useProfilStore((p) => p.init)
  const { useCases } = useUseCasesStore()
  const [theorieOffen, setTheorieOffen] = useState(false)
  const istDemo = useIsDemo()

  // Der geführte Modus behält den Rahmen: Anlegen und Fallbearbeitung
  // laufen als Unterzustand in der URL, nicht als eigene Seite.
  const fallId = params.get('fall')
  const fallCheck = params.get('check') ?? ''
  const legtAn = params.get('neu') === '1'

  useEffect(() => { init(); initProfil() }, [activeId, init, initProfil])

  const mandant = mandanten.find((m) => m.id === activeId)

  const scopeSet = new Set<StepId>(scope)
  const steps = useMemo(
    () => STEPS.filter((s) => scopeSet.has(s.id) && s.kind !== 'read').map((s, i) => ({ ...s, num: i + 1 })),
    [scope],
  )

  const notes = deriveStepNotes({
    iso42001: profil.iso42001,
    faelle: useCases.length,
    hatHochrisiko: useCases.some((uc) => uc.euAiActRisk === 'High Risk' || uc.euAiActRisk === 'Unacceptable Risk'),
  })

  const pflicht = steps.filter((s) => !notes[s.id]?.entfaellt)
  const erledigt = pflicht.filter((s) => done.has(s.id)).length
  const gesamt   = pflicht.length
  const pct      = gesamt > 0 ? Math.round((erledigt / gesamt) * 100) : 0

  // Aktueller Schritt: aus der URL, sonst der erste offene
  const offen = pflicht.find((s) => !done.has(s.id))
  const urlStep = params.get('step') as StepId | null
  const current = steps.find((s) => s.id === urlStep) ?? offen ?? pflicht[pflicht.length - 1] ?? steps[0]

  const geheZu = (id: StepId) => {
    setParams({ step: id })   // fall/neu fallen dabei weg — bewusst
    setTheorieOffen(false)
    document.querySelector('[data-guide-main]')?.scrollTo({ top: 0 })
  }

  if (!current) {
    return (
      <div className="p-6 max-w-2xl">
        <p className="text-sm text-slate-500">Für dieses Mandat ist kein Schritt im Umfang. Umfang im Einstieg anpassen.</p>
      </div>
    )
  }

  const idx      = steps.findIndex((s) => s.id === current.id)
  const vorher   = idx > 0 ? steps[idx - 1] : null
  const nachher  = idx >= 0 && idx < steps.length - 1 ? steps[idx + 1] : null
  const istFertig = done.has(current.id)
  const note     = notes[current.id]
  const Tool     = TOOL[current.id]

  const weiter = () => {
    if (!istFertig) toggle(current.id)
    const naechster = pflicht.find((s) => s.id !== current.id && !done.has(s.id))
    if (naechster) geheZu(naechster.id)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Schiene: der Plan ─────────────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto no-print">
        <div className="px-4 py-4 border-b border-slate-100">
          {mandant && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <span>{MANDANT_STYLE[mandant.type].icon}</span>
              {mandant.name}
            </p>
          )}
          <p className="text-sm font-semibold text-slate-800">
            {erledigt === gesamt ? '🎉 Alles erledigt' : `${erledigt} von ${gesamt} erledigt`}
          </p>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {gesamt - erledigt > 0 && (
            <p className="text-[11px] text-slate-400 mt-1.5">
              <span className="font-semibold text-slate-600">{gesamt - erledigt} offen</span> · {erledigt} erledigt
            </p>
          )}
          {istDemo && (
            <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 mt-2 leading-relaxed">
              Demo-Mandant: Alle Schritte gelten als erledigt, damit Sie jeden anschauen können.
              Für echten Fortschritt ein eigenes Mandat wählen.
            </p>
          )}
        </div>

        <nav className="py-2">
          {steps.map((s, i) => {
            const skipped = !!notes[s.id]?.entfaellt
            const fertig  = done.has(s.id)
            const aktiv   = s.id === current.id
            const neuePhase = i === 0 || steps[i - 1].phase !== s.phase
            return (
              <div key={s.id}>
                {neuePhase && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 pt-4 pb-1">
                    {s.phase}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => geheZu(s.id)}
                  className={`w-full text-left flex items-start gap-2.5 px-4 py-2 transition-colors ${
                    aktiv ? 'bg-blue-50 border-l-2 border-blue-600' : 'border-l-2 border-transparent hover:bg-slate-50'
                  }`}
                >
                  {/* Der Kreis zeigt immer den Status — gefüllter Haken heisst
                      erledigt, offener Ring heisst offen. „Aktiv" wird nur
                      über Hintergrund und Balken markiert, nie über den Kreis,
                      sonst verdeckt die Auswahl den Fortschritt. */}
                  <span
                    className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                      fertig ? 'bg-green-500 text-white'
                      : skipped ? 'border-2 border-dashed border-slate-200 text-slate-300'
                      : aktiv ? 'border-2 border-blue-500 bg-white text-blue-600'
                      : 'border-2 border-slate-300 bg-white text-slate-500'
                    }`}
                  >
                    {fertig ? '✓' : skipped ? '–' : s.num}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-xs leading-snug ${
                        skipped ? 'text-slate-300'
                        : fertig ? `text-slate-400 line-through ${aktiv ? 'font-semibold' : ''}`
                        : aktiv ? 'font-semibold text-blue-800'
                        : 'text-slate-700'
                      }`}
                    >
                      {s.title}
                    </span>
                    {skipped && <span className="block text-[10px] text-slate-400">entfällt</span>}
                  </span>
                  {/* Farbe allein reicht nicht — der Stand steht auch als Wort da */}
                  {!skipped && (
                    <span className={`text-[9px] font-semibold uppercase tracking-wide flex-shrink-0 mt-1 ${
                      fertig ? 'text-green-600' : 'text-slate-400'
                    }`}>
                      {fertig ? 'fertig' : 'offen'}
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/start')}
            className="text-[11px] text-slate-400 hover:text-slate-600"
          >
            Übersicht &amp; Umfang →
          </button>
        </div>
      </aside>

      {/* ── Arbeitsfläche: das Werkzeug ───────────────────────────────── */}
      <div data-guide-main className="flex-1 overflow-y-auto">
        {/* Auftrag */}
        <div className="bg-white border-b border-slate-200 px-6 py-5">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Schritt {current.num} von {steps.length} · {current.phase}
            </p>
            <div className="flex items-start justify-between gap-4 mt-1">
              <h1 className="text-xl font-bold text-slate-800">{current.title}</h1>
              <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 mt-1">
                {current.effort}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{current.description}</p>

            {note?.entfaellt && (
              <p className="text-[11px] text-slate-500 mt-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
                <strong className="text-slate-600">Dieser Schritt entfällt.</strong> {note.grund}
              </p>
            )}
            {note?.hinweis && (
              <p className="text-[11px] text-amber-800 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                {note.hinweis}
              </p>
            )}

            {/* Was ist einzutragen */}
            {current.eingaben && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-xs font-bold text-blue-900">Das tragen Sie hier ein</p>
                <ul className="mt-1.5 space-y-1">
                  {current.eingaben.map((e) => (
                    <li key={e} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                      <span className="text-xs text-slate-700 leading-relaxed">{e}</span>
                    </li>
                  ))}
                </ul>
                {IM_FALL.includes(current.id) && (
                  <p className="text-[11px] text-blue-800 mt-2.5 leading-relaxed">
                    Diese Eingaben machen Sie je Anwendungsfall — wählen Sie unten einen Fall,
                    dann öffnet sich der Canvas direkt an dieser Prüfung.
                  </p>
                )}
              </div>
            )}

            {/* Theorie auf Abruf */}
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setTheorieOffen((v) => !v)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                {theorieOffen ? '📖 Erklärung ausblenden' : '📖 Verstehe ich nicht — erklär mir warum'}
              </button>
              <button
                type="button"
                onClick={() => navigate(current.to)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Ganze Seite separat öffnen →
              </button>
            </div>
            {theorieOffen && (
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-700 mb-1">Warum dieser Schritt</p>
                <p className="text-xs text-slate-600 leading-relaxed">{current.detail}</p>
              </div>
            )}
          </div>
        </div>

        {/* Das Mandanten-Profil beim ersten Schritt gleich mit abfragen */}
        {idx === 0 && (
          <div className="px-6 pt-5 max-w-3xl">
            <MandatProfil />
          </div>
        )}

        {/* Bei Arbeit je Fall: Auswahl, Anlage und Bearbeitung — alles im Rahmen */}
        {IM_FALL.includes(current.id) ? (
          <div className="pb-24 px-6 pt-5">
            {(legtAn || fallId) && (
              <button
                type="button"
                onClick={() => setParams({ step: current.id })}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 mb-4"
              >
                ← Zurück zur Fallübersicht
              </button>
            )}

            {legtAn ? (
              <CanvasPage
                eingebettet
                onAngelegt={(id) => setParams({ step: current.id, fall: id, check: 'risiko' })}
                onAbbrechen={() => setParams({ step: current.id })}
              />
            ) : fallId ? (
              <CanvasPage id={fallId} check={fallCheck} eingebettet />
            ) : (
              <div className="-mx-6 -mt-5">
                <FaelleAuswahl
                  step={current.id}
                  onNeu={() => setParams({ step: current.id, neu: '1' })}
                  onFallWaehlen={(id, check) =>
                    setParams(check ? { step: current.id, fall: id, check } : { step: current.id, fall: id })}
                />
              </div>
            )}
          </div>
        ) : (
        <div className="pb-24">
          <Suspense
            fallback={
              <div className="p-10 text-center text-sm text-slate-400">Werkzeug wird geladen…</div>
            }
          >
            {Tool ? <Tool /> : (
              <div className="p-6 text-sm text-slate-500">
                Für diesen Schritt gibt es kein eingebettetes Werkzeug.
              </div>
            )}
          </Suspense>
        </div>
        )}

        {/* Fußleiste: weiter im Plan */}
        <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur px-6 py-3 flex items-center gap-3 no-print">
          <button
            type="button"
            disabled={!vorher}
            onClick={() => vorher && geheZu(vorher.id)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:text-slate-300 disabled:cursor-not-allowed"
          >
            ← Zurück
          </button>

          <span className="text-[11px] text-slate-400 ml-2 min-w-0 truncate">
            {nachher ? <>Danach: {nachher.title}</> : 'Letzter Schritt'}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {nachher && (
              <button
                type="button"
                onClick={() => geheZu(nachher.id)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-2"
              >
                Später erledigen
              </button>
            )}
            <button
              type="button"
              onClick={weiter}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                istFertig
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {istFertig ? 'Erledigt ✓ — weiter' : 'Erledigt — weiter →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
