import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGovernanceStore } from '../store/governanceStore'
import { useUseCasesStore } from '../store/useCasesStore'
import { useAuthStore } from '../store/authStore'
import { GovernanceData, AimsClause, AIUseCase, EU_AI_ACT_BG, EuAiActRisk } from '../types'

type Tab = 'steps' | 'richtlinie' | 'roles' | 'checklist' | 'aims'

const RICHTLINIE_FIELDS: { key: keyof GovernanceData['richtlinie']; title: string; desc: string }[] = [
  { key: 'zweck',                title: 'Purpose & Scope',                desc: 'For what purposes and in which areas may AI be used in the company?' },
  { key: 'daten',                title: 'Data & Privacy',                 desc: 'Which data may be used and how is its protection ensured?' },
  { key: 'transparenz',          title: 'Transparency & Explainability',  desc: 'How are AI decisions made explainable and auditable?' },
  { key: 'verantwortlichkeiten', title: 'Responsibilities & Governance',  desc: 'Who is responsible for the development, deployment and control of AI?' },
  { key: 'risikomanagement',     title: 'Risk Management & Compliance',   desc: 'What risks exist and how are legal requirements met?' },
  { key: 'ethik',                title: 'Ethics & Fairness',              desc: 'How is it ensured that AI operates without discrimination and responsibly?' },
  { key: 'schulung',             title: 'Training & Awareness',           desc: 'How are employees equipped to use AI safely and effectively?' },
]

const ROLES: { key: keyof GovernanceData['roles']; title: string; desc: string; icon: string }[] = [
  { key: 'aiOwner',  title: 'AI Owner',                       desc: 'Overall responsibility for AI strategy and deployment',      icon: '🎯' },
  { key: 'dpo',      title: 'Data Protection Officer (DPO)',  desc: 'GDPR compliance, DPIA, personal data',                      icon: '🔒' },
  { key: 'security', title: 'IT Security',                    desc: 'Cybersecurity, access controls, attack resilience',          icon: '🛡️' },
  { key: 'ethics',   title: 'Ethics & Bias Reviewer',         desc: 'Anti-bias review, fairness, non-discrimination',            icon: '⚖️' },
  { key: 'business', title: 'Business Approval',              desc: 'Business sign-off before production deployment',            icon: '✅' },
]

const DPIA_URL = 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/how-do-we-do-a-dpia/'

type AimsKey = 'kl4' | 'kl5' | 'kl6' | 'kl7' | 'kl8' | 'kl9' | 'kl10'

const AIMS_CLAUSES: {
  key: AimsKey
  kl: string
  title: string
  desc: string
  coveredBy?: string
}[] = [
  { key: 'kl4',  kl: '4',  title: 'Kontext der Organisation', desc: 'Scope festlegen, KI-Systeme inventarisieren, Stakeholder-Analyse, interne & externe Anforderungen', coveredBy: 'Use Case Liste' },
  { key: 'kl5',  kl: '5',  title: 'Führung & KI-Politik',     desc: 'Top-Management-Commitment, schriftliche KI-Politik, Rollen & Verantwortlichkeiten. Kl. 5.3 = normativer Anker des KI-Beauftragten', coveredBy: 'AI Policy Tab' },
  { key: 'kl6',  kl: '6',  title: 'Planung & Impact Assessment', desc: 'Risikobewertung für KI-Systeme, KI-Folgenabschätzung (A.5) für Betroffene, KI-Ziele festlegen' },
  { key: 'kl7',  kl: '7',  title: 'Kompetenz & Training',     desc: 'KI-Kompetenzen sicherstellen, dokumentierte Nachweise. Deckungsgleich mit EU AI Act Art. 4.', coveredBy: 'Enablement' },
  { key: 'kl8',  kl: '8',  title: 'Betrieb & KI-Lebenszyklus', desc: 'Datenerfassung → Training → Validierung → Betrieb → Ausmusterung. Anhang-A-Controls operationalisieren.', coveredBy: 'Use Case Steckbriefe' },
  { key: 'kl9',  kl: '9',  title: 'Monitoring & Audit',       desc: 'Modellleistung überwachen (Drift, Bias), internes Audit (QMB), Managementbewertung. Brücke zu EU AI Act Art. 72.' },
  { key: 'kl10', kl: '10', title: 'Verbesserung & Vorfälle',  desc: 'Nichtkonformitäten bearbeiten, Vorfallregister führen, Modell-Updates als wesentliche Änderung prüfen (Art. 6/83).' },
]

const AIMS_DEFAULT: NonNullable<GovernanceData['aims']> = {
  kl4:  { status: 'not_started', note: '' },
  kl5:  { status: 'not_started', note: '' },
  kl6:  { status: 'not_started', note: '' },
  kl7:  { status: 'not_started', note: '' },
  kl8:  { status: 'not_started', note: '' },
  kl9:  { status: 'not_started', note: '' },
  kl10: { status: 'not_started', note: '' },
}

const STEPS: { n: number; key: keyof GovernanceData['steps']; title: string; desc: string; details: string[]; link?: { label: string; href: string } }[] = [
  {
    n: 1, key: 'step1', title: 'Define goals and use cases',
    desc: 'Which concrete business problems should AI solve?',
    details: [
      'Collect 3–10 prioritised AI use cases from business units',
      'Define measurable success criteria (KPIs) for each use case',
      'Score and rank by business impact, feasibility and strategic fit',
      'Document all use cases in the AI Canvas (this tool)',
    ],
  },
  {
    n: 2, key: 'step2', title: 'Formulate AI policy',
    desc: 'Purpose, data, transparency, governance, risk, ethics, training',
    details: [
      'Draft the policy across all 7 dimensions (see AI Policy tab)',
      'Get review and sign-off from Legal, Compliance and C-level',
      'Publish internally so all employees know the boundaries',
      'Review annually or after major regulatory changes',
    ],
  },
  {
    n: 3, key: 'step3', title: 'Data privacy & legal requirements',
    desc: 'GDPR, EU AI Act — review and document legal foundations',
    details: [
      'Classify each use case by EU AI Act risk category (Minimal / Limited / High / Unacceptable)',
      'Conduct a DPIA (Data Protection Impact Assessment) for high-risk processing under GDPR Art. 35',
      'Verify GDPR legal basis for all personal data used in AI systems',
      'Document findings per use case in the Privacy Checklist tab',
    ],
    link: { label: 'ICO: How do we do a DPIA? →', href: DPIA_URL },
  },
  {
    n: 4, key: 'step4', title: 'Train employees',
    desc: 'Build AI competency, establish awareness program',
    details: [
      'Identify skill gaps by role (managers, developers, end-users)',
      'Design role-specific training paths covering the 7 K7.0069 topics',
      'Appoint AI Champions as peer coaches within each department',
      'Track completion using the Enablement & Coaching matrix',
    ],
  },
  {
    n: 5, key: 'step5', title: 'Implement security measures',
    desc: 'Cybersecurity, access controls, monitoring',
    details: [
      'Conduct threat modelling for each AI system (prompt injection, data poisoning, model extraction)',
      'Define access control per model, data source and environment',
      'Enable logging and monitoring for all inference calls in production',
      'Test adversarial robustness before go-live',
    ],
  },
  {
    n: 6, key: 'step6', title: 'Extend risk management system',
    desc: 'Integrate AI-specific risks into existing risk framework',
    details: [
      'Catalogue AI-specific risks: hallucinations, bias, model drift, vendor lock-in',
      'Integrate into the enterprise risk register with likelihood and impact ratings',
      'Define monitoring thresholds and automated alerts',
      'Establish escalation paths and incident response procedures',
    ],
  },
  {
    n: 7, key: 'step7', title: 'Assign responsible parties',
    desc: 'Define AI Owner, DPO, Security, Ethics, Business Sign-off',
    details: [
      'Formally appoint AI Owner, DPO, IT Security, Ethics Reviewer and Business Sign-off',
      'Document in the Responsible Parties tab with names and scope',
      'Ensure no conflicts of interest (e.g. developer should not be sole auditor)',
      'Communicate responsibilities to all relevant stakeholders',
    ],
  },
  {
    n: 8, key: 'step8', title: 'Use pilot phase',
    desc: 'Roll out use cases incrementally, document learnings',
    details: [
      'Select 1–2 low-risk use cases as first pilots',
      'Define clear success metrics and a time-boxed evaluation period',
      'Collect structured feedback from users and affected stakeholders',
      'Document learnings and gate criteria before scaling to production',
    ],
  },
  {
    n: 9, key: 'step9', title: 'Document steps 1–8',
    desc: 'Create audit trail, fulfil documentation obligations',
    details: [
      'Maintain a central AI governance log with versioned records',
      'Store policy decisions, risk assessments, training completion and role appointments',
      'Ensure all records are timestamped and signed off — audit-ready',
      'Schedule an annual governance review to keep documentation current',
    ],
  },
]

const COMPLIANCE_COLS: { key: keyof AIUseCase; short: string; title: string }[] = [
  { key: 'complianceLegal',         short: 'Legal',       title: 'Compliance with legal requirements (GDPR, EU AI Act)' },
  { key: 'compliancePersonalData',  short: 'Pers. Data',  title: 'Personal data & legal basis documented' },
  { key: 'complianceDataMin',       short: 'Data Min.',   title: 'Data minimisation & purpose limitation ensured' },
  { key: 'complianceDocumentation', short: 'Docs',        title: 'Documentation & proof obligations fulfilled' },
  { key: 'complianceLiability',     short: 'Liability',   title: 'Liability & responsibility defined' },
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
  const aimsData     = local.aims ?? AIMS_DEFAULT
  const aimsCount    = Object.values(aimsData).filter((c) => c.status === 'done').length

  const handleSave = async () => {
    await save(local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const TABS: { id: Tab; label: string; badge: string }[] = [
    { id: 'steps',     label: '9-Step Planning',        badge: `${stepsCount}/9`    },
    { id: 'richtlinie',label: 'AI Policy',              badge: `${richtCount}/7`    },
    { id: 'roles',     label: 'Responsible Parties',    badge: `${rolesCount}/5`    },
    { id: 'checklist', label: 'Privacy Checklist',      badge: `${useCases.length}` },
    { id: 'aims',      label: 'ISO 42001 AIMS',         badge: `${aimsCount}/7`     },
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
          <p className="text-sm text-slate-500 mt-0.5">Strategic Planning · AI Policy · Data Privacy — K7.0069</p>
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
        <KpiCard label="Planning Complete"  value={`${stepsCount} / 9`}   pct={stepsCount / 9}   color="blue"   />
        <KpiCard label="AI Policy Filled"   value={`${richtCount} / 7`}   pct={richtCount / 7}   color="violet" />
        <KpiCard label="Roles Assigned"     value={`${rolesCount} / 5`}   pct={rolesCount / 5}   color="emerald"/>
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
      {tab === 'aims' && (
        <AimsTab
          aims={aimsData}
          onChange={(aims) => setLocal((p) => ({ ...p, aims }))}
          readonly={!user}
        />
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const done = Object.values(steps).filter(Boolean).length
  const pct = Math.round((done / 9) * 100)

  const toggle = (key: string) => setExpanded((prev) => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Strategic AI Deployment Planning</h3>
          <span className="text-sm font-bold text-blue-700">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="space-y-2">
          {STEPS.map((s) => {
            const checked = steps[s.key]
            const isExpanded = expanded.has(s.key)
            return (
              <div
                key={s.key}
                className={`rounded-lg border transition-colors ${
                  checked ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'
                }`}
              >
                {/* Main row */}
                <div className="flex items-start gap-3 p-3">
                  <label className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer">
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
                  {/* Expand toggle */}
                  <button
                    onClick={() => toggle(s.key)}
                    className="flex-shrink-0 p-1 rounded hover:bg-slate-200/60 transition-colors"
                    title={isExpanded ? 'Hide details' : 'Show details'}
                  >
                    <svg
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 ml-10">
                    <ul className="space-y-1.5 border-t border-slate-200/70 pt-2.5">
                      {s.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-snug">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${checked ? 'bg-blue-400' : 'bg-slate-300'}`} />
                          {d}
                        </li>
                      ))}
                    </ul>
                    {s.link && (
                      <a
                        href={s.link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-2.5 text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                      >
                        {s.link.label}
                      </a>
                    )}
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
            placeholder={readonly ? '—' : 'Enter your answer…'}
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
              placeholder={readonly ? 'Not assigned' : 'Enter name…'}
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

// ─── ISO 42001 AIMS Tab ───────────────────────────────────────────────────────
function AimsTab({
  aims,
  onChange,
  readonly,
}: {
  aims: NonNullable<GovernanceData['aims']>
  onChange: (aims: NonNullable<GovernanceData['aims']>) => void
  readonly: boolean
}) {
  const doneCount = Object.values(aims).filter((c) => c.status === 'done').length
  const pct = Math.round((doneCount / 7) * 100)

  const STATUS_LABELS: Record<AimsClause['status'], string> = {
    not_started: 'Nicht begonnen',
    in_progress: 'In Arbeit',
    done: 'Erledigt',
  }
  const STATUS_COLORS: Record<AimsClause['status'], string> = {
    not_started: 'bg-slate-100 text-slate-500',
    in_progress: 'bg-amber-100 text-amber-700',
    done: 'bg-green-100 text-green-700',
  }
  const STATUS_DOT: Record<AimsClause['status'], string> = {
    not_started: 'bg-slate-300',
    in_progress: 'bg-amber-400',
    done: 'bg-green-500',
  }

  const update = (key: AimsKey, patch: Partial<AimsClause>) =>
    onChange({ ...aims, [key]: { ...aims[key], ...patch } })

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">ISO/IEC 42001 · AIMS Readiness</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Artificial Intelligence Management System — Klauseln 4–10 (High-Level Structure)
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-blue-700">{doneCount}/7</p>
            <p className="text-xs text-slate-400">Klauseln erledigt</p>
          </div>
        </div>
        <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex gap-2 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Erledigt</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />In Arbeit</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />Nicht begonnen</span>
          <span className="ml-auto italic">ISO 42001 ≠ EU AI Act Konformitätsbewertung — zwei verschiedene Risikosubjekte</span>
        </div>
      </div>

      {/* Clause rows */}
      {AIMS_CLAUSES.map((cl) => {
        const clause = aims[cl.key]
        return (
          <div key={cl.key} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-start gap-3">
              {/* Status dot */}
              <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${STATUS_DOT[clause.status]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-400">Kl. {cl.kl}</span>
                  <span className="font-semibold text-slate-800 text-sm">{cl.title}</span>
                  {cl.coveredBy && (
                    <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                      → {cl.coveredBy}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{cl.desc}</p>
                {clause.note && (
                  <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 rounded px-2 py-1 italic">{clause.note}</p>
                )}
                {!readonly && (
                  <textarea
                    placeholder="Notiz / Nachweise…"
                    value={clause.note}
                    onChange={(e) => update(cl.key, { note: e.target.value })}
                    rows={1}
                    className="mt-2 w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700 placeholder:text-slate-300"
                  />
                )}
              </div>
              {/* Status selector */}
              {!readonly ? (
                <select
                  value={clause.status}
                  onChange={(e) => update(cl.key, { status: e.target.value as AimsClause['status'] })}
                  className={`text-xs font-medium px-2 py-1 rounded-full border-0 shrink-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 ${STATUS_COLORS[clause.status]}`}
                >
                  <option value="not_started">Nicht begonnen</option>
                  <option value="in_progress">In Arbeit</option>
                  <option value="done">Erledigt</option>
                </select>
              ) : (
                <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${STATUS_COLORS[clause.status]}`}>
                  {STATUS_LABELS[clause.status]}
                </span>
              )}
            </div>
          </div>
        )
      })}

      {/* ISO Norm-Familie */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <p className="text-sm font-semibold text-slate-800 mb-3">Relevante ISO-Normen für KI-Beauftragte</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-4 font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Norm</th>
                <th className="text-left py-2 pr-4 font-semibold text-slate-500 uppercase tracking-wide">Was sie regelt</th>
                <th className="text-left py-2 font-semibold text-slate-500 uppercase tracking-wide">Funktion für den KIB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { norm: 'ISO/IEC 42001', title: 'AIMS — KI-Managementsystem', fn: 'Kernstandard · EN-Übernahme 2026 (nicht OJEU-gelistet)', highlight: true },
                { norm: 'ISO/IEC 23894', title: 'KI-Risikomanagement',         fn: 'Ergänzt Klausel 6 · für Risikobeurteilung' },
                { norm: 'ISO/IEC 42005', title: 'AI System Impact Assessment (2025)', fn: 'Prozessrahmen für Impact Assessment (A.5)' },
                { norm: 'ISO/IEC 27001', title: 'ISMS — Informationssicherheit', fn: 'HLS-kompatibel · oft schon im Haus' },
                { norm: 'ISO 9001',      title: 'QMS — Qualitätsmanagement',   fn: 'Integrationsgrundlage · oft schon im Haus' },
                { norm: 'ISO 13485',     title: 'QMS Medizinprodukte',         fn: 'Relevant für Radiologie-KI / MDR — ergänzt 42001' },
              ].map((r) => (
                <tr key={r.norm} className={r.highlight ? 'bg-blue-50' : ''}>
                  <td className="py-2 pr-4 font-mono font-semibold text-slate-700 whitespace-nowrap">{r.norm}</td>
                  <td className="py-2 pr-4 text-slate-600">{r.title}</td>
                  <td className="py-2 text-slate-500">{r.fn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-3 italic">
          Technische Detail-Normen (ISO/IEC 5338 KI-Lifecycle, ISO/IEC 24029 Robustness) → kann der KIB an Spezialisten delegieren.
        </p>
      </div>

      {/* SoA reminder */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">Statement of Applicability (SoA) — Herzstück des AIMS</p>
        <p className="text-xs leading-relaxed">
          Das SoA dokumentiert für alle Anhang-A-Controls (A.2–A.10), ob sie anwendbar sind (mit Umsetzungsverweis) oder nicht anwendbar (mit Begründung — Pflicht, nicht Kür). Kein SoA = kein ISO 42001. Erster Griff jedes externen Auditors.
        </p>
      </div>
    </div>
  )
}
