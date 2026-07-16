import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRiskStore } from '../store/riskStore'
import { useUseCasesStore } from '../store/useCasesStore'
import { useAuthStore } from '../store/authStore'
import {
  AIRisk, AIUseCase, RiskCategory, MitigationStatus,
  RISK_CATEGORIES, MITIGATION_STATUSES, MITIGATION_BG, EU_AI_ACT_BG, EuAiActRisk,
} from '../types'
import { nanoid } from 'nanoid'
import { getDemoMode, useDemoStore } from '../store/demoStore'

type Tab = 'register' | 'heatmap' | 'bae'

// ─── B×A×E types & data ───────────────────────────────────────────────────────
type RisikoArt = 'Bias' | 'Technischer Fehler' | 'Ethisches Risiko' | 'Sicherheitsrisiko'
type RpzStatus = 'low' | 'medium' | 'high'
interface RisikoEntry { id: string; beschreibung: string; art: RisikoArt; b: number; a: number; e: number; auto?: boolean }

const RPZ_STATUS = (rpz: number): RpzStatus => rpz < 50 ? 'low' : rpz <= 125 ? 'medium' : 'high'

const RISIKOART_CFG: Record<RisikoArt, { cls: string; dot: string }> = {
  'Bias':               { cls: 'bg-amber-100 text-amber-700 border-amber-300',    dot: 'bg-amber-400'  },
  'Technischer Fehler': { cls: 'bg-blue-100 text-blue-700 border-blue-300',       dot: 'bg-blue-400'   },
  'Ethisches Risiko':   { cls: 'bg-violet-100 text-violet-700 border-violet-300', dot: 'bg-violet-400' },
  'Sicherheitsrisiko':  { cls: 'bg-red-100 text-red-700 border-red-300',          dot: 'bg-red-400'    },
}

const EMPTY_RISIKO: Omit<RisikoEntry, 'id' | 'auto'> = { beschreibung: '', art: 'Bias', b: 5, a: 5, e: 5 }

const NIST_TRIAS = [
  { label: 'Harm to People',       desc: 'Individuum: Rechte, Gesundheit, wirtschaftliche Chancen. Diskriminierung. Demokratische Teilhabe.' },
  { label: 'Harm to Organization', desc: 'Geschäftsbetrieb, Reputation, finanzielle Verluste, Sicherheitsverletzungen, Compliance-Strafen.' },
  { label: 'Harm to Ecosystem',    desc: 'Globales Finanzsystem, Lieferketten, vernetzte Systeme, natürliche Ressourcen, Umwelt.' },
]

function deriveRisiken(uc: AIUseCase): RisikoEntry[] {
  const euRisk = uc.euAiActRisk
  const bBase = euRisk === 'Unacceptable Risk' ? 10 : euRisk === 'High Risk' ? 8 : euRisk === 'Limited Risk' ? 5 : 3
  const risks: RisikoEntry[] = []
  let idx = 0
  const add = (r: Omit<RisikoEntry, 'id' | 'auto'>) => risks.push({ ...r, id: `auto-${uc.id}-${idx++}`, auto: true })

  add({ beschreibung: `KI-Risikoeinstufung "${euRisk ?? 'Minimal Risk'}" nach EU AI Act`, art: 'Ethisches Risiko', b: bBase, a: bBase >= 8 ? 6 : 4, e: bBase >= 8 ? 7 : 4 })
  if (bBase >= 7) {
    add({ beschreibung: 'Automation Bias – Nutzer verlassen sich blind auf KI-Ausgaben', art: 'Ethisches Risiko', b: bBase, a: 6, e: 8 })
    add({ beschreibung: 'Modell-Drift – Leistungsverlust durch veränderte Datenverteilung bleibt unbemerkt', art: 'Technischer Fehler', b: bBase - 1, a: 5, e: 7 })
  }
  if (!uc.complianceLegal)        add({ beschreibung: 'Keine Rechtsgrundlage dokumentiert – Einsatz ohne DSGVO/KI-VO-Grundlage', art: 'Ethisches Risiko', b: 7, a: 6, e: 4 })
  if (!uc.compliancePersonalData) add({ beschreibung: 'Personendaten nicht dokumentiert – fehlende DSGVO Art. 30 Pflicht', art: 'Bias', b: 6, a: 5, e: 5 })
  if (!uc.complianceDataMin)      add({ beschreibung: 'Datensparsamkeit nicht sichergestellt (DSGVO Art. 5)', art: 'Bias', b: 5, a: 6, e: 5 })
  if (!uc.complianceDocumentation)add({ beschreibung: 'Dokumentationspflichten unerfüllt – kein Nachweis für Audit', art: 'Ethisches Risiko', b: 6, a: 7, e: 3 })
  if (!uc.complianceLiability)    add({ beschreibung: 'Verantwortlichkeit nicht definiert – bei Schaden unklar wer haftet', art: 'Sicherheitsrisiko', b: 7, a: 5, e: 4 })
  add({ beschreibung: 'Vendor Lock-in – Ausfall des KI-Anbieters legt Betrieb still', art: 'Sicherheitsrisiko', b: 7, a: 3, e: 4 })
  return risks
}

function RpzBadge({ rpz }: { rpz: number }) {
  const s = RPZ_STATUS(rpz)
  const cls = s === 'high' ? 'bg-red-100 text-red-700 border-red-300' : s === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-green-100 text-green-700 border-green-300'
  return <span className={`text-xs px-2 py-0.5 rounded border font-bold ${cls}`}>RPZ {rpz}</span>
}

function BaeTab({ useCases, isDemo, onAddToRegister }: { useCases: AIUseCase[]; isDemo: boolean; onAddToRegister: (r: Omit<AIRisk, 'id'>) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [customRisiken, setCustomRisiken] = useState<Record<string, RisikoEntry[]>>({})
  const [addingFor, setAddingFor] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<RisikoEntry, 'id' | 'auto'>>(EMPTY_RISIKO)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const handleAddToRegister = (r: RisikoEntry, uc: AIUseCase) => {
    const categoryMap: Record<RisikoArt, RiskCategory> = {
      'Bias':               'Bias & Fairness',
      'Technischer Fehler': 'Model Performance',
      'Ethisches Risiko':   'Regulatory & Legal',
      'Sicherheitsrisiko':  'Security & Privacy',
    }
    onAddToRegister({
      useCaseId: uc.id,
      useCaseTitle: uc.title,
      category: categoryMap[r.art],
      title: r.beschreibung.slice(0, 80),
      description: r.beschreibung,
      b: r.b, a: r.a, e: r.e,
      mitigation: '',
      mitigationStatus: 'None',
      owner: '',
      residualB: Math.max(1, r.b - 2),
      residualA: Math.max(1, r.a - 2),
      residualE: Math.max(1, r.e - 2),
    })
    setAddedIds((prev) => new Set(prev).add(r.id))
  }

  const addCustom = (ucId: string) => {
    if (!form.beschreibung.trim()) return
    setCustomRisiken((p) => ({ ...p, [ucId]: [...(p[ucId] ?? []), { ...form, id: `m-${ucId}-${Date.now()}`, auto: false }] }))
    setForm(EMPTY_RISIKO)
    setAddingFor(null)
  }
  const removeCustom = (ucId: string, id: string) =>
    setCustomRisiken((p) => ({ ...p, [ucId]: (p[ucId] ?? []).filter((r) => r.id !== id) }))

  const ucRisiken = useCases.map((uc) => {
    const derived = deriveRisiken(uc)
    const custom = customRisiken[uc.id] ?? []
    const all = [...derived, ...custom]
    const maxRpz = all.length ? Math.max(...all.map((r) => r.b * r.a * r.e)) : 0
    const highCount = all.filter((r) => RPZ_STATUS(r.b * r.a * r.e) === 'high').length
    return { uc, risks: all, maxRpz, highCount }
  }).sort((a, b) => b.maxRpz - a.maxRpz)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h2 className="text-base font-bold text-slate-800 mb-1">B×A×E Risikoanalyse · alle Use Cases</h2>
        <p className="text-xs text-slate-400 mb-3">Automatisch abgeleitet aus EU AI Act Einstufung + Compliance-Lücken · Methodik: FMEA nach KI-VO Art. 9 / ISO 23894</p>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600 mb-3">
          <span><span className="font-mono font-bold text-slate-800">RPZ = B × A × E</span> = Risiko-Prioritäts-Zahl (1–1000)</span>
          <span><span className="font-mono font-bold">B</span> = Bedeutung/Schadensschwere</span>
          <span><span className="font-mono font-bold">A</span> = Auftreten/Wahrscheinlichkeit</span>
          <span><span className="font-mono font-bold">E</span> = Entdeckung (10 = kaum erkennbar)</span>
        </div>
        <div className="flex gap-2 flex-wrap text-xs">
          <span className="px-2 py-1 rounded bg-green-50 border border-green-200 text-green-700">RPZ &lt; 50 = akzeptabel</span>
          <span className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700">50–125 = prüfen</span>
          <span className="px-2 py-1 rounded bg-red-50 border border-red-200 text-red-700">&gt; 125 = Maßnahmen erforderlich</span>
        </div>
      </div>

      {/* NIST Trias */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">NIST AI RMF · Drei Schadenssphären</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {NIST_TRIAS.map((t) => (
            <div key={t.label} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
              <p className="text-xs font-bold text-blue-700 mb-1">{t.label}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* UC list */}
      {useCases.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-10 text-center text-slate-400">
          <p className="text-sm">Keine Use Cases vorhanden.</p>
          <p className="text-xs mt-1">Lege zuerst Use Cases unter „AI Use Cases" an.</p>
        </div>
      ) : ucRisiken.map(({ uc, risks, maxRpz, highCount }) => {
        const isOpen = expandedId === uc.id
        const status = RPZ_STATUS(maxRpz)
        const borderCls = status === 'high' ? 'border-red-400' : status === 'medium' ? 'border-amber-400' : 'border-green-400'
        const sorted = [...risks].sort((a, b) => (b.b * b.a * b.e) - (a.b * a.a * a.e))
        return (
          <div key={uc.id} className={`bg-white rounded-xl shadow-md border-l-4 ${borderCls} overflow-hidden`}>
            <button className="w-full text-left p-4" onClick={() => setExpandedId(isOpen ? null : uc.id)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">{uc.title}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{uc.department}</span>
                    {uc.euAiActRisk && <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${EU_AI_ACT_BG[uc.euAiActRisk]}`}>{uc.euAiActRisk}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 items-center">
                  <div className="text-center"><RpzBadge rpz={maxRpz} /><p className="text-xs text-slate-400 mt-0.5">max RPZ</p></div>
                  <div className={`text-center px-2 py-1 rounded-lg ${highCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-200'}`}>
                    <p className={`text-base font-bold ${highCount > 0 ? 'text-red-700' : 'text-slate-400'}`}>{highCount}</p>
                    <p className="text-xs text-slate-400">kritisch</p>
                  </div>
                  <span className="text-slate-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-slate-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-2 font-mono text-slate-400 uppercase tracking-wider text-[10px]">Risiko</th>
                        <th className="text-left px-3 py-2 font-mono text-slate-400 uppercase tracking-wider text-[10px]">Art</th>
                        <th className="text-center px-2 py-2 font-mono text-slate-400 text-[10px]">B</th>
                        <th className="text-center px-2 py-2 font-mono text-slate-400 text-[10px]">A</th>
                        <th className="text-center px-2 py-2 font-mono text-slate-400 text-[10px]">E</th>
                        <th className="text-center px-3 py-2 font-mono text-slate-400 text-[10px]">RPZ</th>
                        <th className="px-2 py-2 text-[10px]"></th>
                        {!isDemo && <th className="px-2 py-2 text-[10px]"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sorted.map((r) => {
                        const rpz = r.b * r.a * r.e
                        const s = RPZ_STATUS(rpz)
                        const rpzCls = s === 'high' ? 'text-red-700 font-bold' : s === 'medium' ? 'text-amber-700 font-semibold' : 'text-green-700'
                        return (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 text-slate-700 leading-snug max-w-xs">
                              {r.beschreibung}
                              {r.auto && <span className="ml-1.5 text-[10px] text-slate-400 border border-slate-200 rounded px-1">auto</span>}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${RISIKOART_CFG[r.art].cls}`}>{r.art}</span>
                            </td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-600">{r.b}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-600">{r.a}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-600">{r.e}</td>
                            <td className={`px-3 py-2.5 text-center font-mono ${rpzCls}`}>{r.b}×{r.a}×{r.e}={rpz}</td>
                            <td className="px-2 py-2.5 text-center">
                              {addedIds.has(r.id) ? (
                                <span className="text-[10px] text-green-600 font-semibold">✓ Added</span>
                              ) : (
                                <button
                                  onClick={() => handleAddToRegister(r, uc)}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold whitespace-nowrap px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                >
                                  + Register
                                </button>
                              )}
                            </td>
                            {!isDemo && (
                              <td className="px-2 py-2.5 text-center">
                                {!r.auto && <button onClick={() => removeCustom(uc.id, r.id)} className="text-slate-300 hover:text-red-400 text-xs">✕</button>}
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {!isDemo && (
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                    {addingFor === uc.id ? (
                      <div className="space-y-3">
                        <textarea rows={2} value={form.beschreibung} onChange={(e) => setForm((p) => ({ ...p, beschreibung: e.target.value }))}
                          placeholder="Risikobeschreibung…"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <div className="flex gap-2 flex-wrap items-center">
                          <select value={form.art} onChange={(e) => setForm((p) => ({ ...p, art: e.target.value as RisikoArt }))}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                            {(['Bias', 'Technischer Fehler', 'Ethisches Risiko', 'Sicherheitsrisiko'] as RisikoArt[]).map((a) => <option key={a} value={a}>{a}</option>)}
                          </select>
                          {(['b', 'a', 'e'] as const).map((dim) => (
                            <label key={dim} className="flex items-center gap-1 text-xs text-slate-500">
                              <span className="font-mono font-bold uppercase">{dim}</span>
                              <input type="number" min={1} max={10} value={form[dim]}
                                onChange={(e) => setForm((p) => ({ ...p, [dim]: Number(e.target.value) }))}
                                className="w-12 border border-slate-200 rounded px-1.5 py-1 text-xs text-center bg-white" />
                            </label>
                          ))}
                          <span className="text-xs font-mono"><RpzBadge rpz={form.b * form.a * form.e} /></span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setAddingFor(null); setForm(EMPTY_RISIKO) }} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500">Abbrechen</button>
                          <button onClick={() => addCustom(uc.id)} disabled={!form.beschreibung.trim()} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium">Speichern</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingFor(uc.id); setForm(EMPTY_RISIKO) }} className="text-xs text-blue-600 hover:underline">+ Risiko manuell hinzufügen</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'

function rpz(b: number, a: number, e: number) { return (b || 5) * (a || 5) * (e || 5) }

function scoreBadge(rpzVal: number) {
  if (rpzVal >= 400) return 'bg-red-100 text-red-700'
  if (rpzVal >= 125) return 'bg-orange-100 text-orange-700'
  if (rpzVal >= 50)  return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

function scoreLabel(rpzVal: number) {
  if (rpzVal >= 400) return 'Critical'
  if (rpzVal >= 125) return 'High'
  if (rpzVal >= 50)  return 'Medium'
  return 'Low'
}

function cellColor(rpzVal: number) {
  if (rpzVal >= 400) return 'bg-red-400 text-white'
  if (rpzVal >= 125) return 'bg-orange-300 text-slate-800'
  if (rpzVal >= 50)  return 'bg-amber-200 text-slate-800'
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
  b: 5, a: 5, e: 5,
  mitigation: '',
  mitigationStatus: 'None',
  owner: '',
  residualB: 3, residualA: 3, residualE: 3,
}

export default function RiskPage() {
  const { risks, init, add, update, remove } = useRiskStore()
  useEffect(() => { init() }, [init])
  const { useCases, init: initUseCases } = useUseCasesStore()
  const user = useAuthStore((s) => s.user)
  const demoMode = useDemoStore((s) => s.demoMode)
  useEffect(() => { initUseCases() }, [initUseCases, demoMode])
  const [tab, setTab] = useState<Tab>('register')
  const [showForm, setShowForm] = useState(false)

  const criticalCount    = risks.filter((r) => rpz(r.b, r.a, r.e) >= 400).length
  const noMitigCount     = risks.filter((r) => r.mitigationStatus === 'None').length
  const implementedCount = risks.filter((r) => r.mitigationStatus === 'Implemented').length
  const residualHigh     = risks.filter((r) => rpz(r.residualB, r.residualA, r.residualE) >= 125).length

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
        {([['register', 'Risk Register'], ['heatmap', 'Heat Map'], ['bae', 'B×A×E Analyse']] as [Tab, string][]).map(([id, label]) => (
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
      {tab === 'bae'      && <BaeTab useCases={useCases} isDemo={demoMode} onAddToRegister={(r) => { add(r); setTab('register') }} />}
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
      const s = rpz(r.b, r.a, r.e)
      if (sevFilter === 'Critical' && s < 400)         return false
      if (sevFilter === 'High'     && (s < 125 || s >= 400)) return false
      if (sevFilter === 'Medium'   && (s < 50  || s >= 125)) return false
      if (sevFilter === 'Low'      && s >= 50)         return false
    }
    return true
  }).sort((a, b) => rpz(b.b, b.a, b.e) - rpz(a.b, a.a, a.e)), [risks, ucFilter, catFilter, sevFilter])

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
              const score = rpz(r.b, r.a, r.e)
              const residual = rpz(r.residualB, r.residualA, r.residualE)
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
            <label className={labelCls}>Residual B – Bedeutung nach Maßnahme (1–10)</label>
            <input type="number" min={1} max={10} value={local.residualB} onChange={(e) => upd({ residualB: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Residual A – Auftreten nach Maßnahme (1–10)</label>
            <input type="number" min={1} max={10} value={local.residualA} onChange={(e) => upd({ residualA: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Residual E – Entdeckung nach Maßnahme (1–10)</label>
            <input type="number" min={1} max={10} value={local.residualE} onChange={(e) => upd({ residualE: Number(e.target.value) })} className={inputCls} />
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
          <label className={labelCls}>B – Bedeutung / Severity (1–10)</label>
          <input type="number" min={1} max={10} value={form.b} onChange={(e) => upd({ b: Number(e.target.value) })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>A – Auftreten / Occurrence (1–10)</label>
          <input type="number" min={1} max={10} value={form.a} onChange={(e) => upd({ a: Number(e.target.value) })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>E – Entdeckung / Detection (1–10)</label>
          <input type="number" min={1} max={10} value={form.e} onChange={(e) => upd({ e: Number(e.target.value) })} className={inputCls} />
        </div>
        <div className="col-span-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
          RPZ = B × A × E = <strong>{form.b} × {form.a} × {form.e} = {form.b * form.a * form.e}</strong>
          {' '}— <span className={`font-semibold ${form.b * form.a * form.e >= 400 ? 'text-red-600' : form.b * form.a * form.e >= 125 ? 'text-orange-600' : form.b * form.a * form.e >= 50 ? 'text-amber-600' : 'text-green-600'}`}>{scoreLabel(form.b * form.a * form.e)}</span>
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

// ─── Heat Map tab (RPZ buckets) ───────────────────────────────────────────────
const RPZ_BUCKETS = [
  { label: 'Critical',  min: 400, max: 1000, cls: 'bg-red-400 text-white',          border: 'border-red-500'    },
  { label: 'High',      min: 125, max: 399,  cls: 'bg-orange-300 text-slate-800',   border: 'border-orange-400' },
  { label: 'Medium',    min: 50,  max: 124,  cls: 'bg-amber-200 text-slate-800',    border: 'border-amber-300'  },
  { label: 'Low',       min: 1,   max: 49,   cls: 'bg-green-100 text-slate-600',    border: 'border-green-300'  },
]

function HeatMapTab({ risks }: { risks: AIRisk[] }) {
  const [showResidual, setShowResidual] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const getScore = (r: AIRisk) => showResidual
    ? rpz(r.residualB, r.residualA, r.residualE)
    : rpz(r.b, r.a, r.e)

  const bucket = (r: AIRisk) => {
    const s = getScore(r)
    return RPZ_BUCKETS.find((b) => s >= b.min && s <= b.max) ?? RPZ_BUCKETS[3]
  }

  const selectedRisks = selected
    ? risks.filter((r) => bucket(r).label === selected)
    : []

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">RPZ Übersicht</h3>
            <p className="text-xs text-slate-400 mt-0.5">B × A × E = RPZ — klicken Sie auf eine Kategorie für Details.</p>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button onClick={() => setShowResidual(false)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${!showResidual ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Initial</button>
            <button onClick={() => setShowResidual(true)}  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${showResidual  ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Residual</button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {RPZ_BUCKETS.map((b) => {
            const count = risks.filter((r) => bucket(r).label === b.label).length
            const isSelected = selected === b.label
            return (
              <div
                key={b.label}
                onClick={() => setSelected(isSelected ? null : b.label)}
                className={`rounded-xl p-5 cursor-pointer border-2 transition-all ${b.cls} ${isSelected ? `${b.border} shadow-lg scale-105` : 'border-transparent hover:shadow-md'}`}
              >
                <div className="text-3xl font-bold">{count}</div>
                <div className="text-xs font-semibold mt-1 uppercase tracking-wide opacity-80">{b.label}</div>
                <div className="text-[10px] opacity-60 mt-0.5">RPZ {b.min}{b.max < 1000 ? `–${b.max}` : '+'}</div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
          RPZ-Schwellen: &lt;50 akzeptabel · 50–125 prüfen · &gt;125 Maßnahmen erforderlich · ≥400 kritisch
        </div>
      </div>

      {selected && selectedRisks.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-5">
          <h4 className="text-sm font-bold text-slate-700 mb-3">
            {selected} — {selectedRisks.length} Risiken
          </h4>
          <div className="space-y-2">
            {selectedRisks.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.useCaseTitle} · {r.category} · RPZ {getScore(r)}</p>
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
