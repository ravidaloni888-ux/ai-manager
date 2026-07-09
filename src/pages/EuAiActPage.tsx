import { useState } from 'react'

// ── Data ───────────────────────────────────────────────────────────────────

const TIMELINE = [
  { date: '1 Aug 2024', label: 'AI Act enters into force', highlight: false },
  { date: '2 Feb 2025', label: 'Prohibitions (Art. 5) + AI literacy duty (Art. 4) — applies now', highlight: true },
  { date: '2 Aug 2025', label: 'GPAI models (Chapter V)', highlight: false },
  { date: '16/29 Jun 2026', label: 'Digital Omnibus: EP vote (423) + Council — only Official Journal pending (before 2.8.2026)', highlight: true },
  { date: '2 Dec 2027', label: 'High-risk AI (Annex III) — delayed by Digital Omnibus', highlight: false },
  { date: '2 Aug 2028', label: 'Full application + product-integrated AI (Annex I)', highlight: true },
]

const RISK_CLASSES = [
  {
    level: 1,
    name: 'Unacceptable Risk',
    color: 'bg-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    summary: 'Prohibited practices — banned outright since 2 Feb 2025',
    duties: 'Deployment and placing on the market are prohibited. Violations: fines up to €35M or 7% of global annual turnover.',
    examples: [
      'Subliminal manipulation (AI influencing behaviour undetected)',
      'Social scoring by public authorities',
      'Real-time biometric remote identification in public spaces (with narrow exceptions)',
      'Predictive policing based solely on personal characteristics',
      'Emotion recognition at the workplace and in educational institutions',
    ],
  },
  {
    level: 2,
    name: 'High Risk',
    color: 'bg-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
    summary: 'Strict requirements for sensitive application areas (Art. 6–49)',
    duties: 'Risk management, data quality, technical documentation, transparency, human oversight, accuracy & robustness, conformity assessment before market placement.',
    examples: [
      'AI in medical devices',
      'Biometric identification systems',
      'Critical infrastructure',
      'Education & vocational training',
      'Employment & HR management',
      'Access to essential services',
      'Law enforcement, migration & asylum, justice',
    ],
  },
  {
    level: 3,
    name: 'Limited Risk',
    color: 'bg-amber-400',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    summary: 'Transparency obligations for specific AI systems (Art. 50–51)',
    duties: 'Users must be informed they are interacting with AI or that content is AI-generated. No further specific compliance requirements.',
    examples: [
      'Chatbots (must disclose they are AI)',
      'AI-generated content / deepfakes',
      'Emotion recognition systems (if not prohibited)',
    ],
  },
  {
    level: 4,
    name: 'Minimal Risk',
    color: 'bg-green-500',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
    summary: 'Free use — no specific AI Act requirements',
    duties: 'No specific obligations under the AI Act. General legal requirements still apply.',
    examples: [
      'Spam filters',
      'AI in video games',
      'Content recommendation systems',
      'Simple automation tools',
    ],
  },
]

const ACTOR_ROLES = [
  {
    role: 'Provider (Anbieter)',
    art: 'Art. 3 Nr. 3',
    definition: 'Develops and places an AI system on the market',
    example: 'The software company that built the base system',
    duties: 'Full Art. 16 obligations for high-risk AI: documentation, conformity assessment, CE marking, registration, post-market monitoring.',
  },
  {
    role: 'Deployer (Betreiber)',
    art: 'Art. 3 Nr. 4',
    definition: 'Uses a third-party AI system under their own responsibility',
    example: 'Dr. Seika — as long as the system remains unchanged. Private, non-professional use is explicitly excluded.',
    duties: 'Art. 26 obligations: ensure intended use, appoint and train responsible persons (Art. 4), ensure human oversight (Art. 14), monitor input data, report incidents to provider.',
  },
  {
    role: 'Importer',
    art: 'Art. 3 Nr. 6',
    definition: 'Brings AI from a third country into the EU',
    example: 'EU subsidiary ("authorised representative") of a US or Chinese company',
    duties: 'Verify that the provider has fulfilled Art. 16 obligations before placing on the EU market.',
  },
  {
    role: 'Distributor (Händler)',
    art: 'Art. 3 Nr. 7',
    definition: 'Makes AI available in the supply chain without modification',
    example: 'Reseller distributing software licences (not established in the EU)',
    duties: 'Verify CE marking and documentation; do not place on market if requirements are not met.',
  },
]

const ART25_TRIGGERS = [
  {
    id: 'modification',
    title: 'Substantial modification',
    desc: 'A high-risk AI system is substantially modified (e.g. retrained with own data) — Art. 25(1)(b)',
  },
  {
    id: 'purpose',
    title: 'Change of intended purpose',
    desc: 'A system is deployed for a materially different purpose than the provider intended',
  },
  {
    id: 'own_brand',
    title: 'Own-brand marketing',
    desc: 'A system is placed on the market under the deployer\'s own name or trademark — unambiguous, no grey area',
  },
]

const COPYRIGHT_RULES = [
  {
    scenario: 'Purely AI-generated',
    protection: 'None',
    color: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
    detail: 'No human creative input → no copyright under §2 UrhG. Only "personal intellectual creations" are protected.',
  },
  {
    scenario: 'Human + AI',
    protection: 'Depends on human input',
    color: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    detail: 'Prompt, selection, editing → the higher the human contribution, the more likely copyright protection exists.',
  },
  {
    scenario: 'AI as tool',
    protection: 'Full protection',
    color: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
    detail: 'AI used as a tool only, human creates the work → protected like any traditional creation.',
  },
]

const LIABILITY_TABLE = [
  { situation: 'AI error due to design defect', liable: 'Provider (Anbieter)' },
  { situation: 'Misuse by deployer', liable: 'Deployer (Betreiber)' },
  { situation: 'Project manager does not review AI output', liable: 'Project manager + firm' },
  { situation: 'All three combined', liable: 'Joint and several liability' },
]

// ── Components ─────────────────────────────────────────────────────────────

function RiskClassCard({ rc, expanded, onToggle }: {
  rc: typeof RISK_CLASSES[0]
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className={`rounded-xl border ${rc.border} overflow-hidden`}>
      <button onClick={onToggle} className={`w-full flex items-center gap-4 px-5 py-4 ${rc.bg} hover:opacity-90 transition-opacity text-left`}>
        <span className={`w-8 h-8 rounded-full ${rc.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {rc.level}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-bold ${rc.text}`}>{rc.name}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rc.badge}`}>{rc.level === 1 ? 'BANNED' : rc.level === 2 ? 'STRICT' : rc.level === 3 ? 'TRANSPARENCY' : 'FREE'}</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">{rc.summary}</p>
        </div>
        <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && (
        <div className="px-5 py-4 bg-white space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Obligations</p>
            <p className="text-xs text-slate-600 leading-relaxed">{rc.duties}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Examples</p>
            <ul className="space-y-1">
              {rc.examples.map((e) => (
                <li key={e} className="flex items-start gap-2">
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${rc.color}`} />
                  <span className="text-xs text-slate-600">{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function Art25Checker() {
  const [triggered, setTriggered] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setTriggered((p) => ({ ...p, [id]: !p[id] }))
  const activeCount = ART25_TRIGGERS.filter((t) => triggered[t.id]).length
  const isProvider = activeCount > 0

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-800">Art. 25 — Provider Role Transition Check</p>
        <p className="text-xs text-slate-500 mt-0.5">When does a deployer become a provider (with full Art. 16 obligations)?</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        {ART25_TRIGGERS.map((t) => (
          <label key={t.id} onClick={() => toggle(t.id)} className="flex items-start gap-3 cursor-pointer group hover:bg-slate-50 -mx-5 px-5 py-2 rounded transition-colors">
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${triggered[t.id] ? 'bg-orange-500 border-orange-500' : 'border-slate-300 group-hover:border-orange-400'}`}>
              {triggered[t.id] && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">{t.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
            </div>
          </label>
        ))}
      </div>
      {activeCount > 0 && (
        <div className="mx-5 mb-5 px-4 py-3 rounded-lg bg-orange-50 border border-orange-200">
          <p className="text-sm font-semibold text-orange-700">⚠ Role transition — you are now a Provider</p>
          <p className="text-xs text-orange-600 mt-1">All Art. 16 provider obligations apply. This includes documentation, conformity assessment, CE marking, and registration in the EU database. Consult a specialist lawyer (Decision Model Level 3).</p>
        </div>
      )}
      {activeCount === 0 && (
        <div className="mx-5 mb-5 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500">Select any trigger above to check whether a role transition applies.</p>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EuAiActPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'copyright' | 'liability'>('overview')
  const [expandedRisk, setExpandedRisk] = useState<number | null>(null)

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'overview', label: 'Risk Classes & Timeline' },
    { id: 'roles', label: 'Actor Roles' },
    { id: 'copyright', label: 'Copyright' },
    { id: 'liability', label: 'Liability' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">EU AI Act</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Risk-based product regulation for AI systems — structure, actor roles, copyright and liability
        </p>
      </div>

      {/* Key facts */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: '4', label: 'Risk classes', sub: 'Unacceptable · High · Limited · Minimal' },
          { value: 'Feb 25', label: 'Already in force', sub: 'Art. 5 (prohibitions) + Art. 4 (AI literacy)' },
          { value: '≠', label: 'AI Act ≠ GDPR', sub: 'Applies regardless of personal data processing' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-2xl font-bold text-slate-800">{m.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{m.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Important banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3">
        <p className="text-xs text-red-700 leading-relaxed">
          <span className="font-semibold">Important:</span> Many organisations believe the AI Act does not yet apply. Art. 5 and Art. 4 have been fully in force since February 2025 — without any transition period. A system that processes no personal data is still covered by the AI Act.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Structure */}
          <div className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-sm font-semibold text-slate-800 mb-3">AI Act Logic: Prohibited → High-risk → Transparency → GPAI → Sanctions</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 pr-4 font-semibold text-slate-600 whitespace-nowrap">Chapter</th>
                    <th className="text-left py-2 font-semibold text-slate-600">Content</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { ch: 'Art. 5', c: 'Prohibited practices' },
                    { ch: 'Art. 6–49', c: 'High-risk AI — the core of the regulation' },
                    { ch: 'Art. 50–51', c: 'Transparency obligations' },
                    { ch: 'Art. 52–56', c: 'GPAI models / Foundation models' },
                    { ch: 'Art. 99–101', c: 'Sanctions up to €35M or 7% turnover' },
                  ].map((r) => (
                    <tr key={r.ch}>
                      <td className="py-2 pr-4 font-mono text-slate-500 whitespace-nowrap">{r.ch}</td>
                      <td className="py-2 text-slate-600">{r.c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Timeline — what applies when?</p>
            </div>
            <div className="divide-y divide-slate-50">
              {TIMELINE.map((item) => (
                <div key={item.date} className={`flex items-start gap-4 px-5 py-3 ${item.highlight ? 'bg-blue-50' : ''}`}>
                  <span className="text-xs font-mono text-slate-500 whitespace-nowrap mt-0.5 min-w-[90px]">{item.date}</span>
                  <p className={`text-xs leading-relaxed ${item.highlight ? 'font-semibold text-blue-700' : 'text-slate-600'}`}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk classes — simple overview grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                num: '1', name: 'Unacceptable Risk', color: 'bg-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700',
                plain: 'Banned. These AI systems are not allowed at all.',
                law: 'Art. 5 · in force Feb 2025',
                penalty: 'Up to €35M or 7% turnover',
                examples: ['Social scoring', 'Subliminal manipulation', 'Real-time biometric ID in public'],
              },
              {
                num: '2', name: 'High Risk', color: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700',
                plain: 'Allowed — but only with strict documentation, oversight and conformity checks before going live.',
                law: 'Art. 6–49 + Annex III · Dec 2027',
                penalty: 'Non-compliance = no market access',
                examples: ['HR & recruitment AI', 'Credit scoring', 'AI in education', 'Medical AI'],
              },
              {
                num: '3', name: 'Limited Risk', color: 'bg-amber-400', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
                plain: 'Allowed — but users must be told they are interacting with AI.',
                law: 'Art. 50 · in force Aug 2026',
                penalty: 'Fine for missing disclosure',
                examples: ['Chatbots', 'AI-generated images/text', 'Deepfakes'],
              },
              {
                num: '4', name: 'Minimal Risk', color: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700',
                plain: 'Freely usable. No specific AI Act requirements.',
                law: 'No specific obligations',
                penalty: 'None under AI Act',
                examples: ['Spam filters', 'Recommendation engines', 'AI in games'],
              },
            ].map((rc) => (
              <div key={rc.num} className={`rounded-xl border ${rc.border} ${rc.bg} p-4 flex flex-col gap-2`}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full ${rc.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{rc.num}</span>
                  <p className={`text-sm font-bold ${rc.text}`}>{rc.name}</p>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{rc.plain}</p>
                <p className="text-[10px] text-slate-500 font-mono">{rc.law}</p>
                <ul className="space-y-0.5 mt-1">
                  {rc.examples.map((e) => (
                    <li key={e} className="flex items-center gap-1.5">
                      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${rc.color}`} />
                      <span className="text-[11px] text-slate-600">{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Risk classes — detail cards */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Detailed view — click to expand</p>
            {RISK_CLASSES.map((rc) => (
              <RiskClassCard
                key={rc.level}
                rc={rc}
                expanded={expandedRisk === rc.level}
                onToggle={() => setExpandedRisk(expandedRisk === rc.level ? null : rc.level)}
              />
            ))}
          </div>

          {/* Key question */}
          <div className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-sm font-semibold text-slate-800 mb-2">The key question for every AI Officer</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">"Are we dealing with a high-risk AI system?"</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Read Art. 6 and Annex III. This is the critical breakpoint in AI management — for limited-risk systems the obligations are manageable (Art. 4 + Art. 50). For high-risk systems the compliance burden is substantial — CE marking, documentation, conformity assessment.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Roles */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">Key principle:</span> The role determines the obligations — not the system. The same AI system creates different obligation catalogues for providers and deployers.
            </p>
          </div>

          {ACTOR_ROLES.map((r) => (
            <div key={r.role} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded">{r.art}</span>
                <p className="text-sm font-semibold text-slate-800">{r.role}</p>
              </div>
              <div className="px-5 py-4 space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-700">Definition:</span> {r.definition}</p>
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-700">Example:</span> {r.example}</p>
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-700">Obligations:</span> {r.duties}</p>
              </div>
            </div>
          ))}

          <Art25Checker />
        </div>
      )}

      {/* Tab: Copyright */}
      {activeTab === 'copyright' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">§44b UrhG — Can AI be trained on copyrighted material?</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                §44b UrhG permits Text and Data Mining (TDM) "to extract information, in particular about patterns, trends and correlations" — unless rights holders have declared a usage reservation (opt-out).
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-400 px-4 py-3 rounded-r-lg">
                <p className="text-xs text-amber-700 leading-relaxed"><span className="font-semibold">Opt-out must be machine-readable:</span> robots.txt, TDM Reservation Protocol or IPTC/XMP metadata. A statement in Terms & Conditions or an imprint is not sufficient (OLG Hamburg, Dec. 2025).</p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-400 px-4 py-3 rounded-r-lg">
                <p className="text-xs text-red-700 leading-relaxed"><span className="font-semibold">LG München I, Nov. 2025:</span> Permanent embedding of complete works in model parameters = reproduction — goes beyond the TDM exception.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Who owns AI-generated content? (§2 UrhG)</p>
              <p className="text-xs text-slate-500 mt-0.5">Only "personal intellectual creations" are protected under German copyright law</p>
            </div>
            <div className="divide-y divide-slate-50">
              {COPYRIGHT_RULES.map((r) => (
                <div key={r.scenario} className="px-5 py-4 flex items-start gap-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${r.badge}`}>{r.protection}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-0.5">{r.scenario}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Liability */}
      {activeTab === 'liability' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Product Liability for AI (ProdHaftG / EU Directive 2024/2853)</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                The Product Liability Act (ProdHaftG, 1989) makes manufacturers liable for defective <strong>products</strong> — without proof of fault. The problem: ProdHaftG was designed for physical products. Software — especially learning software — does not fit well.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">New EU Product Liability Directive 2024/2853</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Explicitly covers software (including AI systems) as a "product". Transposition deadline: <strong>9 December 2026</strong>.</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Continuous learning</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Manufacturers are also liable for defects arising from <strong>continuous learning</strong> after market placement.</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">AI Liability Directive — withdrawn</p>
                <p className="text-xs text-amber-600 leading-relaxed">The EU Commission drafted an AI Liability Directive (2022) with burden-of-proof reversal. It was officially withdrawn in <strong>February 2025</strong>. There is currently no specific AI liability framework at EU level.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Who is liable today?</p>
            </div>
            <div className="divide-y divide-slate-50">
              {LIABILITY_TABLE.map((row) => (
                <div key={row.situation} className="flex items-start gap-4 px-5 py-3">
                  <p className="flex-1 text-xs text-slate-600">{row.situation}</p>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">{row.liable}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-600">Note:</span> Liability questions are Decision Model Level 3 — always involve a specialist lawyer. This overview is for orientation only and does not constitute legal advice.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
