import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRiskStore } from '../store/riskStore'
import { useUseCasesStore } from '../store/useCasesStore'
import { useAuthStore } from '../store/authStore'
import {
  AIRisk, AIUseCase, RiskCategory, MitigationStatus,
  RISK_CATEGORIES, MITIGATION_STATUSES, MITIGATION_BG,
} from '../types'
import { nanoid } from 'nanoid'

type Tab = 'register' | 'heatmap'

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'

function riskScore(l: number, i: number) { return l * i }

function scoreBadge(score: number) {
  if (score >= 15) return 'bg-red-100 text-red-700'
  if (score >= 10) return 'bg-orange-100 text-orange-700'
  if (score >= 5)  return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

function scoreLabel(score: number) {
  if (score >= 15) return 'Critical'
  if (score >= 10) return 'High'
  if (score >= 5)  return 'Medium'
  return 'Low'
}

function cellColor(score: number) {
  if (score >= 15) return 'bg-red-400 text-white'
  if (score >= 10) return 'bg-orange-300 text-slate-800'
  if (score >= 5)  return 'bg-amber-200 text-slate-800'
  return 'bg-green-100 text-slate-600'
}

const CATEGORY_ICONS: Record<RiskCategory, string> = {
  'Bias & Fairness':      '⚖️',
  'Data Quality':         '🗄️',
  'Model Performance':    '📉',
  'Security & Privacy':   '🔒',
  'Regulatory & Legal':   '📋',
  'Operational':          '⚙️',
  'Vendor & Technology':  '🔌',
  'Transparency':         '🔍',
}

const BLANK_RISK: Omit<AIRisk, 'id'> = {
  useCaseId: '',
  useCaseTitle: '',
  category: 'Operational',
  title: '',
  description: '',
  likelihood: 3,
  impact: 3,
  mitigation: '',
  mitigationStatus: 'None',
  owner: '',
  residualLikelihood: 2,
  residualImpact: 2,
}

export default function RiskPage() {
  const { risks, init, add, update, remove } = useRiskStore()
  useEffect(() => { init() }, [init])
  const { useCases } = useUseCasesStore()
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('register')
  const [showForm, setShowForm] = useState(false)

  const criticalCount    = risks.filter((r) => riskScore(r.likelihood, r.impact) >= 15).length
  const noMitigCount     = risks.filter((r) => r.mitigationStatus === 'None').length
  const implementedCount = risks.filter((r) => r.mitigationStatus === 'Implemented').length
  const residualHigh     = risks.filter((r) => riskScore(r.residualLikelihood, r.residualImpact) >= 10).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Risk Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">Risk register · Heat map · Mitigation tracking</p>
        </div>
        {user && tab === 'register' && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {showForm ? '✕ Cancel' : '+ Add Risk'}
          </button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Risks"      value={String(risks.length)}       sub="identified"          color="text-slate-700" />
        <KpiCard label="Critical"         value={String(criticalCount)}       sub="score ≥ 15"          color="text-red-600"   />
        <KpiCard label="No Mitigation"    value={String(noMitigCount)}        sub="action needed"       color="text-amber-600" />
        <KpiCard label="Residual High"    value={String(residualHigh)}        sub="after controls"      color="text-orange-600"/>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {([['register', 'Risk Register'], ['heatmap', 'Heat Map']] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && tab === 'register' && (
        <AddRiskForm
          useCases={useCases}
          onSave={(r) => { add(r); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {tab === 'register' && <RegisterTab risks={risks} useCases={useCases} user={!!user} onUpdate={update} onDelete={remove} />}
      {tab === 'heatmap'  && <HeatMapTab  risks={risks} />}
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-0.5 ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

// ─── Register tab ─────────────────────────────────────────────────────────────
function RegisterTab({ risks, useCases, user, onUpdate, onDelete }: {
  risks: AIRisk[]
  useCases: AIUseCase[]
  user: boolean
  onUpdate: (r: AIRisk) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [ucFilter, setUcFilter]  = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [sevFilter, setSevFilter] = useState('')

  const ucTitles = useMemo(() => {
    const set = new Set(risks.map((r) => r.useCaseTitle))
    return Array.from(set).sort()
  }, [risks])

  const filtered = useMemo(() => risks.filter((r) => {
    if (ucFilter  && r.useCaseTitle !== ucFilter) return false
    if (catFilter && r.category !== catFilter)    return false
    if (sevFilter) {
      const s = riskScore(r.likelihood, r.impact)
      if (sevFilter === 'Critical' && s < 15)  return false
      if (sevFilter === 'High'     && (s < 10 || s >= 15)) return false
      if (sevFilter === 'Medium'   && (s < 5  || s >= 10)) return false
      if (sevFilter === 'Low'      && s >= 5)  return false
    }
    return true
  }).sort((a, b) => riskScore(b.likelihood, b.impact) - riskScore(a.likelihood, a.impact)), [risks, ucFilter, catFilter, sevFilter])

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={ucFilter}  onChange={(e) => setUcFilter(e.target.value)}  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All use cases</option>
          {ucTitles.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All categories</option>
          {RISK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={sevFilter} onChange={(e) => setSevFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All severities</option>
          {['Critical', 'High', 'Medium', 'Low'].map((s) => <option key={s}>{s}</option>)}
        </select>
        {(ucFilter || catFilter || sevFilter) && (
          <button onClick={() => { setUcFilter(''); setCatFilter(''); setSevFilter('') }} className="text-xs text-slate-400 hover:text-slate-600 px-2">
            Clear filters
          </button>
        )}
        <span className="text-xs text-slate-400 self-center ml-auto">{filtered.length} of {risks.length} risks</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-semibold">Risk</th>
              <th className="text-left px-4 py-3 font-semibold">Use Case</th>
              <th className="text-left px-4 py-3 font-semibold">Category</th>
              <th className="text-center px-4 py-3 font-semibold">Score</th>
              <th className="text-center px-4 py-3 font-semibold">Residual</th>
              <th className="text-left px-4 py-3 font-semibold">Mitigation</th>
              <th className="text-left px-4 py-3 font-semibold">Owner</th>
              <th className="px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((r) => {
              const score = riskScore(r.likelihood, r.impact)
              const residual = riskScore(r.residualLikelihood, r.residualImpact)
              const isOpen = expanded === r.id
              return (
                <>
                  <tr
                    key={r.id}
                    className={`cursor-pointer hover:bg-slate-50 transition-colors ${isOpen ? 'bg-blue-50' : ''}`}
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${scoreBadge(score)}`}>
                          {scoreLabel(score)}
                        </span>
                        <span className="font-medium text-slate-800 text-sm">{r.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{r.useCaseTitle}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">{CATEGORY_ICONS[r.category]} {r.category}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBadge(score)}`}>
                        {score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBadge(residual)}`}>
                        {residual}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${MITIGATION_BG[r.mitigationStatus]}`}>
                        {r.mitigationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.owner || '—'}</td>
                    <td className="px-2 py-3 text-slate-300">
                      <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${r.id}-detail`} className="bg-blue-50">
                      <td colSpan={8} className="px-6 pb-4 pt-2">
                        <ExpandedRow risk={r} user={user} onUpdate={onUpdate} onDelete={onDelete} />
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No risks match the current filters.</div>
        )}
      </div>
    </div>
  )
}

// ─── Expanded row ─────────────────────────────────────────────────────────────
function ExpandedRow({ risk, user, onUpdate, onDelete }: {
  risk: AIRisk
  user: boolean
  onUpdate: (r: AIRisk) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(risk)
  const upd = (p: Partial<AIRisk>) => setLocal((prev) => ({ ...prev, ...p }))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</p>
          <p className="text-sm text-slate-700 leading-relaxed">{risk.description}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Mitigation Plan</p>
          {editing ? (
            <textarea
              rows={3}
              value={local.mitigation}
              onChange={(e) => upd({ mitigation: e.target.value })}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            />
          ) : (
            <p className="text-sm text-slate-700 leading-relaxed">{risk.mitigation || '—'}</p>
          )}
        </div>
      </div>

      {editing && (
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Mitigation Status</label>
            <select value={local.mitigationStatus} onChange={(e) => upd({ mitigationStatus: e.target.value as MitigationStatus })} className={inputCls}>
              {MITIGATION_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Owner</label>
            <input value={local.owner} onChange={(e) => upd({ owner: e.target.value })} className={inputCls} placeholder="Name or role" />
          </div>
          <div>
            <label className={labelCls}>Residual Likelihood (1–5)</label>
            <input type="number" min={1} max={5} value={local.residualLikelihood} onChange={(e) => upd({ residualLikelihood: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Residual Impact (1–5)</label>
            <input type="number" min={1} max={5} value={local.residualImpact} onChange={(e) => upd({ residualImpact: Number(e.target.value) })} className={inputCls} />
          </div>
        </div>
      )}

      {user && (
        <div className="flex items-center gap-2 pt-1">
          {editing ? (
            <>
              <button
                onClick={() => { onUpdate(local); setEditing(false) }}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                Save changes
              </button>
              <button onClick={() => { setLocal(risk); setEditing(false) }} className="text-xs text-slate-500 hover:text-slate-700 px-2">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                Edit
              </button>
              <button onClick={() => { if (confirm('Delete this risk?')) onDelete(risk.id) }} className="text-xs text-red-500 hover:text-red-700 font-semibold px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors">
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Add risk form ────────────────────────────────────────────────────────────
function AddRiskForm({ useCases, onSave, onCancel }: {
  useCases: AIUseCase[]
  onSave: (r: Omit<AIRisk, 'id'>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<Omit<AIRisk, 'id'>>(BLANK_RISK)
  const upd = (p: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...p }))

  const handleUc = (id: string) => {
    const uc = useCases.find((u) => u.id === id)
    upd({ useCaseId: id, useCaseTitle: uc?.title ?? id })
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-5 space-y-4 border-2 border-blue-200">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">New Risk</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>Risk Title</label>
          <input value={form.title} onChange={(e) => upd({ title: e.target.value })} placeholder="Short descriptive title" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Use Case</label>
          <select value={form.useCaseId} onChange={(e) => handleUc(e.target.value)} className={inputCls}>
            <option value="">— Select or Portfolio-wide —</option>
            <option value="portfolio">Portfolio-wide</option>
            {useCases.map((uc) => <option key={uc.id} value={uc.id}>{uc.title}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <select value={form.category} onChange={(e) => upd({ category: e.target.value as RiskCategory })} className={inputCls}>
            {RISK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Description</label>
          <textarea rows={2} value={form.description} onChange={(e) => upd({ description: e.target.value })} placeholder="What could go wrong and why does it matter?" className={`${inputCls} resize-none`} />
        </div>
        <div>
          <label className={labelCls}>Likelihood (1–5)</label>
          <input type="number" min={1} max={5} value={form.likelihood} onChange={(e) => upd({ likelihood: Number(e.target.value) })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Impact (1–5)</label>
          <input type="number" min={1} max={5} value={form.impact} onChange={(e) => upd({ impact: Number(e.target.value) })} className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Mitigation Plan</label>
          <textarea rows={2} value={form.mitigation} onChange={(e) => upd({ mitigation: e.target.value })} placeholder="What controls or actions reduce this risk?" className={`${inputCls} resize-none`} />
        </div>
        <div>
          <label className={labelCls}>Mitigation Status</label>
          <select value={form.mitigationStatus} onChange={(e) => upd({ mitigationStatus: e.target.value as MitigationStatus })} className={inputCls}>
            {MITIGATION_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Owner</label>
          <input value={form.owner} onChange={(e) => upd({ owner: e.target.value })} placeholder="Name or role" className={inputCls} />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => form.title && onSave(form)}
          disabled={!form.title}
          className="text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Add Risk
        </button>
        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Heat Map tab ─────────────────────────────────────────────────────────────
function HeatMapTab({ risks }: { risks: AIRisk[] }) {
  const [showResidual, setShowResidual] = useState(false)
  const [selected, setSelected] = useState<{ l: number; i: number } | null>(null)

  const risksInCell = (l: number, i: number) =>
    risks.filter((r) => {
      const rl = showResidual ? r.residualLikelihood : r.likelihood
      const ri = showResidual ? r.residualImpact : r.impact
      return rl === l && ri === i
    })

  const selectedRisks = selected ? risksInCell(selected.l, selected.i) : []

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Risk Heat Map</h3>
            <p className="text-xs text-slate-400 mt-0.5">Likelihood × Impact — click any cell to see the risks inside.</p>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button onClick={() => setShowResidual(false)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${!showResidual ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Initial</button>
            <button onClick={() => setShowResidual(true)}  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${showResidual  ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Residual</button>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          {/* Y-axis label */}
          <div className="flex flex-col items-center justify-center h-[300px] w-6 flex-shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              Likelihood
            </span>
          </div>

          <div className="flex-1">
            {/* Grid */}
            {[5, 4, 3, 2, 1].map((l) => (
              <div key={l} className="flex items-center gap-1 mb-1">
                <span className="w-4 text-[10px] text-slate-400 text-right flex-shrink-0">{l}</span>
                {[1, 2, 3, 4, 5].map((i) => {
                  const count = risksInCell(l, i).length
                  const score = l * i
                  const isSelected = selected?.l === l && selected?.i === i
                  return (
                    <div
                      key={i}
                      onClick={() => setSelected(isSelected ? null : { l, i })}
                      className={`flex-1 h-14 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all border-2 ${
                        cellColor(score)
                      } ${isSelected ? 'border-blue-600 shadow-md scale-105' : 'border-transparent hover:border-slate-300'}`}
                    >
                      {count > 0 && (
                        <>
                          <span className="text-xl font-bold leading-none">{count}</span>
                          <span className="text-[9px] font-medium opacity-70 mt-0.5">{scoreLabel(score)}</span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}

            {/* X-axis labels */}
            <div className="flex items-center gap-1 mt-1">
              <span className="w-4 flex-shrink-0" />
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="flex-1 text-center text-[10px] text-slate-400">{i}</span>
              ))}
            </div>
            <p className="text-center text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Impact</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
          {[
            { label: 'Low (1–4)',     cls: 'bg-green-100 text-slate-600'  },
            { label: 'Medium (5–9)', cls: 'bg-amber-200 text-slate-800'  },
            { label: 'High (10–14)', cls: 'bg-orange-300 text-slate-800' },
            { label: 'Critical (15–25)', cls: 'bg-red-400 text-white'    },
          ].map((l) => (
            <div key={l.label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${l.cls}`}>
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Selected cell risks */}
      {selected && selectedRisks.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-5">
          <h4 className="text-sm font-bold text-slate-700 mb-3">
            Risks at L{selected.l} × I{selected.i} (score {selected.l * selected.i})
          </h4>
          <div className="space-y-2">
            {selectedRisks.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.useCaseTitle} · {r.category}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${MITIGATION_BG[r.mitigationStatus]}`}>
                  {r.mitigationStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
