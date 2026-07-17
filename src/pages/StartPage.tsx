import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemoStore } from '../store/demoStore'
import { useWizardStore, StepId } from '../store/wizardStore'

interface Step {
  id: StepId
  phase: string
  num: number
  title: string
  description: string
  detail: string
  effort: string
  to: string
  cta: string
}

export const STEPS: Step[] = [
  // ── Phase 1 ──
  {
    id: 'vision',
    phase: 'Strategie & Governance',
    num: 1,
    title: 'KI-Vision definieren',
    description: 'Legen Sie die strategische Ausrichtung fest — Zeithorizont, 3 Kernziele und die Wettbewerbsherausforderung, die den KI-Einsatz antreibt.',
    detail: 'Eine klare Vision richtet die Organisation aus und gibt jeder Anwendungsfallentscheidung einen "Nordstern". Ohne sie zerfallen KI-Bemühungen in isolierte Experimente, die sich nie verstärken.',
    effort: '~30 Min.',
    to: '/strategy',
    cta: 'Strategie-Assistent öffnen',
  },
  {
    id: 'maturity',
    phase: 'Strategie & Governance',
    num: 2,
    title: 'KI-Reifegrad einschätzen',
    description: 'Schließen Sie die Reifegradbeurteilung ab, um zu verstehen, wo Ihre Organisation in Bezug auf Daten, Talente, Tools und Governance steht.',
    detail: 'Der Reifegradscore zeigt, welche Anwendungsfälle heute realistisch sind und wo Sie investieren müssen, bevor Sie skalieren. Er verhindert Überversprechen gegenüber Stakeholdern.',
    effort: '~45 Min.',
    to: '/maturity',
    cta: 'Bewertung starten',
  },
  {
    id: 'governance',
    phase: 'Strategie & Governance',
    num: 3,
    title: 'KI-Governance-Richtlinie aufsetzen',
    description: 'Dokumentieren Sie Ihre organisationsweite KI-Richtlinie in 7 Dimensionen: Zweck, Daten, Transparenz, Verantwortung, Risiko, Ethik und Schulung.',
    detail: 'Eine schriftliche KI-Richtlinie ist unter dem EU AI Act erforderlich und wird von Unternehmenskunden und Regulatoren erwartet. Sie verhindert auch Schatten-KI-Initiativen, die rechtliche oder Reputationsrisiken erzeugen.',
    effort: '~1 Std.',
    to: '/governance',
    cta: 'KI-Governance öffnen',
  },
  {
    id: 'roles',
    phase: 'Strategie & Governance',
    num: 4,
    title: 'Rollen & Verantwortlichkeiten zuweisen',
    description: 'Benennen Sie KI-Verantwortlichen, Datenschutzbeauftragten, Ethik-Prüfer und andere Schlüsselrollen. Dokumentieren Sie, wer wofür verantwortlich ist.',
    detail: 'Der EU AI Act erfordert benannte Verantwortlichkeit. Ohne zugewiesene Rollen stocken Entscheidungen und Vorfälle haben keinen klaren Eigentümer.',
    effort: '~20 Min.',
    to: '/governance',
    cta: 'Rollen zuweisen',
  },

  // ── Phase 2 ──
  {
    id: 'usecases',
    phase: 'Portfolio-Management',
    num: 5,
    title: 'KI-Anwendungsfälle inventarisieren',
    description: 'Fügen Sie jede KI-Initiative — in Betrieb, in Evaluierung oder nur eine Idee — zum Portfolio hinzu. Inkl. Abteilung, Status und kurzer Problembeschreibung.',
    detail: 'Man kann nur managen, was man sieht. Viele Organisationen entdecken in dieser Phase Schatten-KI-Projekte — Initiativen, die ohne Governance oder Risikoprüfung laufen.',
    effort: '~1–2 Std.',
    to: '/use-cases',
    cta: 'Anwendungsfälle öffnen',
  },
  {
    id: 'score',
    phase: 'Portfolio-Management',
    num: 6,
    title: 'Portfolio bewerten & priorisieren',
    description: 'Füllen Sie das KI-Canvas für jeden Fall aus — Geschäftsnutzen, Machbarkeit, strategische Passung und Dringlichkeit — um ein Prioritätsranking zu errechnen.',
    detail: 'Priorisierung löst das Problem "der Lauteste gewinnt". Das gewichtete Scoremodell gibt der Führungsebene eine objektive Grundlage für Investitionsentscheidungen.',
    effort: '~30 Min. pro Fall',
    to: '/use-cases',
    cta: 'Anwendungsfälle bewerten',
  },
  {
    id: 'eu-act',
    phase: 'Portfolio-Management',
    num: 7,
    title: 'EU AI Act-Risiko je Fall klassifizieren',
    description: 'Legen Sie das EU AI Act-Risikoniveau (Minimal / Limited / High / Unacceptable) für jeden Anwendungsfall fest und füllen Sie die Datenschutz-Checkliste für Hochrisikofälle aus.',
    detail: 'Hochrisiko-KI-Systeme erfordern eine DSFA und zusätzliche Dokumentation unter dem EU AI Act. Frühzeitige Identifikation vermeidet kostspielige Nachbesserungen.',
    effort: '~15 Min. pro Fall',
    to: '/use-cases',
    cta: 'Risikoniveaus prüfen',
  },

  // ── Phase 3 ──
  {
    id: 'risks',
    phase: 'Risiko & Investition',
    num: 8,
    title: 'KI-Risiken erfassen & bewerten',
    description: 'Erfassen Sie technische, ethische und operative Risiken Ihres Portfolios. Bewerten Sie B×A×E, weisen Sie Verantwortliche zu und verfolgen Sie den Maßnahmenstatus.',
    detail: 'KI-Risiken (Bias, Modell-Drift, Vendor Lock-in) sind oft unsichtbar, bis sie einen Vorfall verursachen. Ein Risikoregister macht sie sichtbar und handhabbar, bevor sie eskalieren.',
    effort: '~1 Std.',
    to: '/risk',
    cta: 'Risikomanager öffnen',
  },
  {
    id: 'roadmap',
    phase: 'Risiko & Investition',
    num: 9,
    title: 'Roadmap generieren',
    description: 'Sequenzieren Sie Anwendungsfälle automatisch in Quartale basierend auf Prioritätsscore und Budgetobergrenze. Passen Sie durch Drag & Drop zwischen Quartalen an.',
    detail: 'Eine Roadmap wandelt das Prioritätsranking in eine Lieferverpflichtung um. Sie beantwortet die Frage, die Stakeholder immer stellen: "Wann sehen wir Ergebnisse?"',
    effort: '~30 Min.',
    to: '/roadmap',
    cta: 'Roadmap-Generator öffnen',
  },
  {
    id: 'roi',
    phase: 'Risiko & Investition',
    num: 10,
    title: 'ROI für Schlüsselfälle berechnen',
    description: 'Modellieren Sie für Ihre Hochprioritätsfälle Investitionskosten, Jahresnutzen, Amortisationszeit und Break-even-Punkt.',
    detail: 'Finanzen und Führungsebene werden ROI-Zahlen vor der Budgetfreigabe verlangen. Diese bereit zu haben — auch als Schätzungen — beschleunigt die Genehmigung erheblich.',
    effort: '~15 Min. pro Fall',
    to: '/roi',
    cta: 'ROI-Rechner öffnen',
  },

  // ── Phase 4 ──
  {
    id: 'enablement',
    phase: 'Betrieb & Personal',
    num: 11,
    title: 'Team-Schulung planen',
    description: 'Definieren Sie Ihren KI-Schulungsplan, identifizieren Sie Kompetenzlücken und planen Sie Coaching-Sessions für Teams, die mit KI-Systemen arbeiten.',
    detail: 'Der häufigste Grund, warum KI-Initiativen nach dem Start ins Stocken geraten, ist, dass Mitarbeitende das neue System nicht nutzen oder ihm nicht vertrauen können. Schulung ist keine Option.',
    effort: '~45 Min.',
    to: '/enablement',
    cta: 'Schulung & Coaching öffnen',
  },
  {
    id: 'meetings',
    phase: 'Betrieb & Personal',
    num: 12,
    title: 'Governance-Meetings einrichten',
    description: 'Etablieren Sie einen regelmäßigen KI-Lenkungsausschuss, monatliches Portfolio-Review und quartalsweises Strategie-Check-in. Dokumentieren Sie Agenda und Teilnehmende.',
    detail: 'Nachhaltige KI-Fortschritte erfordern einen Governance-Rhythmus. Ohne geplante Check-ins driftet das Portfolio, und Verantwortlichkeit schwindet innerhalb von 3–6 Monaten.',
    effort: '~20 Min.',
    to: '/meetings',
    cta: 'Meetings öffnen',
  },
]

const PHASES = [...new Set(STEPS.map((s) => s.phase))]

const PHASE_STYLE: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  'Strategie & Governance': { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800',  badge: 'bg-blue-100 text-blue-700' },
  'Portfolio-Management':   { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700' },
  'Risiko & Investition':   { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700' },
  'Betrieb & Personal':     { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  badge: 'bg-green-100 text-green-700' },
}


// ── Page ───────────────────────────────────────────────────────────────────
export default function StartPage() {
  const navigate = useNavigate()
  const demoMode = useDemoStore((s) => s.demoMode)
  const { done, toggle, init } = useWizardStore()
  const [expanded, setExpanded] = useState<StepId | null>(null)

  useEffect(() => { init() }, [demoMode])

  const completedCount = done.size
  const totalCount     = STEPS.length
  const pct            = Math.round((completedCount / totalCount) * 100)

  // first incomplete step id
  const nextStep = STEPS.find((s) => !done.has(s.id))

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Einstieg</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Ihr KI-Manager-Playbook — folgen Sie diesen Schritten, um ein solides KI-Programm aufzubauen.
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">
            {completedCount === totalCount
              ? '🎉 Alle Schritte abgeschlossen!'
              : `${completedCount} von ${totalCount} Schritten abgeschlossen`}
          </p>
          <span className="text-sm font-bold text-blue-600">{pct}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {nextStep && (
          <p className="text-xs text-slate-400 mt-2">
            Als nächstes: <span className="font-semibold text-slate-600">Schritt {nextStep.num} — {nextStep.title}</span>
          </p>
        )}
      </div>

      {/* Steps by phase */}
      {PHASES.map((phase) => {
        const phaseSteps  = STEPS.filter((s) => s.phase === phase)
        const phaseDone   = phaseSteps.filter((s) => done.has(s.id)).length
        const style       = PHASE_STYLE[phase]

        return (
          <div key={phase} className="space-y-2">
            {/* Phase header */}
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{phase}</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                {phaseDone}/{phaseSteps.length}
              </span>
            </div>

            {/* Step cards */}
            <div className="space-y-2">
              {phaseSteps.map((step) => {
                const isComplete = done.has(step.id)
                const isNext     = nextStep?.id === step.id
                const isExpanded = expanded === step.id

                return (
                  <div
                    key={step.id}
                    className={`bg-white rounded-xl border-2 transition-all ${
                      isComplete
                        ? 'border-slate-100 opacity-70'
                        : isNext
                        ? 'border-blue-400 shadow-md'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-4 p-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggle(step.id)}
                        className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                          isComplete
                            ? 'bg-green-500 border-green-500 text-white'
                            : isNext
                            ? 'border-blue-500 text-blue-500 hover:bg-blue-50'
                            : 'border-slate-300 text-slate-300 hover:border-slate-400'
                        }`}
                        title={isComplete ? 'Als unvollständig markieren' : 'Als abgeschlossen markieren'}
                      >
                        {isComplete ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <span className="text-xs font-bold">{step.num}</span>
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-semibold ${isComplete ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {step.title}
                              </p>
                              {isNext && (
                                <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">Weiter</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.description}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {step.effort}
                            </span>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className={`mt-3 p-3 rounded-lg text-xs text-slate-600 leading-relaxed border ${style.bg} ${style.border}`}>
                            <p className={`font-semibold mb-1 ${style.text}`}>Warum dieser Schritt wichtig ist</p>
                            {step.detail}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-2.5">
                          <button
                            onClick={() => navigate(`${step.to}?from=wizard&step=${step.id}`)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                              isComplete
                                ? 'text-slate-500 bg-slate-50 hover:bg-slate-100'
                                : 'text-white bg-blue-600 hover:bg-blue-500'
                            }`}
                          >
                            {step.cta} →
                          </button>
                          <button
                            onClick={() => setExpanded(isExpanded ? null : step.id)}
                            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {isExpanded ? 'Detail ausblenden' : 'Warum?'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Footer note */}
      <p className="text-xs text-slate-400 pb-2">
        Schritte können in beliebiger Reihenfolge abgeschlossen werden — die obige Sequenz spiegelt den empfohlenen Ansatz für neue KI-Manager wider.
        Fortschritt wird automatisch im Browser gespeichert.
      </p>
    </div>
  )
}
