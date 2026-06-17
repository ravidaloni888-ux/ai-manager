import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGovernanceStore } from '../store/governanceStore'
import { useUseCasesStore } from '../store/useCasesStore'
import { useAuthStore } from '../store/authStore'
import { GovernanceData, AIUseCase, EU_AI_ACT_BG, EuAiActRisk } from '../types'

type Tab = 'steps' | 'richtlinie' | 'roles' | 'checklist'

const RICHTLINIE_FIELDS: { key: keyof GovernanceData['richtlinie']; title: string; desc: string }[] = [
  { key: 'zweck',                title: 'Zweck & Einsatzbereich',         desc: 'Wofür und in welchen Bereichen darf KI im Unternehmen eingesetzt werden?' },
  { key: 'daten',                title: 'Daten & Datenschutz',            desc: 'Welche Daten dürfen genutzt werden und wie wird deren Schutz sichergestellt?' },
  { key: 'transparenz',          title: 'Transparenz & Nachvollziehbarkeit', desc: 'Wie werden KI-Entscheidungen erklärbar und überprüfbar gemacht?' },
  { key: 'verantwortlichkeiten', title: 'Verantwortlichkeiten & Governance', desc: 'Wer trägt die Verantwortung für Entwicklung, Einsatz und Kontrolle der KI?' },
  { key: 'risikomanagement',     title: 'Risikomanagement & Compliance',  desc: 'Welche Risiken bestehen und wie werden gesetzliche Vorgaben eingehalten?' },
  { key: 'ethik',                title: 'Ethik & Fairness',               desc: 'Wie wird sichergestellt, dass KI diskriminierungsfrei und verantwortungsvoll handelt?' },
  { key: 'schulung',             title: 'Schulung & Awareness',           desc: 'Wie werden Mitarbeitende im sicheren und sinnvollen Umgang mit KI befähigt?' },
]

const ROLES: { key: keyof GovernanceData['roles']; title: string; desc: string; icon: string }[] = [
  { key: 'aiOwner',  title: 'AI Owner',                    desc: 'Gesamtverantwortung für KI-Strategie und -Einsatz',           icon: '🎯' },
  { key: 'dpo',      title: 'Datenschutzbeauftragter (DSB)', desc: 'DSGVO-Compliance, DSFA, personenbezogene Daten',           icon: '🔒' },
  { key: 'security', title: 'IT Security',                  desc: 'Cybersicherheit, Zugriffskontrollen, Angriffssicherheit',   icon: '🛡️' },
  { key: 'ethics',   title: 'Ethics & Bias Reviewer',       desc: 'Anti-Bias-Prüfung, Fairness, Diskriminierungsfreiheit',    icon: '⚖️' },
  { key: 'business', title: 'Business Approval',            desc: 'Fachliche Freigabe vor Produktiveinsatz',                   icon: '✅' },
]

const STEPS: { n: number; key: keyof GovernanceData['steps']; title: string; desc: string }[] = [
  { n: 1, key: 'step1', title: 'Ziele und Use Cases definieren',       desc: 'Welche konkreten Geschäftsprobleme soll KI lösen?' },
  { n: 2, key: 'step2', title: 'KI-Richtlinie formulieren',            desc: 'Zweck, Daten, Transparenz, Governance, Risiko, Ethik, Schulung' },
  { n: 3, key: 'step3', title: 'Datenschutz & Rechtsvorschriften',     desc: 'DSGVO, EU AI Act, gesetzliche Grundlagen prüfen und dokumentieren' },
  { n: 4, key: 'step4', title: 'Mitarbeitende schulen',                desc: 'KI-Kompetenz aufbauen, Awareness-Programm etablieren' },
  { n: 5, key: 'step5', title: 'Maßnahmen zur Sicherheit umsetzen',   desc: 'Cybersicherheit, Zugriffskontrollen, Monitoring einrichten' },
  { n: 6, key: 'step6', title: 'Risikomanagementsystem erweitern',    desc: 'KI-spezifische Risiken in bestehendes System integrieren' },
  { n: 7, key: 'step7', title: 'Verantwortliche benennen',             desc: 'AI Owner, DSB, Security, Ethics, Business Sign-off definieren' },
  { n: 8, key: 'step8', title: 'Pilotphase nutzen',                    desc: 'Use Cases schrittweise einführen, Learnings dokumentieren' },
  { n: 9, key: 'step9', title: 'Dokumentation der Punkte 1–8',        desc: 'Audit-Trail erstellen, Nachweispflichten erfüllen' },
]

const COMPLIANCE_COLS: { key: keyof AIUseCase; short: string; title: string }[] = [
  { key: 'complianceLegal',         short: 'Rechtlich', title: 'Einhaltung gesetzlicher Vorgaben (DSGVO, EU AI Act)' },
  { key: 'compliancePersonalData',  short: 'Pers. Daten', title: 'Personenbezogene Daten & Rechtsgrundlage dokumentiert' },
  { key: 'complianceDataMin',       short: 'Datenmin.', title: 'Datenminimierung & Zweckbindung sichergestellt' },
  { key: 'complianceDocumentation', short: 'Doku.', title: 'Dokumentation & Nachweispflichten erfüllt' },
  { key: 'complianceLiability',     short: 'Haftung', title: 'Haftung & Verantwortlichkeit geregelt' },
]

const DEFAULT: GovernanceData = {
  richtlinie: { zweck: '', daten: '', transparenz: '', verantwortlichkeiten: '', risikomanagement: '', ethik: '', schulung: '' },
  roles: { aiOwner: '', dpo: '', security: '', ethics: '', business: '' },
  steps: { step1: false, step2: false, step3: false, step4: false, step5: false, step6: false, step7: false, step8: false, step9: false },
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400'
const textareaCls = `${inputCls} resize-none`

export default function GovernancePage() {
  const [tab, setTab] = useState<Tab>('steps')
  const { data, loading, saving, init, save } = useGovernanceStore()
  const { useCases } = useUseCasesStore()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [local, setLocal] = useState<GovernanceData>(DEFAULT)
  const [saved, setSaved] = useState(false)

  useEffect(() => { init() }, [init])
  useEffect(() => { if (data) setLocal(data) }, [data])

  const stepsCount   = Object.values(local.steps).filter(Boolean).length
  const richtCount   = Object.values(local.richtlinie).filter((v) => v.trim().length > 0).length
  const rolesCount   = Object.values(local.roles).filter((v) => v.trim().length > 0).length

  const handleSave = async () => {
    await save(local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const TABS: { id: Tab; label: string; badge: string }[] = [
    { id: 'steps',     label: '9-Schritte Planung', badge: `${stepsCount}/9`   },
    { id: 'richtlinie',label: 'KI-Richtlinie',      badge: `${richtCount}/7`   },
    { id: 'roles',     label: 'Verantwortliche',     badge: `${rolesCount}/5`   },
    { id: 'checklist', label: 'Datenschutz-Checkliste', badge: `${useCases.length}` },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Governance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Strategische Planung · KI-Richtlinie · Datenschutz — K7.0069</p>
        </div>
        {user && (
          <button
            onClick={handleSave}
            disabled={saving || tab === 'checklist'}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors min-w-[90px]"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
          </button>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Planung abgeschlossen" value={`${stepsCount} / 9`}   pct={stepsCount / 9}   color="blue"   />
        <KpiCard label="KI-Richtlinie befüllt" value={`${richtCount} / 7`}   pct={richtCount / 7}   color="violet" />
        <KpiCard label="Rollen besetzt"         value={`${rolesCount} / 5`}   pct={rolesCount / 5}   color="emerald"/>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              tab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
            }`}>{t.badge}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'steps' && (
        <StepsTab
          steps={local.steps}
          onChange={(steps) => setLocal((p) => ({ ...p, steps }))}
          readonly={!user}
        />
      )}
      {tab === 'richtlinie' && (
        <RichtlinieTab
          richtlinie={local.richtlinie}
          onChange={(richtlinie) => setLocal((p) => ({ ...p, richtlinie }))}
          readonly={!user}
        />
      )}
      {tab === 'roles' && (
        <RolesTab
          roles={local.roles}
          onChange={(roles) => setLocal((p) => ({ ...p, roles }))}
          readonly={!user}
        />
      )}
      {tab === 'checklist' && (
        <ChecklistTab useCases={useCases} navigate={navigate} />
      )}
    </div>
  )
}

// ─── KPI card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  const bar: Record<string, string> = {
    blue: 'bg-blue-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500',
  }
  const text: Record<string, string> = {
    blue: 'text-blue-700', violet: 'text-violet-700', emerald: 'text-emerald-700',
  }
  return (
    <div className="bg-white rounded-xl shadow-md p-4 space-y-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${text[color]}`}>{value}</p>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${bar[color]}`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
      </div>
    </div>
  )
}

// ─── Steps tab ───────────────────────────────────────────────────────────────
function StepsTab({ steps, onChange, readonly }: {
  steps: GovernanceData['steps']
  onChange: (s: GovernanceData['steps']) => void
  readonly: boolean
}) {
  const done = Object.values(steps).filter(Boolean).length
  const pct = Math.round((done / 9) * 100)
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Strategische Planung des Einsatzes</h3>
          <span className="text-sm font-bold text-blue-700">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="space-y-3">
          {STEPS.map((s) => {
            const checked = steps[s.key]
            return (
              <label
                key={s.key}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  checked ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                } ${readonly ? 'cursor-default' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={readonly}
                  onChange={(e) => onChange({ ...steps, [s.key]: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-blue-600 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      checked ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>{s.n}</span>
                    <span className={`text-sm font-medium ${checked ? 'text-blue-800' : 'text-slate-700'}`}>{s.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 ml-7">{s.desc}</p>
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Richtlinie tab ──────────────────────────────────────────────────────────
function RichtlinieTab({ richtlinie, onChange, readonly }: {
  richtlinie: GovernanceData['richtlinie']
  onChange: (r: GovernanceData['richtlinie']) => void
  readonly: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {RICHTLINIE_FIELDS.map((f, i) => (
        <div key={f.key} className="bg-white rounded-xl shadow-md p-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-700">{f.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
            </div>
          </div>
          <textarea
            rows={3}
            disabled={readonly}
            value={richtlinie[f.key]}
            onChange={(e) => onChange({ ...richtlinie, [f.key]: e.target.value })}
            placeholder={readonly ? '—' : 'Antwort eingeben…'}
            className={textareaCls}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Roles tab ───────────────────────────────────────────────────────────────
function RolesTab({ roles, onChange, readonly }: {
  roles: GovernanceData['roles']
  onChange: (r: GovernanceData['roles']) => void
  readonly: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {ROLES.map((r) => {
        const filled = roles[r.key].trim().length > 0
        return (
          <div key={r.key} className={`bg-white rounded-xl shadow-md p-4 space-y-3 border-l-4 ${filled ? 'border-emerald-400' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{r.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">{r.title}</p>
                <p className="text-xs text-slate-400">{r.desc}</p>
              </div>
            </div>
            <input
              type="text"
              disabled={readonly}
              value={roles[r.key]}
              onChange={(e) => onChange({ ...roles, [r.key]: e.target.value })}
              placeholder={readonly ? 'Not assigned' : 'Name eingeben…'}
              className={inputCls}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Checklist tab ───────────────────────────────────────────────────────────
function ChecklistTab({ useCases, navigate }: { useCases: AIUseCase[]; navigate: ReturnType<typeof useNavigate> }) {
  const complianceScore = (uc: AIUseCase) => {
    return [uc.complianceLegal, uc.compliancePersonalData, uc.complianceDataMin, uc.complianceDocumentation, uc.complianceLiability]
      .filter(Boolean).length
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <p className="text-sm text-slate-500">
          Click a use case to open its canvas and fill in the compliance checklist.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Use Case</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">EU AI Act</th>
              {COMPLIANCE_COLS.map((c) => (
                <th key={c.key as string} title={c.title} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  {c.short}
                </th>
              ))}
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {useCases.map((uc) => {
              const score = complianceScore(uc)
              const risk = (uc.euAiActRisk ?? 'Minimal Risk') as EuAiActRisk
              return (
                <tr
                  key={uc.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/canvas/${uc.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-blue-600 hover:underline max-w-[200px] truncate">{uc.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EU_AI_ACT_BG[risk]}`}>
                      {risk}
                    </span>
                  </td>
                  {COMPLIANCE_COLS.map((c) => {
                    const val = uc[c.key as keyof AIUseCase] as boolean
                    return (
                      <td key={c.key as string} className="px-3 py-3 text-center">
                        {val
                          ? <span className="text-emerald-500 text-base">✓</span>
                          : <span className="text-slate-300 text-base">○</span>
                        }
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      score === 5 ? 'bg-emerald-100 text-emerald-700'
                      : score >= 3 ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-600'
                    }`}>{score}/5</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
