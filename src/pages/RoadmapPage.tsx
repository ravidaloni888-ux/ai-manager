import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUseCasesStore } from '../store/useCasesStore'
import { useStrategyStore } from '../store/strategyStore'
import { useDemoStore } from '../store/demoStore'
import { AIUseCase } from '../types'

// ── quarters ──────────────────────────────────────────────────────────────
const QUARTERS = ['Q3 2026', 'Q4 2026', 'Q1 2027', 'Q2 2027', 'Q3 2027'] as const
const ALL_SLOTS = [...QUARTERS, 'Backlog'] as const
type Slot = typeof ALL_SLOTS[number]
type Plan = Record<Slot, string[]>

// plan storage is scoped per demo/workspace mode, since use case IDs differ between the two
const LS_KEY_BASE = 'ai_roadmap_v1'
function lsKey(demoMode: boolean) { return `${LS_KEY_BASE}_${demoMode ? 'demo' : 'workspace'}` }
function lsLoad(demoMode: boolean): Plan | null {
  try { const r = localStorage.getItem(lsKey(demoMode)); return r ? JSON.parse(r) : null } catch { return null }
}
function lsSave(demoMode: boolean, p: Plan) {
  try { localStorage.setItem(lsKey(demoMode), JSON.stringify(p)) } catch {}
}
// true if the plan references none of the current use case IDs (stale plan from a different dataset)
function planIsStale(plan: Plan, useCases: AIUseCase[]): boolean {
  if (useCases.length === 0) return false
  const ids = new Set(useCases.map((uc) => uc.id))
  const planned = ALL_SLOTS.flatMap((s) => plan[s])
  if (planned.length === 0) return false
  return !planned.some((id) => ids.has(id))
}
function emptyPlan(): Plan {
  const p: Partial<Plan> = {}
  for (const q of ALL_SLOTS) p[q] = []
  return p as Plan
}

// ── sequencing ────────────────────────────────────────────────────────────
function generate(useCases: AIUseCase[], budgetCapK: number, maxPerQ: number): Plan {
  const plan = emptyPlan()
  const spent: Record<string, number> = Object.fromEntries(QUARTERS.map((q) => [q, 0]))

  const eligible = [...useCases]
    .filter((uc) => uc.status !== 'Production' && uc.status !== 'Cancelled')
    .sort((a, b) => b.priorityScore - a.priorityScore)

  for (const uc of eligible) {
    let placed = false
    for (const q of QUARTERS) {
      if (plan[q].length < maxPerQ && spent[q] + uc.estimatedCostK <= budgetCapK) {
        plan[q].push(uc.id)
        spent[q] += uc.estimatedCostK
        placed = true
        break
      }
    }
    if (!placed) plan['Backlog'].push(uc.id)
  }
  return plan
}

// ── dept badge colours ────────────────────────────────────────────────────
const DEPT_COLOURS: Record<string, string> = {
  Sales: 'bg-blue-100 text-blue-700',
  Finance: 'bg-emerald-100 text-emerald-700',
  Operations: 'bg-purple-100 text-purple-700',
  'Customer Service': 'bg-sky-100 text-sky-700',
  HR: 'bg-pink-100 text-pink-700',
  IT: 'bg-indigo-100 text-indigo-700',
  Legal: 'bg-amber-100 text-amber-700',
  Marketing: 'bg-orange-100 text-orange-700',
  Logistics: 'bg-teal-100 text-teal-700',
}

// ── BCG Three Horizons ───────────────────────────────────────────────────

const HORIZONS = [
  {
    key: 'deploy',
    label: 'Deploy',
    zeitraum: '3–12 Monate',
    titel: 'Bestehende Workflows verbessern',
    body: 'Schneller Return on Investment. Bestehende Prozesse werden mit KI schneller, günstiger oder fehlerfreier — die Struktur des Geschäfts bleibt gleich.',
    color: 'border-blue-300 bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  {
    key: 'reshape',
    label: 'Reshape',
    zeitraum: '12–36 Monate',
    titel: 'Grundlegendes Re-Design',
    body: 'Wie das Unternehmen Wert schafft, wird neu gedacht. Prozesse, Rollen und Organisationsstrukturen werden um KI-Fähigkeiten herum umgebaut — nicht nur beschleunigt.',
    color: 'border-amber-300 bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  {
    key: 'invent',
    label: 'Invent',
    zeitraum: '2–5 Jahre',
    titel: 'Neue Angebote & Marktpositionen',
    body: 'Produkte, Services oder Geschäftsmodelle, die ohne KI nicht existieren könnten. Das größte Risiko — und das größte Differenzierungspotenzial.',
    color: 'border-purple-300 bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
] as const

type HorizonKey = typeof HORIZONS[number]['key']

const LS_HORIZON_KEY = 'ai_roadmap_horizons_v1'
function lsLoadHorizons(): Record<string, HorizonKey> {
  try { const r = localStorage.getItem(LS_HORIZON_KEY); return r ? JSON.parse(r) : {} } catch { return {} }
}
function lsSaveHorizons(h: Record<string, HorizonKey>) {
  try { localStorage.setItem(LS_HORIZON_KEY, JSON.stringify(h)) } catch {}
}

function HorizonTool({ useCases, navigate }: { useCases: AIUseCase[]; navigate: (path: string) => void }) {
  const [horizons, setHorizons] = useState<Record<string, HorizonKey>>(() => lsLoadHorizons())

  const relevant = useCases.filter((uc) => uc.status !== 'Cancelled')
  const assign = (id: string, h: HorizonKey) => {
    const next = { ...horizons, [id]: horizons[id] === h ? undefined as unknown as HorizonKey : h }
    if (!next[id]) delete next[id]
    setHorizons(next)
    lsSaveHorizons(next)
  }

  const counts: Record<HorizonKey, number> = { deploy: 0, reshape: 0, invent: 0 }
  let unassigned = 0
  for (const uc of relevant) {
    const h = horizons[uc.id]
    if (h) counts[h]++
    else unassigned++
  }
  const classified = relevant.length - unassigned
  const deployPct = classified > 0 ? Math.round((counts.deploy / classified) * 100) : 0
  const pilotTrap = classified >= 3 && deployPct >= 70

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 rounded-r-xl px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong>Boston Consulting Group · Drei „Horizonte".</strong> Der Quartalsplan sequenziert einzelne Anwendungsfälle — aber er beantwortet nicht die strategische Frage: <strong>Welchen Horizont adressieren wir eigentlich?</strong> Die drei Horizonte laufen parallel, nicht sequenziell. Automators (Reifegrad-Stufen 1–2) werden von Transformers (Stufen 3–4) mittelfristig überholt.
      </div>

      {/* Three horizon cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {HORIZONS.map((h) => (
          <div key={h.key} className={`rounded-xl border-2 ${h.color} p-4 space-y-2`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${h.dot} flex-shrink-0`} />
              <p className={`text-sm font-bold ${h.text}`}>{h.label}</p>
              <span className="text-[11px] text-slate-500 ml-auto font-mono">{h.zeitraum}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">{h.titel}</p>
            <p className="text-xs text-slate-600 leading-relaxed">{h.body}</p>
          </div>
        ))}
      </div>

      {/* Pilot trap warning */}
      <div className="bg-red-50 border-2 border-red-300 rounded-xl px-5 py-4">
        <p className="text-sm font-bold text-red-800">⚠ Die Pilotfalle</p>
        <p className="text-xs text-red-700 mt-1.5 leading-relaxed">
          <strong>74 %</strong> der Unternehmen verbleiben dauerhaft im Deploy-Horizont — und nennen es Strategie. Der Sprung zu Reshape oder Invent ist der schwierigste Schritt — und genau da scheitern die meisten.
        </p>
      </div>

      {/* Portfolio classifier tool */}
      <div className="bg-white rounded-xl border-2 border-slate-800 overflow-hidden">
        <div className="px-5 py-3 bg-slate-800 text-white">
          <p className="text-sm font-bold">🧭 Portfolio-Check · Welchem Horizont ordnest du deine Anwendungsfälle zu?</p>
          <p className="text-xs text-slate-300 mt-0.5">Ordne jeden Anwendungsfall einem Horizont zu — die Verteilung zeigt, ob du in der Pilotfalle steckst.</p>
        </div>

        <div className="p-5 space-y-4">
          {relevant.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Noch keine Anwendungsfälle vorhanden.</p>
          )}

          {relevant.length > 0 && (
            <>
              {/* Distribution bar */}
              {classified > 0 && (
                <div className="space-y-1.5">
                  <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                    {HORIZONS.map((h) => {
                      const pct = (counts[h.key] / classified) * 100
                      if (pct === 0) return null
                      return <div key={h.key} className={h.dot} style={{ width: `${pct}%` }} title={`${h.label}: ${counts[h.key]}`} />
                    })}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    {HORIZONS.map((h) => (
                      <span key={h.key} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className={`w-2 h-2 rounded-full ${h.dot}`} />
                        {h.label} {counts[h.key]} ({classified > 0 ? Math.round((counts[h.key] / classified) * 100) : 0}%)
                      </span>
                    ))}
                    {unassigned > 0 && <span className="text-[11px] text-slate-400">· {unassigned} noch offen</span>}
                  </div>
                </div>
              )}

              {pilotTrap && (
                <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-2.5 text-xs text-red-800">
                  <strong>⚠ Pilotfalle erkannt:</strong> {deployPct}% deiner klassifizierten Anwendungsfälle liegen im Deploy-Horizont. Ohne Initiativen in Reshape oder Invent bleibt das Portfolio Optimierung statt Strategie.
                </div>
              )}
              {!pilotTrap && classified >= 3 && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-xs text-green-800">
                  ✓ Portfolio verteilt sich über mehrere Horizonte — kein einseitiger Fokus auf reine Effizienzgewinne.
                </div>
              )}

              {/* Case list */}
              <div className="space-y-2">
                {relevant.map((uc) => (
                  <div key={uc.id} className="flex items-center gap-3 border border-slate-100 rounded-lg px-3 py-2 bg-slate-50">
                    <p
                      className="text-xs font-medium text-slate-700 flex-1 min-w-0 truncate hover:text-blue-600 cursor-pointer"
                      onClick={() => navigate(`/canvas/${uc.id}`)}
                    >
                      {uc.title}
                    </p>
                    <div className="flex gap-1 flex-shrink-0">
                      {HORIZONS.map((h) => (
                        <button
                          key={h.key}
                          onClick={() => assign(uc.id, h.key)}
                          className={`text-[10px] font-semibold px-2 py-1 rounded-md border transition-colors ${
                            horizons[uc.id] === h.key
                              ? `${h.dot} text-white border-transparent`
                              : `bg-white ${h.text} border-slate-200 hover:border-slate-300`
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RoadmapPage() {
  const { useCases } = useUseCasesStore()
  const { data: strategy } = useStrategyStore()
  const { demoMode } = useDemoStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'plan' | 'horizonte'>('plan')

  // derive default quarterly cap from strategy budget (÷ 5 quarters)
  const defaultCap = strategy ? Math.round(strategy.budgetTotalK / 5) : 500

  const [budgetCapK, setBudgetCapK] = useState(defaultCap)
  const [maxPerQ, setMaxPerQ]       = useState(4)
  const [dropTarget, setDropTarget] = useState<Slot | null>(null)

  const [plan, setPlan] = useState<Plan>(() => lsLoad(demoMode) ?? generate(useCases, defaultCap, 4))

  const dragRef = useRef<{ id: string; from: Slot } | null>(null)

  // Demo/Workspace use different case IDs — reload (or regenerate) the plan whenever
  // the mode switches or the current plan no longer matches the active dataset.
  useEffect(() => {
    const stored = lsLoad(demoMode)
    if (stored && !planIsStale(stored, useCases)) {
      setPlan(stored)
    } else if (useCases.length > 0) {
      const next = generate(useCases, budgetCapK, maxPerQ)
      setPlan(next)
      lsSave(demoMode, next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, useCases])

  // ── helpers ──
  const ucMap = new Map(useCases.map((uc) => [uc.id, uc]))

  const quarterCost   = (slot: Slot) => plan[slot].reduce((s, id) => s + (ucMap.get(id)?.estimatedCostK ?? 0), 0)
  const quarterBenefit = (slot: Slot) => plan[slot].reduce((s, id) => s + (ucMap.get(id)?.expectedBenefitK ?? 0), 0)

  const productionCases = useCases.filter((uc) => uc.status === 'Production')

  // ── generate ──
  const handleGenerate = useCallback(() => {
    const next = generate(useCases, budgetCapK, maxPerQ)
    setPlan(next)
    lsSave(demoMode, next)
  }, [useCases, budgetCapK, maxPerQ, demoMode])

  // ── drag & drop ──
  const handleDragStart = (id: string, from: Slot) => {
    dragRef.current = { id, from }
  }

  const handleDrop = (to: Slot) => {
    const drag = dragRef.current
    if (!drag || drag.from === to) { setDropTarget(null); return }
    const next = { ...plan }
    next[drag.from] = next[drag.from].filter((i) => i !== drag.id)
    next[to] = [...next[to], drag.id]
    setPlan(next)
    lsSave(demoMode, next)
    dragRef.current = null
    setDropTarget(null)
  }

  return (
    <div className="p-6 space-y-5 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Roadmap Generator</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {tab === 'plan'
              ? 'Auto-sequence use cases by priority score within quarterly budget caps. Drag cards to adjust.'
              : 'BCG Drei-Horizonte-Modell — die strategische Ebene über dem Quartalsplan.'}
          </p>
        </div>
        {tab === 'plan' && (
          <button
            onClick={handleGenerate}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Regenerate Plan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {([
          { id: 'plan', label: '📅 Quartalsplan' },
          { id: 'horizonte', label: '🧭 Strategische Horizonte' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'horizonte' && <HorizonTool useCases={useCases} navigate={navigate} />}

      {tab === 'plan' && (
      <>
      {/* Settings bar */}
      <div className="flex items-center gap-6 bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Quarterly budget cap (€k)</label>
          <input
            type="number"
            value={budgetCapK}
            onChange={(e) => setBudgetCapK(Number(e.target.value))}
            className="w-24 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Max cases / quarter</label>
          <div className="flex gap-1">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setMaxPerQ(n)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold border transition-colors ${
                  maxPerQ === n
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400 ml-auto">
          {useCases.filter((uc) => uc.status !== 'Production' && uc.status !== 'Cancelled').length} cases to schedule
          · {productionCases.length} already in production
        </p>
      </div>

      {/* Production strip */}
      {productionCases.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-green-700 mb-2">Already in Production</p>
          <div className="flex flex-wrap gap-2">
            {productionCases.map((uc) => (
              <button
                key={uc.id}
                onClick={() => navigate(`/canvas/${uc.id}`)}
                className="flex items-center gap-1.5 bg-white border border-green-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 hover:border-green-400 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                {uc.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quarter columns + Backlog */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {ALL_SLOTS.map((slot) => {
            const ids = plan[slot]
            const cost    = quarterCost(slot)
            const benefit = quarterBenefit(slot)
            const overBudget = slot !== 'Backlog' && cost > budgetCapK
            const budgetPct = slot !== 'Backlog' ? Math.min(100, Math.round((cost / budgetCapK) * 100)) : 0
            const isBacklog = slot === 'Backlog'

            return (
              <div
                key={slot}
                className={`flex flex-col w-56 rounded-xl border-2 transition-colors ${
                  dropTarget === slot
                    ? 'border-blue-400 bg-blue-50'
                    : isBacklog
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-slate-200 bg-white'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDropTarget(slot) }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={() => handleDrop(slot)}
              >
                {/* Column header */}
                <div className={`p-3 border-b ${isBacklog ? 'border-slate-200' : 'border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-bold ${isBacklog ? 'text-slate-500' : 'text-slate-800'}`}>
                      {slot}
                    </p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isBacklog ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ids.length}
                    </span>
                  </div>

                  {/* Budget bar */}
                  {!isBacklog && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${budgetPct}%` }}
                        />
                      </div>
                      <p className={`text-[10px] ${overBudget ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                        €{cost.toLocaleString()}k / €{budgetCapK.toLocaleString()}k
                        {overBudget && ' — over cap'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 min-h-[200px]">
                  {ids.map((id) => {
                    const uc = ucMap.get(id)
                    if (!uc) return null
                    return (
                      <div
                        key={id}
                        draggable
                        onDragStart={() => handleDragStart(id, slot)}
                        className="bg-white border border-slate-200 rounded-lg p-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm hover:border-blue-300 transition-all select-none"
                      >
                        <p
                          className="text-xs font-semibold text-slate-800 leading-snug mb-1.5 hover:text-blue-600 cursor-pointer"
                          onClick={() => navigate(`/canvas/${uc.id}`)}
                        >
                          {uc.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${DEPT_COLOURS[uc.department] ?? 'bg-slate-100 text-slate-600'}`}>
                            {uc.department}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">€{uc.estimatedCostK}k</span>
                            <span className="text-[10px] font-semibold text-blue-600">{uc.priorityScore.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Column footer */}
                {!isBacklog && ids.length > 0 && (
                  <div className="px-3 py-2 border-t border-slate-100 grid grid-cols-2 gap-1">
                    <div>
                      <p className="text-[10px] text-slate-400">Cost</p>
                      <p className="text-xs font-semibold text-slate-700">€{cost.toLocaleString()}k</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Benefit / yr</p>
                      <p className="text-xs font-semibold text-green-600">€{benefit.toLocaleString()}k</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      </>
      )}
    </div>
  )
}
