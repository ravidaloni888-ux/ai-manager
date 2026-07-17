import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UseCaseTable from '../components/list/UseCaseTable'
import PipelineView from '../components/list/PipelineView'
import { useUseCasesStore } from '../store/useCasesStore'
import { AIUseCase } from '../types'

type View = 'table' | 'pipeline' | 'pilot'

function IconTable() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-9.75 0h9.75" />
    </svg>
  )
}

function IconPipeline() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  )
}

function IconPilot() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

// ── Pilot Selection Wizard ─────────────────────────────────────────────────

const PILOT_CRITERIA = [
  { key: 'businessImpact', label: 'Geschäftlicher Nutzen', weight: 0.35, desc: 'Wie groß ist der erwartete Mehrwert?' },
  { key: 'feasibility',    label: 'Umsetzbarkeit',         weight: 0.30, desc: 'Daten vorhanden, technisch machbar?' },
  { key: 'strategicFit',  label: 'Strategische Passung',   weight: 0.20, desc: 'Passt zur KI-Vision des Unternehmens?' },
  { key: 'urgency',        label: 'Dringlichkeit',          weight: 0.15, desc: 'Zeitdruck oder Wettbewerbsdruck?' },
] as const

type CriteriaKey = typeof PILOT_CRITERIA[number]['key']

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  const stars = [2, 5, 8] // low / medium / high mapped to 1–10 scale
  const labels = ['Niedrig', 'Mittel', 'Hoch']
  const currentIdx = stars.indexOf(value)

  return (
    <div className="flex gap-1">
      {stars.map((v, i) => (
        <button
          key={v}
          onMouseEnter={() => setHover(i + 1)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(v)}
          className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
            (hover ? hover > i : currentIdx > i - 1)
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-slate-200 text-slate-400 hover:border-blue-300'
          }`}
        >
          {labels[i]}
        </button>
      ))}
    </div>
  )
}

function PilotWizard({ useCases }: { useCases: AIUseCase[] }) {
  const [scores, setScores] = useState<Record<string, Record<CriteriaKey, number>>>(() => {
    const init: Record<string, Record<CriteriaKey, number>> = {}
    useCases.forEach((uc) => {
      init[uc.id] = {
        businessImpact: uc.businessImpact || 5,
        feasibility:    uc.feasibility    || 5,
        strategicFit:   uc.strategicFit   || 5,
        urgency:        uc.urgency        || 5,
      }
    })
    return init
  })
  const [showResult, setShowResult] = useState(false)

  const setScore = (ucId: string, key: CriteriaKey, val: number) => {
    setScores((prev) => ({ ...prev, [ucId]: { ...prev[ucId], [key]: val } }))
    setShowResult(false)
  }

  const ranked = [...useCases]
    .map((uc) => {
      const s = scores[uc.id] ?? { businessImpact: 5, feasibility: 5, strategicFit: 5, urgency: 5 }
      const total = PILOT_CRITERIA.reduce((sum, c) => sum + s[c.key] * c.weight, 0)
      const isQuickWin = s.feasibility >= 8 && s.businessImpact >= 5
      return { uc, total, isQuickWin }
    })
    .sort((a, b) => b.total - a.total)

  const quickWin  = ranked.find((r) => r.isQuickWin) ?? ranked[0]
  const strategic = ranked.find((r) => r !== quickWin) ?? ranked[1]

  if (useCases.length < 2) {
    return (
      <div className="bg-white rounded-xl shadow-sm px-6 py-12 text-center">
        <p className="text-slate-500 text-sm">Mindestens 2 Use Cases erforderlich um Piloten auszuwählen.</p>
        <p className="text-slate-400 text-xs mt-1">Erstelle Use Cases über "New Use Case" (oben rechts).</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <p className="text-sm font-semibold text-blue-800">Pilot-Auswahl: Die besten 2 Use Cases finden</p>
        <p className="text-xs text-blue-600 mt-1">Bewerte jeden Use Case nach 4 Kriterien — der Wizard empfiehlt einen <strong>Quick Win</strong> und einen <strong>strategischen Piloten</strong>.</p>
      </div>

      {/* Scoring table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 grid gap-2" style={{ gridTemplateColumns: '1fr repeat(4, 160px)' }}>
          <span className="text-xs font-semibold text-slate-500">Use Case</span>
          {PILOT_CRITERIA.map((c) => (
            <span key={c.key} className="text-[10px] font-semibold text-slate-400 text-center whitespace-nowrap">{c.label}<br /><span className="text-slate-300">{Math.round(c.weight * 100)}%</span></span>
          ))}
        </div>
        <div className="divide-y divide-slate-50">
          {useCases.map((uc) => (
            <div key={uc.id} className="px-5 py-3 grid items-center gap-2" style={{ gridTemplateColumns: '1fr repeat(4, 160px)' }}>
              <div>
                <p className="text-xs font-semibold text-slate-800 leading-tight">{uc.title}</p>
                <p className="text-[10px] text-slate-400">{uc.department} · {uc.status}</p>
              </div>
              {PILOT_CRITERIA.map((c) => (
                <div key={c.key} className="flex justify-center">
                  <StarRating
                    value={scores[uc.id]?.[c.key] ?? 5}
                    onChange={(v) => setScore(uc.id, c.key, v)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowResult(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors">
          Empfehlung anzeigen →
        </button>
      </div>

      {/* Result */}
      {showResult && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { tag: '⚡ Quick Win', tagColor: 'bg-green-100 text-green-700 border-green-200', card: 'border-green-200 bg-green-50', entry: quickWin,
              desc: 'Hohe Umsetzbarkeit, schneller sichtbarer Erfolg — ideal als erstes Pilotprojekt.' },
            { tag: '🎯 Strategischer Pilot', tagColor: 'bg-blue-100 text-blue-700 border-blue-200', card: 'border-blue-200 bg-blue-50', entry: strategic,
              desc: 'Höchste Gesamtbewertung — langfristig am wertvollsten für die KI-Strategie.' },
          ].map(({ tag, tagColor, card, entry, desc }) => entry && (
            <div key={tag} className={`rounded-xl border ${card} px-5 py-4 space-y-2`}>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagColor}`}>{tag}</span>
              <p className="text-sm font-bold text-slate-800">{entry.uc.title}</p>
              <p className="text-xs text-slate-500">{entry.uc.department} · {entry.uc.status}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(entry.total / 10) * 100}%` }} />
                </div>
                <span className="text-xs font-mono font-semibold text-slate-600">{entry.total.toFixed(1)}/10</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
              {PILOT_CRITERIA.map((c) => (
                <div key={c.key} className="flex justify-between text-[10px]">
                  <span className="text-slate-500">{c.label}</span>
                  <span className="font-semibold text-slate-700">{scores[entry.uc.id]?.[c.key] === 8 ? 'Hoch' : scores[entry.uc.id]?.[c.key] === 5 ? 'Mittel' : 'Niedrig'}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ISO 42001 Use Case Register panel ─────────────────────────────────────

const ISO_REGISTER_REQUIREMENTS = [
  {
    clause: '§6.1.2',
    title: 'KI-Risikobewertung',
    description: 'Die Organisation muss KI-Risiken für jedes System identifizieren, analysieren und bewerten. Jeder Anwendungsfall im Register muss vor dem Einsatz ein dokumentiertes Risikoniveau haben.',
    check: (cases: AIUseCase[]) => cases.length > 0 && cases.every((c) => c.euAiActRisk),
    gap: (cases: AIUseCase[]) => {
      const missing = cases.filter((c) => !c.euAiActRisk).length
      return missing > 0 ? `${missing} Anwendungsfall${missing > 1 ? '‍fälle' : ''} ohne EU AI Act-Risikoniveau` : null
    },
  },
  {
    clause: '§8.2',
    title: 'KI-Risikobewertungsprozess',
    description: 'Es muss ein wiederholbarer Prozess zur Bewertung von KI-Risiken existieren — nicht ad hoc. Jeder Anwendungsfall sollte B×A×E und Maßnahmen dokumentieren, nicht nur ein Risiko-Label.',
    check: (cases: AIUseCase[]) => cases.length > 0,
    gap: (_cases: AIUseCase[]) => null,
  },
  {
    clause: '§8.4',
    title: 'KI-System-Folgenabschätzung',
    description: 'Vor dem Einsatz oder wesentlichen Änderungen eines KI-Systems müssen die potenziellen Auswirkungen auf Einzelpersonen, Gruppen und die Gesellschaft bewertet und dokumentiert werden.',
    check: (cases: AIUseCase[]) => cases.filter((c) => c.euAiActRisk === 'High Risk').every((c) => c.compliancePersonalData !== undefined && c.complianceDocumentation !== undefined),
    gap: (cases: AIUseCase[]) => {
      const highRisk = cases.filter((c) => c.euAiActRisk === 'High Risk')
      const missing = highRisk.filter((c) => c.compliancePersonalData === undefined).length
      return missing > 0 ? `${missing} Hochrisiko-Anwendungsfall${missing > 1 ? 'fälle' : ''} ohne Compliance-Checkliste` : null
    },
  },
  {
    clause: 'A.6.1',
    title: 'KI-System-Dokumentation (Anhang A)',
    description: 'Jedes KI-System muss mit Zweck, Verwendungszweck, Datenquellen, Modelltyp, Eigentümer und bekannten Einschränkungen dokumentiert werden — das KI-Canvas erfüllt diese Anforderung.',
    check: (cases: AIUseCase[]) => cases.length > 0 && cases.every((c) => c.businessProblem && c.department),
    gap: (cases: AIUseCase[]) => {
      const incomplete = cases.filter((c) => !c.businessProblem || !c.department).length
      return incomplete > 0 ? `${incomplete} Anwendungsfall${incomplete > 1 ? 'fälle' : ''} mit unvollständiger Dokumentation` : null
    },
  },
  {
    clause: 'A.7.1',
    title: 'KI-System-Lebenszyklusmanagement (Anhang A)',
    description: 'Das Register muss den aktuellen Lebenszyklusstatus jedes KI-Systems widerspiegeln — von der Idee über die Produktion bis zur Außerbetriebnahme — um Governance in jeder Phase sicherzustellen.',
    check: (cases: AIUseCase[]) => cases.length > 0 && cases.every((c) => !!c.status),
    gap: (_cases: AIUseCase[]) => null,
  },
]

function Iso42001RegisterPanel({ useCases }: { useCases: AIUseCase[] }) {
  const [open, setOpen] = useState(false)
  const passed = ISO_REGISTER_REQUIREMENTS.filter((r) => r.check(useCases)).length

  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">ISO 42001 · Anforderungen an das Anwendungsfall-Register</p>
            <p className="text-xs text-slate-500 mt-0.5">§6.1.2 · §8.2 · §8.4 · Anhang A.6 & A.7 — Dokumentations- und Risikobewertungspflichten</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            passed === ISO_REGISTER_REQUIREMENTS.length ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {passed}/{ISO_REGISTER_REQUIREMENTS.length} erfüllt
          </span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          <div className="px-5 py-3 bg-indigo-50">
            <p className="text-xs text-indigo-700 leading-relaxed">
              <span className="font-semibold">ISO 42001:2023</span> verpflichtet Organisationen, ein Register von KI-Systemen mit dokumentierten Risikobewertungen, Folgenabschätzungen und Lebenszyklusstatus zu führen. Die Prüfungen unten leiten sich aus dem Standard ab und werden live gegen Ihr aktuelles Portfolio ausgewertet.
            </p>
          </div>

          {ISO_REGISTER_REQUIREMENTS.map((req) => {
            const ok  = req.check(useCases)
            const gap = req.gap(useCases)
            return (
              <div key={req.clause} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  {ok ? (
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{req.clause}</span>
                    <p className="text-xs font-semibold text-slate-700">{req.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{req.description}</p>
                  {gap && (
                    <p className="text-[10px] text-amber-600 font-medium">⚠ {gap}</p>
                  )}
                  {ok && !gap && (
                    <p className="text-[10px] text-green-600 font-medium">✓ Anforderung erfüllt auf Basis des aktuellen Portfolios</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default function ListPage() {
  const navigate = useNavigate()
  const { useCases } = useUseCasesStore()
  const [view, setView] = useState<View>('table')

  const handleEdit = (id: string) => navigate(`/canvas/${id}`)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">KI-Anwendungsfälle</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Sortieren, filtern, gruppieren und verwalten Sie Ihr KI-Portfolio.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'table'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <IconTable /> Tabelle
          </button>
          <button
            onClick={() => setView('pipeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'pipeline'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <IconPipeline /> Pipeline
          </button>
          <button
            onClick={() => setView('pilot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'pilot'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <IconPilot /> Pilot-Auswahl
          </button>
        </div>
      </div>

      <Iso42001RegisterPanel useCases={useCases} />

      {view === 'table' && <UseCaseTable />}
      {view === 'pipeline' && <PipelineView useCases={useCases} onEdit={handleEdit} />}
      {view === 'pilot' && <PilotWizard useCases={useCases} />}
    </div>
  )
}
