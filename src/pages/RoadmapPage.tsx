import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUseCasesStore } from '../store/useCasesStore'
import { useStrategyStore } from '../store/strategyStore'
import { AIUseCase } from '../types'

// ── quarters ──────────────────────────────────────────────────────────────
const QUARTERS = ['Q3 2026', 'Q4 2026', 'Q1 2027', 'Q2 2027', 'Q3 2027'] as const
const ALL_SLOTS = [...QUARTERS, 'Backlog'] as const
type Slot = typeof ALL_SLOTS[number]
type Plan = Record<Slot, string[]>

const LS_KEY = 'ai_roadmap_v1'
function lsLoad(): Plan | null {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null } catch { return null }
}
function lsSave(p: Plan) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)) } catch {}
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

export default function RoadmapPage() {
  const { useCases } = useUseCasesStore()
  const { data: strategy } = useStrategyStore()
  const navigate = useNavigate()

  // derive default quarterly cap from strategy budget (÷ 5 quarters)
  const defaultCap = strategy ? Math.round(strategy.budgetTotalK / 5) : 500

  const [budgetCapK, setBudgetCapK] = useState(defaultCap)
  const [maxPerQ, setMaxPerQ]       = useState(4)
  const [dropTarget, setDropTarget] = useState<Slot | null>(null)

  const [plan, setPlan] = useState<Plan>(() => lsLoad() ?? generate(useCases, defaultCap, 4))

  const dragRef = useRef<{ id: string; from: Slot } | null>(null)

  // ── helpers ──
  const ucMap = new Map(useCases.map((uc) => [uc.id, uc]))

  const quarterCost   = (slot: Slot) => plan[slot].reduce((s, id) => s + (ucMap.get(id)?.estimatedCostK ?? 0), 0)
  const quarterBenefit = (slot: Slot) => plan[slot].reduce((s, id) => s + (ucMap.get(id)?.expectedBenefitK ?? 0), 0)

  const productionCases = useCases.filter((uc) => uc.status === 'Production')

  // ── generate ──
  const handleGenerate = useCallback(() => {
    const next = generate(useCases, budgetCapK, maxPerQ)
    setPlan(next)
    lsSave(next)
  }, [useCases, budgetCapK, maxPerQ])

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
    lsSave(next)
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
            Auto-sequence use cases by priority score within quarterly budget caps. Drag cards to adjust.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Regenerate Plan
        </button>
      </div>

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
    </div>
  )
}
