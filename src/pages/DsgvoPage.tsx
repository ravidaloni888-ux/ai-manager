import { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

type Stufe = 1 | 2 | 3 | null

interface Article {
  id: string
  tag: string
  title: string
  summary: string
  details: string
  example?: string
  warning?: string
}

// ── Data ───────────────────────────────────────────────────────────────────

const ARTICLES: Article[] = [
  {
    id: 'art3',
    tag: 'Art. 3',
    title: 'Market-place Principle — GDPR applies globally',
    summary: 'The GDPR applies to all organisations that actively offer goods or services to EU residents — regardless of where the organisation is based.',
    details: 'US and Asian AI vendors also fall under the GDPR if they deliberately target the EU market. The place of establishment is irrelevant; what matters is whether the processing is directed at people in the EU.',
    example: 'OpenAI is based in the US — the GDPR still applies because OpenAI actively targets the EU market.',
  },
  {
    id: 'art6',
    tag: 'Art. 6 + §26 BDSG',
    title: 'Legal basis for employee data',
    summary: 'Every data processing operation requires a legal basis. For employee data, §26 BDSG (German Employment Data Act) applies: processing is only lawful if it is necessary for the employment relationship — not merely useful.',
    details: 'Three relevant bases: Art. 6(1)(b) (contract performance) — project assignment is part of the employment relationship. Art. 6(1)(c) (legal obligation) — e.g. documentation required by working-time law. §26 BDSG (employee data) — the decisive standard: "necessary", not "useful".',
    warning: '"The system could be useful" is not enough. Processing must actually be necessary for carrying out the employment relationship.',
  },
  {
    id: 'art22',
    tag: 'Art. 22',
    title: 'Automated decisions — a human must genuinely decide',
    summary: '"No person shall be subject to a decision based solely on automated processing which produces legal effects concerning them or similarly significantly affects them."',
    details: 'The AI system may recommend — but the human must actually make the decision, not just formally rubber-stamp it. ECJ C-634/21 (SCHUFA ruling): even if a human formally decides, Art. 22 applies when a score materially pre-determines the outcome.',
    warning: 'Human-in-the-loop is not enough if the human merely adopts the system\'s decision "pro forma". The human must make a meaningful, independent judgment.',
    example: 'AI suggests a project assignment — the responsible manager must genuinely assess the fit, not just confirm the recommendation.',
  },
  {
    id: 'art28',
    tag: 'Art. 28',
    title: 'No DPA = unlawful processing',
    summary: 'If an AI system runs on an external vendor\'s servers and processes personal data, the entire processing operation is unlawful without a Data Processing Agreement (DPA).',
    details: 'This applies even to well-known vendors (Microsoft, Google, OpenAI) and even if the vendor "only stores" the data. A DPA does not transfer regulatory responsibility — it is a prerequisite for lawful processing. The operator always remains responsible.',
    warning: '"We use a reputable cloud service — the vendor is responsible." — Wrong. The operator is responsible for the processing. The DPA is a prerequisite, not a liability transfer.',
    example: 'External vendor + DPA in place = Lawful. External vendor + no DPA = Unlawful. Reputable vendor + no DPA = Still unlawful.',
  },
  {
    id: 'art35',
    tag: 'Art. 35',
    title: 'DPIA — assess first, deploy second',
    summary: 'A Data Protection Impact Assessment (DPIA) is mandatory when processing is likely to result in a high risk to the rights and freedoms of natural persons.',
    details: 'The DPIA must be completed BEFORE deployment — a retrospective DPIA does not fulfil its purpose. Triggers: employee data is systematically processed, AI-based profiling of persons takes place, or the system is newly deployed (not just a minor update).',
    example: 'Possible triggers: employee data processing · AI profiling · new system deployment.',
  },
  {
    id: 'par87',
    tag: '§87 BetrVG',
    title: 'Works council co-determination for AI in HR',
    summary: 'AI systems capable of monitoring the behaviour or performance of employees require works council co-determination — independently of the GDPR.',
    details: 'Where a works council exists: "Introduction and use of technical devices designed to monitor the behaviour or performance of employees" requires co-determination before deployment. This applies in parallel to the GDPR as independent employment law.',
    warning: 'GDPR compliance alone is not sufficient. Even if all GDPR requirements are met, works council approval is still required before deployment.',
  },
]

const DSFA_TRIGGERS = [
  { id: 'employees', label: 'Employee data is systematically processed', risk: true },
  { id: 'profiling', label: 'AI-based profiling of individuals takes place', risk: true },
  { id: 'new', label: 'The system is newly deployed (not a minor update)', risk: true },
  { id: 'decisions', label: 'The system makes or significantly influences decisions about individuals', risk: true },
  { id: 'sensitive', label: 'Special categories of data are processed (health, origin, etc.)', risk: true },
]

const DREISTUFENMODELL = [
  {
    stufe: 1 as Stufe,
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    title: 'AI Officer decides independently',
    merkmal: 'Reversible · clear sources · no personal harm',
    tasks: [
      { title: 'Classify risk level', desc: 'Use official resources (Bundesnetzagentur, EU checklists) to determine the risk category.' },
      { title: 'Check DPA obligation', desc: 'External processing + personal data = DPA required. This classification is clear and can be made independently.' },
      { title: 'Check Art. 50 EU AI Act', desc: 'Labelling obligation for chatbots — clearly regulated, no legal grey area.' },
      { title: 'Inventory AI systems', desc: 'Capture, classify and document all AI systems — core task of the AI Officer.' },
    ],
  },
  {
    stufe: 2 as Stufe,
    color: 'bg-amber-400',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    title: 'AI Officer flags — DPO/lawyer decides',
    merkmal: 'Legal grey area · significant consequences',
    tasks: [
      { title: 'Clarify provider/operator roles', desc: 'For in-house development or customisation — who is legally responsible?' },
      { title: 'High-risk borderline cases', desc: 'Classification unclear — Annex III criteria may be met.' },
      { title: 'Copyright of AI-generated content', desc: 'For commercial use of AI-generated outputs.' },
      { title: 'Negotiate DPA content', desc: 'Whether a DPA is needed: Level 1. What it should contain: Level 2.' },
    ],
  },
  {
    stufe: 3 as Stufe,
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Always DPO/lawyer — no exceptions',
    merkmal: 'Irreversible · personal consequences · unclear accountability',
    tasks: [
      { title: 'Art. 22 — Automated individual decisions', desc: 'Legal effect · significant impact · no room for self-determination.' },
      { title: 'Third-country transfer without legal basis', desc: 'Transfer of personal data to non-EU countries without a valid legal basis.' },
      { title: 'AI in HR context', desc: 'Recruitment screening · dismissal · performance evaluation.' },
      { title: 'Regulatory enquiries', desc: 'From Bundesnetzagentur or data protection authority — do not respond independently.' },
    ],
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: Article }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="flex-shrink-0 mt-0.5 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded whitespace-nowrap">
          {article.tag}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{article.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{article.summary}</p>
        </div>
        <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">{article.details}</p>
          {article.example && (
            <div className="bg-blue-50 border-l-4 border-blue-400 px-4 py-3 rounded-r-lg">
              <p className="text-xs text-blue-700 leading-relaxed"><span className="font-semibold">Example:</span> {article.example}</p>
            </div>
          )}
          {article.warning && (
            <div className="bg-amber-50 border-l-4 border-amber-400 px-4 py-3 rounded-r-lg">
              <p className="text-xs text-amber-700 leading-relaxed"><span className="font-semibold">Note:</span> {article.warning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DsfaChecker() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  const triggersActive = DSFA_TRIGGERS.filter((t) => checked[t.id]).length
  const required = triggersActive >= 1

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">DPIA Trigger Check (Art. 35)</p>
            <p className="text-xs text-slate-500">Check whether a Data Protection Impact Assessment is required</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        {DSFA_TRIGGERS.map((trigger) => (
          <label key={trigger.id} className="flex items-start gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
              checked[trigger.id] ? 'bg-purple-600 border-purple-600' : 'border-slate-300 group-hover:border-purple-400'
            }`} onClick={() => toggle(trigger.id)}>
              {checked[trigger.id] && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <span className="text-sm text-slate-700 leading-relaxed" onClick={() => toggle(trigger.id)}>{trigger.label}</span>
          </label>
        ))}
      </div>
      {triggersActive > 0 && (
        <div className={`mx-5 mb-5 px-4 py-3 rounded-lg ${required ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <p className={`text-sm font-semibold ${required ? 'text-red-700' : 'text-green-700'}`}>
            {required ? '⚠ DPIA required' : '✓ DPIA likely not required'}
          </p>
          <p className={`text-xs mt-1 leading-relaxed ${required ? 'text-red-600' : 'text-green-600'}`}>
            {required
              ? `${triggersActive} trigger${triggersActive > 1 ? 's' : ''} active. The DPIA must be completed BEFORE deployment. DPO involvement recommended (Decision Model Level 2).`
              : 'No triggers active. Note: a DPIA may still be required in scenarios not listed here.'}
          </p>
        </div>
      )}
    </div>
  )
}

function AvvChecker() {
  const [external, setExternal] = useState<boolean | null>(null)
  const [personalData, setPersonalData] = useState<boolean | null>(null)
  const [avvExists, setAvvExists] = useState<boolean | null>(null)

  const showAvvQuestion = external === true && personalData === true
  const result = showAvvQuestion && avvExists !== null
    ? avvExists
      ? { ok: true, text: 'Rechtmäßig. AVV vorhanden — Voraussetzung für die Verarbeitung ist erfüllt.' }
      : { ok: false, text: 'Rechtswidrig. Ohne AVV ist die gesamte Verarbeitung rechtswidrig — auch bei namhaften Anbietern.' }
    : external === false || personalData === false
      ? { ok: true, text: external === false ? 'No external vendor — no DPA required.' : 'No personal data processed — no DPA required.' }
      : null

  const reset = () => { setExternal(null); setPersonalData(null); setAvvExists(null) }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">DPA Obligation Check (Art. 28)</p>
            <p className="text-xs text-slate-500">Check whether a Data Processing Agreement is required</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        {/* Q1 */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Does the AI system run on an external vendor's servers?</p>
          <div className="flex gap-2">
            {([true, false] as const).map((v) => (
              <button key={String(v)} onClick={() => { setExternal(v); setPersonalData(null); setAvvExists(null) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${external === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                {v ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>

        {/* Q2 */}
        {external === true && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Does the processing involve personal data?</p>
            <div className="flex gap-2">
              {([true, false] as const).map((v) => (
                <button key={String(v)} onClick={() => { setPersonalData(v); setAvvExists(null) }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${personalData === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q3 */}
        {showAvvQuestion && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Is a Data Processing Agreement (DPA) in place with the vendor?</p>
            <div className="flex gap-2">
              {([true, false] as const).map((v) => (
                <button key={String(v)} onClick={() => setAvvExists(v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${avvExists === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className={`px-4 py-3 rounded-lg ${result.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm font-semibold ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
              {result.ok ? '✓' : '✗'} {result.text}
            </p>
            {!result.ok && (
              <p className="text-xs text-red-600 mt-1">→ Conclude a DPA with the vendor immediately or take the system offline until a DPA is in place.</p>
            )}
            <button onClick={reset} className="mt-2 text-xs text-slate-500 underline hover:text-slate-700">Check again</button>
          </div>
        )}
      </div>
    </div>
  )
}

const ART22_CHECKS = [
  'The human receives all relevant information — not just the AI output',
  'The human can genuinely override the AI recommendation (no social or technical pressure to conform)',
  'The human\'s decision is documented — not just the AI result',
  'There are documented cases where humans have actually decided differently from the AI',
  'Sufficient time is allocated for human review — no assembly-line rubber-stamping',
]

function Art22Checker() {
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  const toggle = (i: number) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))
  const passed = ART22_CHECKS.filter((_, i) => checked[i]).length
  const all = ART22_CHECKS.length

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">Art. 22 — Human-in-the-Loop Quality</p>
              <p className="text-xs text-slate-500">ECJ C-634/21: Formal oversight is not enough — the human must genuinely decide</p>
            </div>
          </div>
          {passed > 0 && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
              passed === all ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {passed}/{all}
            </span>
          )}
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Check whether your human-in-the-loop process meets the Art. 22 standard:
        </p>
        <div className="space-y-1">
          {ART22_CHECKS.map((check, i) => (
            <label key={i} onClick={() => toggle(i)}
              className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0 cursor-pointer group hover:bg-slate-50 -mx-5 px-5 rounded transition-colors">
              <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                checked[i] ? 'bg-rose-600 border-rose-600' : 'border-slate-300 group-hover:border-rose-400'
              }`}>
                {checked[i] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <p className={`text-xs leading-relaxed transition-colors ${checked[i] ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {check}
              </p>
            </label>
          ))}
        </div>
        {passed === all && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-green-700">✓ All checks passed — human-in-the-loop process looks good</p>
          </div>
        )}
        {passed > 0 && passed < all && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-amber-700">⚠ {all - passed} item{all - passed > 1 ? 's' : ''} still open — review your process</p>
          </div>
        )}
        <p className="text-[10px] text-slate-400 mt-4">This checklist is for guidance only. For actual Art. 22 matters: Decision Model Level 3 → DPO/lawyer.</p>
      </div>
    </div>
  )
}

function DreistufenmodellSection() {
  const [activeStufe, setActiveStufe] = useState<Stufe>(null)

  return (
    <div className="space-y-4">
      {/* Overview table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Three-Level Decision Model — Who decides what?</p>
          <p className="text-xs text-slate-500 mt-0.5">Click a level for details</p>
        </div>
        <div className="divide-y divide-slate-50">
          {DREISTUFENMODELL.map((s) => (
            <button key={s.stufe} onClick={() => setActiveStufe(activeStufe === s.stufe ? null : s.stufe)}
              className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left ${activeStufe === s.stufe ? 'bg-slate-50' : ''}`}>
              <span className={`w-7 h-7 rounded-full ${s.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {s.stufe}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.merkmal}</p>
              </div>
              <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${activeStufe === s.stufe ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {activeStufe !== null && (() => {
        const s = DREISTUFENMODELL.find((x) => x.stufe === activeStufe)!
        return (
          <div className={`rounded-xl border ${s.borderColor} ${s.bgColor} overflow-hidden`}>
            <div className="px-5 py-4 border-b border-slate-100/50">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full ${s.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{s.stufe}</span>
                <p className={`text-sm font-semibold ${s.textColor}`}>{s.title}</p>
              </div>
            </div>
            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {s.tasks.map((task) => (
                <div key={task.title} className="bg-white rounded-lg px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold text-slate-700 mb-1">{task.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{task.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DsgvoPage() {
  const [activeTab, setActiveTab] = useState<'articles' | 'tools' | 'dreistufen'>('articles')

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'articles', label: 'Article Reference' },
    { id: 'tools', label: 'Compliance Checks' },
    { id: 'dreistufen', label: 'Decision Model' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Data Privacy (GDPR)</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Legal foundations for AI deployment — article reference, compliance checks and decision model
        </p>
      </div>

      {/* Key metrics bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Key Articles', value: '6', sub: 'Art. 3 · 6 · 22 · 28 · 35 + §87 BetrVG' },
          { label: 'Decision Model', value: '3', sub: 'Levels of decision responsibility' },
          { label: 'Core principle', value: 'DPA', sub: 'No DPA = unlawful processing' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-2xl font-bold text-slate-800">{m.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{m.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Articles */}
      {activeTab === 'articles' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">GDPR structure:</span> Principles (Art. 1–7) → Rights (Art. 12–23) → Obligations (Art. 24–43) → Sanctions (Art. 77–84). Understanding the structure is the key to navigating every article.
            </p>
          </div>
          {ARTICLES.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}

      {/* Tab: Tools */}
      {activeTab === 'tools' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Interactive checks for common compliance questions — not a substitute for legal advice.</p>
          <DsfaChecker />
          <AvvChecker />

          <Art22Checker />
        </div>
      )}

      {/* Tab: Dreistufenmodell */}
      {activeTab === 'dreistufen' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              The <span className="font-semibold">Three-Level Decision Model</span> answers: who decides what — and when is a DPO or lawyer required? The AI Officer is not the sole decision-maker. Level 1 = decide independently, Level 2 = flag and escalate, Level 3 = always involve DPO/lawyer.
            </p>
          </div>
          <DreistufenmodellSection />
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-600">Disclaimer:</span> All content is for guidance only and does not constitute legal advice. For specific legal questions: Data Protection Officer (DPO) or specialist data protection lawyer — per Decision Model Level 2/3.
        </p>
      </div>
    </div>
  )
}
