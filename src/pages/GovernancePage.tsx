import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGovernanceStore } from '../store/governanceStore'
import { useUseCasesStore } from '../store/useCasesStore'
import { useAuthStore } from '../store/authStore'
import { getDemoMode, useDemoStore } from '../store/demoStore'
import { GovernanceData, AimsClause, AIUseCase, EU_AI_ACT_BG, EuAiActRisk } from '../types'

type Tab = 'steps' | 'richtlinie' | 'roles' | 'checklist' | 'aims' | 'compliance'

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
  const { useCases, init: initUseCases } = useUseCasesStore()
  const user = useAuthStore((s) => s.user)
  const demoMode = useDemoStore((s) => s.demoMode)
  const navigate = useNavigate()
  const [local, setLocal] = useState<GovernanceData>(DEFAULT)
  const [saved, setSaved] = useState(false)

  useEffect(() => { init() }, [init])
  useEffect(() => { initUseCases() }, [initUseCases, demoMode])
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
    { id: 'aims',       label: 'ISO 42001 AIMS',         badge: `${aimsCount}/7`     },
    { id: 'compliance', label: 'Compliance-Check',       badge: '8'                  },
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
            disabled={saving || tab === 'checklist' || tab === 'compliance'}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors min-w-[90px]"
          >
            {saving ? 'Speichern…' : saved ? '✓ Gespeichert' : 'Speichern'}
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
      <div className="flex flex-wrap gap-1 bg-slate-100 rounded-xl p-1">
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
      {tab === 'compliance' && <ComplianceCheckTab isDemo={demoMode} />}
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
                    title={isExpanded ? 'Details ausblenden' : 'Details anzeigen'}
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
              placeholder={readonly ? 'Nicht zugewiesen' : 'Name eingeben…'}
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

      {/* SoA reminder + example */}
      <SoaExample />
    </div>
  )
}

function SoaExample() {
  const [open, setOpen] = useState(false)

  const SOA_ROWS: {
    control: string
    title: string
    applicable: boolean
    justification: string
  }[] = [
    { control: 'A.2',     title: 'Richtlinien im Zusammenhang mit KI',  applicable: true,  justification: 'KI-Nutzungsrichtlinie verabschiedet und intern veröffentlicht (Stand Juli 2026).' },
    { control: 'A.5',     title: 'Auswirkungsbewertung (Impact Assessment)', applicable: true, justification: 'FRIA für Radiologie-KI (uc-024) und EPA-Agent (uc-023) durchgeführt. Chatbot (uc-022) geplant Q3 2026.' },
    { control: 'A.6',     title: 'KI-Systemlebenszyklus',               applicable: true,  justification: 'Lifecycle dokumentiert in Use-Case-Steckbriefen. Validierungsdokumentation für uc-022 ausstehend.' },
    { control: 'A.6.2.5', title: 'Generative KI-Modelle',               applicable: false, justification: 'Krankenhaus St. Ulrich betreibt keine generativen KI-Systeme. Status: 2026, jährlich zu überprüfen.' },
    { control: 'A.7',     title: 'Daten für KI-Systeme',                applicable: true,  justification: 'Trainingsdaten-Herkunft (Provenance) beim Anbieter Indien angefordert — Rückmeldung ausstehend.' },
    { control: 'A.8',     title: 'Informationen für interessierte Parteien', applicable: true, justification: 'Patienten-Disclosure für Chatbot implementiert (EU AI Act Art. 50). Systeminformation für Radiologie-KI in Vorbereitung.' },
    { control: 'A.9',     title: 'Verantwortungsvolle Nutzung',         applicable: true,  justification: 'Ethische Nutzungsleitlinien im KI-Governance-Dokument verankert.' },
    { control: 'A.10',    title: 'Beziehungen zu Dritten',              applicable: true,  justification: 'Anbietervertrag Radiologie-KI (Indien) mit MDR-Konformitätsnachweis-Klausel versehen.' },
  ]

  return (
    <div className="border border-amber-200 rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between bg-amber-50 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-amber-800">Statement of Applicability (SoA) — Herzstück des AIMS</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Kein SoA = kein ISO 42001 · Erster Griff jedes externen Auditors
          </p>
        </div>
        <span className="text-amber-600 text-sm font-medium shrink-0 ml-4">
          {open ? '▲ Beispiel schließen' : '▼ Beispiel anzeigen'}
        </span>
      </button>

      {/* Expandable SoA example table */}
      {open && (
        <div className="bg-white px-4 py-3">
          <p className="text-xs text-slate-500 mb-3">
            Beispiel-SoA · Krankenhaus St. Ulrich · Stand Juli 2026 — alle Anhang-A-Controls müssen bewertet sein
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Control</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">Titel</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Anwendbar</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">Begründung / Umsetzungsnachweis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SOA_ROWS.map((r) => (
                  <tr key={r.control} className={r.applicable ? '' : 'bg-red-50'}>
                    <td className="px-3 py-2 font-mono text-slate-600 whitespace-nowrap">{r.control}</td>
                    <td className="px-3 py-2 text-slate-700">{r.title}</td>
                    <td className="px-3 py-2 text-center">
                      {r.applicable
                        ? <span className="text-green-600 font-semibold">✓ Ja</span>
                        : <span className="text-red-500 font-semibold">✗ Nein</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-500 leading-relaxed">{r.justification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-2 italic">
            „Nicht anwendbar" muss immer begründet werden — die Begründungstiefe zeigt den Reifegrad der Organisation.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Compliance-Check Tab ─────────────────────────────────────────────────────
type VerstossStatus = 'trifft_zu' | 'nicht_betroffen' | 'offen'

type Framework = 'EU AI Act' | 'DSGVO' | 'ISO 42001' | 'ISO 27001'

const FRAMEWORK_CFG: Record<Framework, { cls: string; short: string }> = {
  'EU AI Act':  { cls: 'bg-orange-100 text-orange-700 border-orange-300', short: 'AI Act' },
  'DSGVO':      { cls: 'bg-blue-100 text-blue-700 border-blue-300',       short: 'DSGVO'  },
  'ISO 42001':  { cls: 'bg-violet-100 text-violet-700 border-violet-300', short: '42001'  },
  'ISO 27001':  { cls: 'bg-slate-100 text-slate-700 border-slate-300',    short: '27001'  },
}

interface Verstoss {
  nr: number
  fehlmuster: string
  luecke: string
  rechtsgrundlage: string
  massnahme: string
  frameworks: Framework[]
  status: VerstossStatus
  beispiele: { abteilung: string; beschreibung: string }[]
}

const INITIAL_VERSTOESSE: Verstoss[] = [
  {
    nr: 1,
    fehlmuster: 'Sensible Daten in KI-Tools einfügen',
    luecke: 'DSGVO-TOMs unvollständig',
    rechtsgrundlage: 'DSGVO Art. 9 / Art. 32 · EU AI Act Art. 10',
    massnahme: 'Datenkategorien klassifizieren (Sensitivity Labels), Nutzungsrichtlinie mit Negativliste ergänzen, DSGVO-TOM-Abschnitt für KI-Tools nachziehen.',
    frameworks: ['DSGVO', 'EU AI Act'],
    status: 'trifft_zu',
    beispiele: [
      { abteilung: 'Pflege', beschreibung: 'Nutzt ChatGPT als generelle Suchmaschine — Patientendaten können in Prompts landen' },
      { abteilung: 'Verwaltung', beschreibung: 'Nutzt DeepL für Übersetzungen — Patientenkorrespondenz wird an US-Server übertragen' },
    ],
  },
  {
    nr: 2,
    fehlmuster: 'Private KI-Accounts für Arbeit nutzen',
    luecke: 'KI-Nutzungsrichtlinie fehlt oder unklar',
    rechtsgrundlage: 'DSGVO Art. 28 (kein AVV) · EU AI Act Art. 4',
    massnahme: 'KI-Nutzungsrichtlinie (AUP) verabschieden, Liste genehmigter Tools publizieren, Schulung zur Unterscheidung privat/dienstlich.',
    frameworks: ['DSGVO', 'EU AI Act', 'ISO 27001'],
    status: 'trifft_zu',
    beispiele: [
      { abteilung: 'IT-Help Desk', beschreibung: 'Nutzt Gemini Pro (privater Account) um Support-Anfragen zu beantworten' },
    ],
  },
  {
    nr: 3,
    fehlmuster: 'Dateien ohne Inhaltsprüfung hochladen',
    luecke: 'Klassifizierung fehlt',
    rechtsgrundlage: 'DSGVO Art. 5 Abs. 1 lit. f · EU AI Act Art. 10 · ISO 27001 A.5.12',
    massnahme: 'Microsoft Purview Sensitivity Labels einführen (Öffentlich / Intern / Vertraulich / Streng vertraulich). DLP-Regel: Streng vertrauliche Dateien können nicht in externe KI-Tools hochgeladen werden.',
    frameworks: ['DSGVO', 'EU AI Act', 'ISO 27001'],
    status: 'offen',
    beispiele: [
      { abteilung: 'Verwaltung', beschreibung: 'DeepL-Upload von Arztbriefen ohne Klassifizierung' },
    ],
  },
  {
    nr: 4,
    fehlmuster: 'Schatten-KI ignorieren — IT weiß nichts',
    luecke: 'Inventarisierungsprozess fehlt',
    rechtsgrundlage: 'EU AI Act Art. 4 (Kompetenzpflicht) · ISO 42001 Kl. 8 · ISO 27001 A.5.23',
    massnahme: 'KI-Inventar aufbauen (technisch: Defender for Cloud Apps / organisatorisch: MA-Befragung). Quartalsweise Review. Kardiologe-Piloten formal erfassen.',
    frameworks: ['EU AI Act', 'ISO 42001', 'ISO 27001'],
    status: 'trifft_zu',
    beispiele: [
      { abteilung: 'Kardiologe', beschreibung: 'Testet Aidoc als ootb-Lösung ohne IT-Wissen' },
      { abteilung: 'Ärzte', beschreibung: 'Edge-Extension für E-Mail-Formulierungen installiert — IT nicht informiert' },
    ],
  },
  {
    nr: 5,
    fehlmuster: 'KI-Output als eigenes IP behandeln',
    luecke: 'Urheberrechts-Policy fehlt',
    rechtsgrundlage: 'UrhG § 2 · Nutzungsbedingungen KI-Anbieter',
    massnahme: 'Klärung in KI-Nutzungsrichtlinie: KI-generierte Inhalte sind nicht automatisch urheberrechtlich schutzfähig. Hinweispflicht in internen Richtlinien verankern.',
    frameworks: ['EU AI Act'],
    status: 'offen',
    beispiele: [],
  },
  {
    nr: 6,
    fehlmuster: 'Pflichten und Rechte des Anbieters nicht geprüft',
    luecke: 'Einkaufs-Policy unvollständig',
    rechtsgrundlage: 'DSGVO Art. 28 (AVV) · EU AI Act Art. 25 (Betreiberpflichten) · ISO 27001 A.5.21',
    massnahme: 'Checkliste für KI-Tool-Einkauf einführen: AVV vorhanden? EU-Serverstandort? Trainingsdaten-Opt-out? CE-Kennzeichnung (MDR) bei medizinischen Tools?',
    frameworks: ['DSGVO', 'EU AI Act', 'ISO 27001'],
    status: 'trifft_zu',
    beispiele: [
      { abteilung: 'Ärzte', beschreibung: 'Edge-Extension für E-Mails an Kollegen in China: Datentransfer in Drittstaat ohne SCC-Prüfung' },
      { abteilung: 'Kardiologe', beschreibung: 'Aidoc: MDR-Zertifizierung und AVV noch nicht geprüft' },
    ],
  },
  {
    nr: 7,
    fehlmuster: 'KI-generierten Code ohne Review deployed',
    luecke: 'Entwicklungs-Policy fehlt (Pipeline)',
    rechtsgrundlage: 'EU AI Act Art. 9 (Risikomanagement) · ISO 42001 Kl. 8.4 · ISO 27001 A.8.25',
    massnahme: 'CI/CD-Pipeline um KI-Code-Review-Gate ergänzen. Vier-Augen-Prinzip für KI-generierten Code in Produktionssystemen.',
    frameworks: ['EU AI Act', 'ISO 42001', 'ISO 27001'],
    status: 'nicht_betroffen',
    beispiele: [],
  },
  {
    nr: 8,
    fehlmuster: 'Keine KI-Incidentkategorien im ITSM',
    luecke: 'Vorfallmanagement nicht erweiterbar',
    rechtsgrundlage: 'EU AI Act Art. 73 (Meldepflicht) · DSGVO Art. 33 · ISO 27001 A.5.26',
    massnahme: 'ITSM (z. B. ServiceNow) um KI-Incident-Kategorien erweitern: Halluzination, Modell-Drift, Datenschutzverletzung durch KI, unberechtigter Datenzugriff durch Agenten.',
    frameworks: ['EU AI Act', 'DSGVO', 'ISO 27001'],
    status: 'offen',
    beispiele: [],
  },
]

const STATUS_CFG: Record<VerstossStatus, { label: string; cls: string; dot: string }> = {
  trifft_zu:        { label: 'Trifft zu',       cls: 'bg-red-100 text-red-700 border-red-200',     dot: 'bg-red-500'     },
  offen:            { label: 'Offen / unklar',   cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  nicht_betroffen:  { label: 'Nicht betroffen',  cls: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
}

const BAUSTEINE = [
  { key: 'aup',      label: 'KI-Nutzungsrichtlinie / IT-Nutzungsrichtlinie', desc: 'Regelt erlaubte Tools, verbotene Handlungen (AUP), Verantwortlichkeiten' },
  { key: 'toms',     label: 'DSGVO-TOMs',                                    desc: 'Technisch-organisatorische Maßnahmen: Verschlüsselung, Zugangskontrollen, Löschfristen' },
  { key: 'itpolicy', label: 'IT-Policy / Security Policy',                   desc: 'Passwortregeln, Geräteverwaltung, Vorfallmeldung, Authentifizierung und Autorisierung' },
  { key: 'schulung', label: 'Schulungen & Awareness',                        desc: 'Datenschutz-Jahresschulung, Phishing-Sensibilisierung, Virus- und Link-Schutz' },
  { key: 'itsm',     label: 'ITSM (Incident Management)',                    desc: 'Meldewege für Sicherheitsvorfälle' },
]

const GAP_LUECKEN = [
  { title: 'Bias & Diskriminierung',    why: 'KI-Nutzungsrichtlinien regeln Nutzung, nicht Modelleigenschaften' },
  { title: 'Datenherkunft (Provenance)',why: 'DSGVO-TOMs sichern Verarbeitungsprozesse, nicht Trainingsdatenhistorie' },
  { title: 'Halluzination & Faktentreue',why: 'IT-Security-Regeln zielen auf Angriffe, nicht auf system-interne Fehler' },
  { title: 'Modell-Drift',              why: 'Vorfallmanagement wartet auf gemeldete Vorfälle — Drift entsteht unbemerkt' },
  { title: 'Agenten-Autonomie',         why: 'KI-Nutzungsrichtlinien decken assistive Tools ab, nicht autonom handelnde Agenten' },
]

const SCHATTEN_RISIKEN = [
  { title: 'Datenabfluss',    desc: 'Patientendaten in kostenlosen Tools, die zum Training genutzt werden', color: 'border-red-300 bg-red-50 text-red-700' },
  { title: 'DSGVO-Verstoß',   desc: 'Kein AVV mit dem KI-Anbieter, Datentransfer in Drittstaaten ohne Standardvertragsklauseln (SCC)', color: 'border-orange-300 bg-orange-50 text-orange-700' },
  { title: 'AI-Act-Verstoß',  desc: 'Art. 4 Kompetenzpflicht: die Organisation muss sicherstellen, dass Mitarbeitende kompetent mit KI umgehen — ist das bei Eigenbauten und Selbstversuchen der Fall?', color: 'border-amber-300 bg-amber-50 text-amber-700' },
]

// ── Workspace: Fallanalyse ────────────────────────────────────────────────────
interface FallInput {
  tool: string
  abteilung: string
  beschreibung: string
  personalData: 'ja' | 'nein' | 'unbekannt'
  approved: 'ja' | 'nein' | 'unbekannt'
  avv: 'ja' | 'nein' | 'unbekannt'
  filesUploaded: boolean
  noItsm: boolean
}

interface AnalysierterFall extends FallInput {
  id: string
  matchedNr: number[]
}

function analyzeFall(f: FallInput): number[] {
  const hits: number[] = []
  if (f.personalData !== 'nein')                           hits.push(1)
  if (f.approved !== 'ja')                                 hits.push(2)
  if (f.filesUploaded)                                     hits.push(3)
  if (f.approved !== 'ja')                                 hits.push(4)
  if (f.avv !== 'ja')                                      hits.push(6)
  if (f.noItsm)                                            hits.push(8)
  return [...new Set(hits)]
}

const ABTEILUNGEN = ['Pflege', 'Ärzte', 'Verwaltung', 'IT', 'Kardiologe', 'Radiologie', 'HR', 'Einkauf', 'Sonstige']

function FallanalyseView() {
  const emptyForm: FallInput = {
    tool: '', abteilung: 'Pflege', beschreibung: '',
    personalData: 'unbekannt', approved: 'unbekannt', avv: 'unbekannt',
    filesUploaded: false, noItsm: false,
  }
  const [form, setForm] = useState<FallInput>(emptyForm)
  const [faelle, setFaelle] = useState<AnalysierterFall[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  const set = (k: keyof FallInput, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const submit = () => {
    if (!form.tool.trim() || !form.beschreibung.trim()) return
    const matched = analyzeFall(form)
    setFaelle((p) => [{ ...form, id: Date.now().toString(), matchedNr: matched }, ...p])
    setForm(emptyForm)
  }

  const triSelect = (key: keyof FallInput, val: 'ja' | 'nein' | 'unbekannt') => (
    <div className="flex gap-1">
      {(['ja', 'nein', 'unbekannt'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => set(key, v)}
          className={`text-xs px-2 py-1 rounded-full border font-medium transition-all ${
            form[key] === v
              ? v === 'ja' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                : v === 'nein' ? 'bg-red-100 text-red-700 border-red-300'
                : 'bg-amber-100 text-amber-700 border-amber-300'
              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
          }`}
        >
          {v === 'unbekannt' ? 'Unklar' : v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Input form */}
      <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Neuen Fall analysieren</h2>
        <p className="text-xs text-slate-400 -mt-2">Beschreibe den KI-Einsatz — das Tool ordnet ihn automatisch den relevanten Compliance-Lücken zu.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">KI-Tool / Anwendung</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="z. B. ChatGPT, DeepL, Gemini Pro…"
              value={form.tool}
              onChange={(e) => set('tool', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Abteilung</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.abteilung}
              onChange={(e) => set('abteilung', e.target.value)}
            >
              {ABTEILUNGEN.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Beschreibung der Nutzung</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="Was genau wird gemacht? Welche Daten fließen rein?"
              value={form.beschreibung}
              onChange={(e) => set('beschreibung', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Enthält Personendaten?</label>
            {triSelect('personalData', form.personalData)}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Offiziell genehmigt?</label>
            {triSelect('approved', form.approved)}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">AVV mit Anbieter vorhanden?</label>
            {triSelect('avv', form.avv)}
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.filesUploaded} onChange={(e) => set('filesUploaded', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-500" />
              <span className="text-xs font-semibold text-slate-600">Dateien / Dokumente werden hochgeladen</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.noItsm} onChange={(e) => set('noItsm', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-500" />
              <span className="text-xs font-semibold text-slate-600">Kein KI-Incident-Prozess vorhanden</span>
            </label>
          </div>
        </div>
        <button
          onClick={submit}
          disabled={!form.tool.trim() || !form.beschreibung.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          Compliance analysieren →
        </button>
      </div>

      {/* Results */}
      {faelle.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-slate-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm font-medium">Noch kein Fall eingegeben.</p>
          <p className="text-xs mt-1">Beschreibe einen KI-Einsatz oben — das Tool zeigt dir sofort welche Compliance-Lücken betroffen sind.</p>
        </div>
      )}
      {faelle.map((fall) => {
        const isOpen = expanded === fall.id
        const severity = fall.matchedNr.length === 0 ? 'green' : fall.matchedNr.length <= 2 ? 'amber' : 'red'
        const severityBg = { green: 'bg-green-50 border-green-200', amber: 'bg-amber-50 border-amber-200', red: 'bg-red-50 border-red-200' }[severity]
        const severityText = { green: 'text-green-700', amber: 'text-amber-700', red: 'text-red-700' }[severity]
        return (
          <div key={fall.id} className={`bg-white rounded-xl shadow-md border-l-4 overflow-hidden ${severity === 'red' ? 'border-red-400' : severity === 'amber' ? 'border-amber-400' : 'border-green-400'}`}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">{fall.tool}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{fall.abteilung}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{fall.beschreibung}</p>
                </div>
                <div className={`flex-shrink-0 text-center px-3 py-1.5 rounded-lg border ${severityBg}`}>
                  <p className={`text-lg font-bold ${severityText}`}>{fall.matchedNr.length}</p>
                  <p className={`text-xs ${severityText}`}>Verstöße</p>
                </div>
              </div>
              {fall.matchedNr.length === 0 ? (
                <p className="text-xs text-green-600 mt-2 font-medium">✓ Kein Compliance-Verstoß erkannt.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1 flex-wrap">
                    {(Array.from(new Set(fall.matchedNr.flatMap((nr) => INITIAL_VERSTOESSE.find((x) => x.nr === nr)?.frameworks ?? []))) as Framework[]).map((f) => (
                      <span key={f} className={`text-xs px-2 py-0.5 rounded border font-semibold ${FRAMEWORK_CFG[f].cls}`}>{f} betroffen</span>
                    ))}
                  </div>
                  <button onClick={() => setExpanded(isOpen ? null : fall.id)} className="text-xs text-blue-600 hover:underline">
                    {isOpen ? '▲ Details ausblenden' : `▼ ${fall.matchedNr.length} Fehlmuster anzeigen`}
                  </button>
                </div>
              )}
            </div>
            {isOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-100">
                {fall.matchedNr.map((nr) => {
                  const v = INITIAL_VERSTOESSE.find((x) => x.nr === nr)!
                  return (
                    <div key={nr} className="px-4 py-3 bg-slate-50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{nr}</span>
                        <p className="text-xs font-semibold text-slate-700">{v.fehlmuster}</p>
                      </div>
                      <div className="flex gap-1 flex-wrap ml-7 mb-1">
                        {v.frameworks.map((f) => (
                          <span key={f} className={`text-xs px-1.5 py-0.5 rounded border font-medium ${FRAMEWORK_CFG[f].cls}`}>{f}</span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 ml-7">Lücke: {v.luecke}</p>
                      <p className="text-xs text-blue-600 ml-7 mt-1">{v.massnahme}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ComplianceCheckTab({ isDemo }: { isDemo: boolean }) {
  const [verstoesse, setVerstoesse] = useState<Verstoss[]>(INITIAL_VERSTOESSE)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [bausteine, setBausteine] = useState<Record<string, boolean>>({
    aup: true, toms: true, itpolicy: true, schulung: false, itsm: true,
  })

  if (!isDemo) return <FallanalyseView />

  const counts = {
    trifft_zu:       verstoesse.filter((v) => v.status === 'trifft_zu').length,
    offen:           verstoesse.filter((v) => v.status === 'offen').length,
    nicht_betroffen: verstoesse.filter((v) => v.status === 'nicht_betroffen').length,
  }

  const setStatus = (nr: number, status: VerstossStatus) =>
    setVerstoesse((prev) => prev.map((v) => v.nr === nr ? { ...v, status } : v))

  const bausteineCount = Object.values(bausteine).filter(Boolean).length

  return (
    <div className="space-y-6">

      {/* ── Folie 3: Bestandsaufnahme ── */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">① Bestandsaufnahme — Was haben wir bereits?</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{bausteineCount}/5 vorhanden</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">Hake ab, welche Compliance-Bausteine im Unternehmen bereits existieren.</p>
        <div className="space-y-2">
          {BAUSTEINE.map((b) => (
            <label key={b.key} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${bausteine[b.key] ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
              <input
                type="checkbox"
                checked={!!bausteine[b.key]}
                onChange={(e) => setBausteine((p) => ({ ...p, [b.key]: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
              />
              <div>
                <p className={`text-sm font-medium ${bausteine[b.key] ? 'text-emerald-700' : 'text-slate-700'}`}>{b.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{b.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── Folie 4: Gap-Analyse ── */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">② Gap-Analyse — Was diese Regeln bei KI nicht abdecken</h2>
        <p className="text-xs text-slate-400 mb-4">5 strukturelle Lücken — keine bestehende Policy greift hier vollständig.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Lücke</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Warum bestehende Regeln nicht reichen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {GAP_LUECKEN.map((g) => (
                <tr key={g.title} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-semibold text-slate-700 whitespace-nowrap">{g.title}</td>
                  <td className="px-3 py-2.5 text-slate-500 text-xs">{g.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-slate-100 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Die falsche Frage</p>
            <p className="text-sm text-slate-600 italic">„Haben wir Compliance?"</p>
          </div>
          <div className="bg-[#c85a1a] rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-orange-200 uppercase tracking-wide mb-1">Die richtige Frage</p>
            <p className="text-sm text-white italic">„Welche unserer Regeln greift bei diesen fünf Lücken?"</p>
          </div>
        </div>
      </div>

      {/* ── Folie 6: Schatten-KI ── */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">③ Schatten-KI · Definition + 3 Compliance-Risiken</h2>
        <p className="text-xs text-slate-400 mb-1"><strong className="text-slate-600">Schatten-KI</strong> sind KI-Tools, die in einer Organisation genutzt werden, ohne dass IT oder Compliance davon wissen oder sie kontrollieren können.</p>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-xs text-red-700">
          Das ist seitens der Mitarbeitenden zunächst pragmatisch, wird auch oft vom Management belohnt („meine Abteilung nutzt schon KI") — <strong>nicht böswillig</strong>.
        </div>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Drei konkrete Compliance-Risiken</p>
        <div className="space-y-2">
          {SCHATTEN_RISIKEN.map((r) => (
            <div key={r.title} className={`border rounded-lg px-4 py-3 ${r.color}`}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1">{r.title}</p>
              <p className="text-xs">{r.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="font-semibold text-slate-600 mb-0.5">St. Ulrich – Schatten-KI Fälle</p>
            <ul className="space-y-1 text-slate-500">
              <li>🏥 Pflege nutzt ChatGPT (kostenlos, kein AVV)</li>
              <li>🏥 IT-Help Desk nutzt Gemini Pro (privater Account)</li>
              <li>🏥 Ärzte: Edge-Extension ohne IT-Genehmigung</li>
              <li>🏥 Kardiologe: Aidoc-Pilot ohne Inventarisierung</li>
            </ul>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="font-semibold text-slate-600 mb-0.5">Inventarisierung — Zwei Kanäle</p>
            <ul className="space-y-1 text-slate-500">
              <li><strong>Technisch:</strong> Purview, Defender for Cloud Apps, Browser-Telemetrie → findet ChatGPT, DeepL, Grammarly von Firmengeräten</li>
              <li><strong>Organisatorisch:</strong> MA-Befragung, Helpdesk-Tickets → findet Tools auf privaten Geräten, VPN-Umgehung</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{counts.trifft_zu}</p>
          <p className="text-xs font-semibold text-red-500 mt-1 uppercase tracking-wide">Trifft zu — Handlungsbedarf</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{counts.offen}</p>
          <p className="text-xs font-semibold text-amber-500 mt-1 uppercase tracking-wide">Offen / noch zu prüfen</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{counts.nicht_betroffen}</p>
          <p className="text-xs font-semibold text-green-500 mt-1 uppercase tracking-wide">Nicht betroffen</p>
        </div>
      </div>

      {/* Fehlmuster list */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">8 Typische Fehlmuster · Gap-Analyse</h2>
          <p className="text-xs text-slate-400 mt-0.5">Quelle: Compliance-Strategien und Governance-Frameworks · Ulrich Nord, Juli 2026</p>
        </div>
        <div className="divide-y divide-slate-100">
          {verstoesse.map((v) => {
            const cfg = STATUS_CFG[v.status]
            const isOpen = expanded === v.nr
            return (
              <div key={v.nr} className="p-4">
                {/* Header row */}
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5">{v.nr}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{v.fehlmuster}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Lücke: {v.luecke}</p>
                        <div className="flex gap-1 flex-wrap mt-1.5">
                          {v.frameworks.map((f) => (
                            <span key={f} className={`text-xs px-1.5 py-0.5 rounded border font-medium ${FRAMEWORK_CFG[f].cls}`}>{f}</span>
                          ))}
                        </div>
                      </div>
                      {/* Status selector */}
                      <div className="flex gap-1 flex-shrink-0">
                        {(Object.keys(STATUS_CFG) as VerstossStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(v.nr, s)}
                            className={`text-xs px-2 py-1 rounded-full border font-medium transition-all ${
                              v.status === s ? cfg.cls : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {STATUS_CFG[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Expand button */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : v.nr)}
                      className="text-xs text-blue-600 hover:underline mt-1.5"
                    >
                      {isOpen ? '▲ Rechtsgrundlage & Maßnahme ausblenden' : '▼ Rechtsgrundlage & Maßnahme'}
                    </button>
                  </div>
                </div>

                {/* St. Ulrich examples — always visible */}
                {v.beispiele.length > 0 && (
                  <div className="mt-3 ml-10 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">🏥 St. Ulrich – Beispiele</p>
                    {v.beispiele.map((b, i) => (
                      <div key={i} className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                        <span className="text-xs font-bold text-orange-600 mt-0.5 flex-shrink-0">{b.abteilung}</span>
                        <span className="text-xs text-orange-700">{b.beschreibung}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expanded detail — rechtsgrundlage + massnahme */}
                {isOpen && (
                  <div className="mt-3 ml-10 space-y-2">
                    <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
                      <p className="font-semibold text-slate-600">Rechtsgrundlage</p>
                      <p className="text-slate-500">{v.rechtsgrundlage}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-xs space-y-1">
                      <p className="font-semibold text-blue-700">Empfohlene Maßnahme</p>
                      <p className="text-blue-600">{v.massnahme}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Reifegrad */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Drei Compliance-Reifegrade</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              nr: 1, title: 'Mindest-Compliance', motto: '„Wir tun, was wir müssen."',
              points: ['Gesetzliche Pflichten — nicht mehr', 'Problem: Gesetzgebung hinkt der Technik hinterher'],
              color: 'border-slate-300 bg-slate-50', titleCls: 'text-slate-700',
            },
            {
              nr: 2, title: 'Risikobasiert', motto: '„Wir steuern nach Risiko."',
              points: ['Proportional zum tatsächlichen Risiko — skalierbar', 'Risikobewertung pro KI-System, definierte Schwellwerte'],
              color: 'border-orange-400 bg-orange-50', titleCls: 'text-orange-700',
            },
            {
              nr: 3, title: 'Vorbild', motto: '„Wir sind die, an denen sich andere orientieren."',
              points: ['ISO 42001-Zertifizierung angestrebt, schriftliche KI-Politik', 'Awareness-Schulungen, aktive Außenkommunikation'],
              color: 'border-slate-400 bg-slate-50', titleCls: 'text-slate-800',
            },
          ].map((r) => (
            <div key={r.nr} className={`border-2 rounded-xl p-4 ${r.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#c85a1a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{r.nr}</span>
                <p className={`text-sm font-bold ${r.titleCls}`}>{r.title}</p>
              </div>
              <p className="text-xs italic text-slate-500 mb-3">{r.motto}</p>
              <ul className="space-y-1">
                {r.points.map((p, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-1.5"><span className="text-[#c85a1a] flex-shrink-0">→</span>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3 italic">Reifegrade sind nicht hierarchisch: Eine Mindest-Compliance kann genau das Richtige für die Organisation sein.</p>
      </div>
    </div>
  )
}

// ─── Risiko Tab ───────────────────────────────────────────────────────────────

type RisikoArt = 'Bias' | 'Technischer Fehler' | 'Ethisches Risiko' | 'Sicherheitsrisiko'
type RpzStatus = 'low' | 'medium' | 'high'

interface RisikoEntry {
  id: string
  beschreibung: string
  art: RisikoArt
  b: number
  a: number
  e: number
  auto?: boolean  // true = automatisch abgeleitet
}

const RPZ_STATUS = (rpz: number): RpzStatus => rpz < 50 ? 'low' : rpz <= 125 ? 'medium' : 'high'

const RISIKOART_CFG: Record<RisikoArt, { cls: string; dot: string }> = {
  'Bias':               { cls: 'bg-amber-100 text-amber-700 border-amber-300',   dot: 'bg-amber-400'  },
  'Technischer Fehler': { cls: 'bg-blue-100 text-blue-700 border-blue-300',      dot: 'bg-blue-400'   },
  'Ethisches Risiko':   { cls: 'bg-violet-100 text-violet-700 border-violet-300',dot: 'bg-violet-400' },
  'Sicherheitsrisiko':  { cls: 'bg-red-100 text-red-700 border-red-300',         dot: 'bg-red-400'    },
}

const DEMO_RISIKEN: RisikoEntry[] = [
  { id: 'r1', beschreibung: 'Automation Bias – Radiologin verlässt sich blind auf KI, übersieht Randbefund', art: 'Ethisches Risiko',   b: 8, a: 7, e: 8 },
  { id: 'r2', beschreibung: 'Doom-Loop-Bias – Trainingsdaten aus Covid-Krisenphase verzerren Normalverteilung', art: 'Bias',           b: 7, a: 6, e: 7 },
  { id: 'r3', beschreibung: 'Modell-Drift – neue CT-Geräte mit höherer Auflösung, Modell auf alten Specs trainiert', art: 'Technischer Fehler', b: 6, a: 5, e: 6 },
  { id: 'r4', beschreibung: 'Supply Chain – Schnittstelle zu indischem Datenlieferanten als externer Abhängigkeit', art: 'Sicherheitsrisiko', b: 7, a: 4, e: 5 },
  { id: 'r5', beschreibung: 'Vendor Lock-in – Ausfall des KI-Anbieters legt Radiologie-Workflow für Wochen lahm', art: 'Sicherheitsrisiko', b: 9, a: 3, e: 4 },
]

const RISIKOARTEN_INFO: { art: RisikoArt; kern: string; beispiel: string }[] = [
  { art: 'Bias',               kern: 'Systematische Verzerrungen in Daten oder Modell, die zu ungerechten Ergebnissen führen', beispiel: 'Doom-Loop-Bias, Unterrepräsentation bestimmter Gruppen, Anwendungs-Bias' },
  { art: 'Technischer Fehler', kern: 'Modell-Drift, Out-of-Distribution-Eingaben, Halluzinationen, Hardware-Probleme', beispiel: 'Drift bei neuen CT-Geräten, OOD bei seltenen Erkrankungsbildern, Halluzinationen' },
  { art: 'Ethisches Risiko',   kern: 'Automation Bias, Verlust von Berufsidentität, Erklärbarkeit, Autonomieverlust', beispiel: 'Radiologen prüfen KI-Befunde nicht mehr, Black-Box ohne Begründung' },
  { art: 'Sicherheitsrisiko',  kern: 'Adversarial Attacks, Supply Chain, Data Poisoning, Prompt Injection', beispiel: 'Manipulierte Bildeingaben, Vendor Lock-in, vergiftete Trainingsdaten' },
]

const NIST_TRIAS = [
  { label: 'Harm to People',       desc: 'Individuum: Rechte, Gesundheit, wirtschaftliche Chancen. Gruppe: Diskriminierung. Gesellschaft: demokratische Teilhabe.' },
  { label: 'Harm to Organization', desc: 'Geschäftsbetrieb, Reputation, finanzielle Verluste, Sicherheitsverletzungen, Compliance-Strafen.' },
  { label: 'Harm to Ecosystem',    desc: 'Globales Finanzsystem, Lieferketten, vernetzte Systeme, natürliche Ressourcen, Umwelt.' },
]

const EMPTY_RISIKO: Omit<RisikoEntry, 'id'> = {
  beschreibung: '', art: 'Bias', b: 5, a: 5, e: 5,
}

function RpzBadge({ rpz }: { rpz: number }) {
  const status = RPZ_STATUS(rpz)
  const cfg = {
    low:    'bg-green-100 text-green-700 border-green-300',
    medium: 'bg-amber-100 text-amber-700 border-amber-300',
    high:   'bg-red-100 text-red-700 border-red-300',
  }[status]
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-bold ${cfg}`}>RPZ {rpz}</span>
  )
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const color = value <= 3 ? 'accent-green-500' : value <= 6 ? 'accent-amber-500' : 'accent-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span className="font-mono font-bold">{label}</span>
        <span className="font-bold text-slate-700">{value}</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1.5 rounded-full ${color}`} />
    </div>
  )
}

function RisikoUebersicht({ useCases, isDemo }: { useCases: AIUseCase[]; isDemo: boolean }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [customRisiken, setCustomRisiken] = useState<Record<string, RisikoEntry[]>>({})
  const [addingFor, setAddingFor] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<RisikoEntry, 'id' | 'auto'>>(EMPTY_RISIKO)

  const addCustom = (ucId: string) => {
    if (!form.beschreibung.trim()) return
    const entry: RisikoEntry = { ...form, id: `m-${ucId}-${Date.now()}`, auto: false }
    setCustomRisiken((p) => ({ ...p, [ucId]: [...(p[ucId] ?? []), entry] }))
    setForm(EMPTY_RISIKO)
    setAddingFor(null)
  }

  const removeCustom = (ucId: string, id: string) =>
    setCustomRisiken((p) => ({ ...p, [ucId]: (p[ucId] ?? []).filter((r) => r.id !== id) }))

  const ucRisiken = useCases.map((uc) => {
    const derived = deriveRisiken(uc)
    const custom = customRisiken[uc.id] ?? []
    const risks = [...derived, ...custom]
    const maxRpz = risks.length ? Math.max(...risks.map((r) => r.b * r.a * r.e)) : 0
    const highCount = risks.filter((r) => RPZ_STATUS(r.b * r.a * r.e) === 'high').length
    return { uc, risks, maxRpz, highCount }
  }).sort((a, b) => b.maxRpz - a.maxRpz)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-5">
        <h2 className="text-base font-bold text-slate-800 mb-1">Risikoübersicht · alle Use Cases</h2>
        <p className="text-xs text-slate-400 mb-2">Automatisch abgeleitet aus EU AI Act Einstufung + Compliance-Lücken</p>
        <div className="flex flex-wrap gap-4 text-xs text-slate-600">
          <span><span className="font-mono font-bold text-slate-800">RPZ</span> = Risiko-Prioritäts-Zahl (1–1000)</span>
          <span><span className="font-mono font-bold text-slate-800">B</span> = Bedeutung / Schadensschwere (1–10)</span>
          <span><span className="font-mono font-bold text-slate-800">A</span> = Auftreten / Eintrittswahrscheinlichkeit (1–10)</span>
          <span><span className="font-mono font-bold text-slate-800">E</span> = Entdeckung — wie schwer ist der Fehler zu bemerken? (1=leicht, 10=kaum erkennbar)</span>
        </div>
        <div className="mt-3 flex gap-3 text-xs flex-wrap">
          <span className="px-2 py-1 rounded bg-green-50 border border-green-200 text-green-700">RPZ &lt; 50 = akzeptabel</span>
          <span className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700">50–125 = prüfen</span>
          <span className="px-2 py-1 rounded bg-red-50 border border-red-200 text-red-700">&gt; 125 = Maßnahmen erforderlich</span>
        </div>
      </div>

      {ucRisiken.map(({ uc, risks, maxRpz, highCount }) => {
        const isOpen = expandedId === uc.id
        const status = RPZ_STATUS(maxRpz)
        const borderCls = status === 'high' ? 'border-red-400' : status === 'medium' ? 'border-amber-400' : 'border-green-400'
        const sorted = [...risks].sort((a, b) => (b.b * b.a * b.e) - (a.b * a.a * a.e))

        return (
          <div key={uc.id} className={`bg-white rounded-xl shadow-md border-l-4 ${borderCls} overflow-hidden`}>
            <button
              className="w-full text-left p-4"
              onClick={() => setExpandedId(isOpen ? null : uc.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800 truncate">{uc.title}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{uc.department}</span>
                    {uc.euAiActRisk && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${EU_AI_ACT_BG[uc.euAiActRisk]}`}>{uc.euAiActRisk}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 items-center">
                  <div className="text-center">
                    <RpzBadge rpz={maxRpz} />
                    <p className="text-xs text-slate-400 mt-0.5">max RPZ</p>
                  </div>
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
                        <th className="text-left px-3 py-2 font-mono text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Risikoart</th>
                        <th className="text-center px-2 py-2 font-mono text-slate-400 uppercase tracking-wider text-[10px]">B</th>
                        <th className="text-center px-2 py-2 font-mono text-slate-400 uppercase tracking-wider text-[10px]">A</th>
                        <th className="text-center px-2 py-2 font-mono text-slate-400 uppercase tracking-wider text-[10px]">E</th>
                        <th className="text-center px-3 py-2 font-mono text-slate-400 uppercase tracking-wider text-[10px]">RPZ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sorted.map((r) => {
                        const rpz = r.b * r.a * r.e
                        const s = RPZ_STATUS(rpz)
                        const rpzCls = s === 'high' ? 'text-red-700 font-bold' : s === 'medium' ? 'text-amber-700 font-semibold' : 'text-green-700'
                        return (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 text-slate-700 leading-snug max-w-xs">{r.beschreibung}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${RISIKOART_CFG[r.art].cls}`}>{r.art}</span>
                            </td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-600">{r.b}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-600">{r.a}</td>
                            <td className="px-2 py-2.5 text-center font-mono text-slate-600">{r.e}</td>
                            <td className={`px-3 py-2.5 text-center font-mono ${rpzCls}`}>
                              {r.b}×{r.a}×{r.e}={rpz}
                            </td>
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
                        <textarea
                          rows={2}
                          value={form.beschreibung}
                          onChange={(e) => setForm((p) => ({ ...p, beschreibung: e.target.value }))}
                          placeholder="Risikobeschreibung…"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2 flex-wrap items-center">
                          <select
                            value={form.art}
                            onChange={(e) => setForm((p) => ({ ...p, art: e.target.value as RisikoArt }))}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                          >
                            {(['Bias', 'Technischer Fehler', 'Ethisches Risiko', 'Sicherheitsrisiko'] as RisikoArt[]).map((a) => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                          {(['b', 'a', 'e'] as const).map((dim) => (
                            <label key={dim} className="flex items-center gap-1 text-xs text-slate-500">
                              <span className="font-mono font-bold uppercase">{dim}</span>
                              <input
                                type="number" min={1} max={10} value={form[dim]}
                                onChange={(e) => setForm((p) => ({ ...p, [dim]: Number(e.target.value) }))}
                                className="w-12 border border-slate-200 rounded px-1.5 py-1 text-xs text-center bg-white"
                              />
                            </label>
                          ))}
                          <span className="text-xs font-mono text-slate-600">
                            RPZ = <RpzBadge rpz={form.b * form.a * form.e} />
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setAddingFor(null); setForm(EMPTY_RISIKO) }} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500">Abbrechen</button>
                          <button onClick={() => addCustom(uc.id)} disabled={!form.beschreibung.trim()} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium">Speichern</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingFor(uc.id); setForm(EMPTY_RISIKO) }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        + Risiko manuell hinzufügen
                      </button>
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

function deriveRisiken(uc: AIUseCase): RisikoEntry[] {
  const euRisk = uc.euAiActRisk
  const bBase = euRisk === 'Unacceptable Risk' ? 10 : euRisk === 'High Risk' ? 8 : euRisk === 'Limited Risk' ? 5 : 3
  const risks: RisikoEntry[] = []
  let idx = 0
  const add = (r: Omit<RisikoEntry, 'id' | 'auto'>) =>
    risks.push({ ...r, id: `auto-${uc.id}-${idx++}`, auto: true })

  // Always: risk based on EU AI Act level
  add({
    beschreibung: `KI-Risikoeinstufung "${euRisk ?? 'Minimal Risk'}" nach EU AI Act – Schadenspotenzial entsprechend hoch`,
    art: 'Ethisches Risiko',
    b: bBase, a: bBase >= 8 ? 6 : 4, e: bBase >= 8 ? 7 : 4,
  })

  // High risk: always add Automation Bias
  if (bBase >= 7) {
    add({
      beschreibung: 'Automation Bias – Nutzer verlassen sich blind auf KI-Ausgaben, Eigenprüfung sinkt mit steigender Trefferquote',
      art: 'Ethisches Risiko',
      b: bBase, a: 6, e: 8,
    })
    add({
      beschreibung: 'Modell-Drift – reale Datenverteilung entfernt sich schleichend von Trainingsdaten, Leistungsverlust bleibt unbemerkt',
      art: 'Technischer Fehler',
      b: bBase - 1, a: 5, e: 7,
    })
  }

  // Compliance gaps → concrete risks
  if (!uc.complianceLegal) {
    add({ beschreibung: 'Keine Rechtsgrundlage dokumentiert – Einsatz ohne DSGVO/KI-VO-Grundlage', art: 'Ethisches Risiko', b: 7, a: 6, e: 4 })
  }
  if (!uc.compliancePersonalData) {
    add({ beschreibung: 'Personendaten nicht dokumentiert – fehlende DSGVO Art. 30 Verzeichnis-Pflicht', art: 'Bias', b: 6, a: 5, e: 5 })
  }
  if (!uc.complianceDataMin) {
    add({ beschreibung: 'Datensparsamkeit nicht sichergestellt – mehr Daten als nötig verarbeitet (DSGVO Art. 5)', art: 'Bias', b: 5, a: 6, e: 5 })
  }
  if (!uc.complianceDocumentation) {
    add({ beschreibung: 'Dokumentationspflichten unerfüllt – kein Nachweis für Audit und Aufsicht', art: 'Ethisches Risiko', b: 6, a: 7, e: 3 })
  }
  if (!uc.complianceLiability) {
    add({ beschreibung: 'Verantwortlichkeit nicht definiert – bei Schaden ist unklar, wer haftet', art: 'Sicherheitsrisiko', b: 7, a: 5, e: 4 })
  }

  // Vendor/supply chain risk always present
  add({
    beschreibung: 'Vendor Lock-in / Abhängigkeit vom KI-Anbieter – Ausfall legt Betrieb still',
    art: 'Sicherheitsrisiko',
    b: 7, a: 3, e: 4,
  })

  return risks
}

function RisikoTab({ isDemo }: { isDemo: boolean }) {
  const { useCases } = useUseCasesStore()
  const [selectedUcId, setSelectedUcId] = useState<string>('')
  const [risiken, setRisiken] = useState<RisikoEntry[]>(isDemo ? DEMO_RISIKEN : [])
  const [form, setForm] = useState<Omit<RisikoEntry, 'id' | 'auto'>>(EMPTY_RISIKO)
  const [showForm, setShowForm] = useState(false)
  const [sortBy, setSortBy] = useState<'rpz' | 'art'>('rpz')

  const selectedUc = useCases.find((uc) => uc.id === selectedUcId)

  const applyUcRisiken = () => {
    if (!selectedUc) return
    const derived = deriveRisiken(selectedUc)
    setRisiken(derived)
  }

  const addRisiko = () => {
    if (!form.beschreibung.trim()) return
    setRisiken((p) => [...p, { ...form, id: `r${Date.now()}`, auto: false }])
    setForm(EMPTY_RISIKO)
    setShowForm(false)
  }

  const removeRisiko = (id: string) => setRisiken((p) => p.filter((r) => r.id !== id))

  const sorted = [...risiken].sort((a, b) => {
    if (sortBy === 'rpz') return (b.b * b.a * b.e) - (a.b * a.a * a.e)
    return a.art.localeCompare(b.art)
  })

  const highCount = risiken.filter((r) => RPZ_STATUS(r.b * r.a * r.e) === 'high').length

  return <RisikoUebersicht useCases={useCases} isDemo={isDemo} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-slate-800">Risikoregister · KI-Risikomanagement</h2>
            <p className="text-xs text-slate-400 mt-0.5">KI-VO Art. 9 · ISO/IEC 23894 · NIST AI RMF — Dreiklang B × A × E</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="text-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              <p className="text-lg font-bold text-slate-800">{risiken.length}</p>
              <p className="text-xs text-slate-400">Risiken</p>
            </div>
            <div className="text-center bg-red-50 rounded-lg px-3 py-2 border border-red-200">
              <p className="text-lg font-bold text-red-700">{highCount}</p>
              <p className="text-xs text-red-400">Eingriff nötig</p>
            </div>
          </div>
        </div>

        {/* Use Case selector */}
        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-slate-400 mb-1">Use Case auswählen → Risiken automatisch ableiten</label>
            <select
              value={selectedUcId}
              onChange={(e) => setSelectedUcId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Use Case wählen —</option>
              {useCases.map((uc) => (
                <option key={uc.id} value={uc.id}>{uc.title || uc.id}</option>
              ))}
            </select>
          </div>
          <button
            onClick={applyUcRisiken}
            disabled={!selectedUcId}
            className="text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            B×A×E ableiten
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Dreiklang: </span>
          <span className="font-mono font-bold text-slate-800">RPZ = B × A × E</span>
          {' '}— B = Bedeutung/Schadensschwere · A = Auftreten/Wahrscheinlichkeit · E = Entdeckung (hoch = schlecht!)
          {' · '}Skala 1–10, RPZ-Bereich 1–1000.
          {' '}Faustregel: <span className="text-green-600 font-semibold">RPZ &lt;50 = akzeptabel</span>
          {' · '}<span className="text-amber-600 font-semibold">50–125 = prüfen</span>
          {' · '}<span className="text-red-600 font-semibold">&gt;125 = Maßnahmen erforderlich</span>
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
        <p className="text-xs text-slate-400 mt-2 italic">Bei jeder Risikoidentifikation alle drei Sphären durchgehen — nicht nur den direkten Schaden.</p>
      </div>

      {/* 4 Risikoarten */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Vier KI-Risikoarten · breiter Risikobegriff</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RISIKOARTEN_INFO.map((r) => (
            <div key={r.art} className={`rounded-lg border p-3 ${RISIKOART_CFG[r.art].cls}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${RISIKOART_CFG[r.art].dot}`} />
                <p className="text-xs font-bold">{r.art}</p>
              </div>
              <p className="text-xs leading-relaxed opacity-80">{r.kern}</p>
              <p className="text-xs text-slate-500 mt-1 italic">{r.beispiel}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Register */}
      <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Risikoregister</p>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rpz' | 'art')}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600"
            >
              <option value="rpz">Sortierung: RPZ ↓</option>
              <option value="art">Sortierung: Risikoart</option>
            </select>
            <button
              onClick={() => setShowForm((p) => !p)}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              + Risiko erfassen
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-4">
            <p className="text-xs font-semibold text-blue-700">Neues Risiko</p>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Risikobeschreibung</label>
              <textarea
                rows={2}
                value={form.beschreibung}
                onChange={(e) => setForm((p) => ({ ...p, beschreibung: e.target.value }))}
                placeholder="Was könnte schiefgehen? Kontext und betroffenes System angeben."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Risikoart</label>
              <select
                value={form.art}
                onChange={(e) => setForm((p) => ({ ...p, art: e.target.value as RisikoArt }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(['Bias', 'Technischer Fehler', 'Ethisches Risiko', 'Sicherheitsrisiko'] as RisikoArt[]).map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <Slider label="B · Bedeutung / Schadensschwere" value={form.b} onChange={(v) => setForm((p) => ({ ...p, b: v }))} />
              <Slider label="A · Auftreten / Wahrscheinlichkeit" value={form.a} onChange={(v) => setForm((p) => ({ ...p, a: v }))} />
              <Slider label="E · Entdeckung (10 = sehr schwer zu entdecken)" value={form.e} onChange={(v) => setForm((p) => ({ ...p, e: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-slate-500 text-xs">RPZ = {form.b} × {form.a} × {form.e} = </span>
                <RpzBadge rpz={form.b * form.a * form.e} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 bg-white">Abbrechen</button>
                <button onClick={addRisiko} disabled={!form.beschreibung.trim()} className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg font-medium">Speichern</button>
              </div>
            </div>
          </div>
        )}

        {/* Risk list */}
        {sorted.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-sm">Noch keine Risiken erfasst.</p>
            <p className="text-xs mt-1">Klicke „+ Risiko erfassen" um zu beginnen.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((r) => {
              const rpz = r.b * r.a * r.e
              const status = RPZ_STATUS(rpz)
              const borderCls = status === 'high' ? 'border-red-300' : status === 'medium' ? 'border-amber-300' : 'border-green-300'
              return (
                <div key={r.id} className={`border-l-4 ${borderCls} bg-white rounded-r-xl shadow-sm border border-l-4 p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${RISIKOART_CFG[r.art].cls}`}>{r.art}</span>
                        <RpzBadge rpz={rpz} />
                        {r.auto && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200">auto</span>}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{r.beschreibung}</p>
                      <div className="flex gap-3 mt-2 text-xs text-slate-400 font-mono">
                        <span>B={r.b}</span>
                        <span>A={r.a}</span>
                        <span>E={r.e}</span>
                        <span className="text-slate-600 font-bold">= {rpz}</span>
                        {r.b >= 9 && <span className="text-red-500 font-bold">⚠ B≥9: immer prüfen!</span>}
                      </div>
                    </div>
                    <button onClick={() => removeRisiko(r.id)} className="text-slate-300 hover:text-red-400 text-xs flex-shrink-0 transition-colors">✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {risiken.length > 0 && (
          <p className="text-xs text-slate-400 italic">
            Risiken mit RPZ &gt; 125 erfordern Maßnahmen (Tag 10). Bei B = 10 immer prüfen — unabhängig von RPZ.
          </p>
        )}
      </div>
    </div>
  )
}
