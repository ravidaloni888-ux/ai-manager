import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { useDemoStore } from '../store/demoStore'

const DEMO_ASSIGNMENTS: Assignments = {
  ai_architect:              'Alexander Koch (Senior Solutions Architect)',
  data_engineer:             'Priya Patel (Lead Data Engineer)',
  ai_business_analyst:       'Marcus Schmidt (AI Business Analyst)',
  ml_ai_engineer:            'Dr. Yuki Tanaka (ML Engineer)',
  ai_product_manager:        'Emma Bauer (AI Product Manager)',
  ai_enablement_specialist:  'Carlos Rodriguez (L&D Lead)',
  ai_governance_specialist:  '',
}

type Assignments = Record<string, string>

interface RoleDef {
  id: string
  number: number
  title: string
  responsibility: string
  activities: string[]
  interim?: string
  color: { bg: string; text: string; badgeBg: string; border: string }
}

const ROLES: RoleDef[] = [
  {
    id: 'ai_architect',
    number: 1,
    title: 'AI Architect',
    responsibility: 'Technical foundation and architecture of all AI solutions. Interim: Governance & Compliance.',
    interim: 'Technical governance (EU AI Act, risk classification, standards)',
    activities: [
      'Develop the technical AI strategy and reference architecture',
      'Define standards, frameworks and technology stack',
      'Integrate AI solutions into existing systems (CRM, ERP, data platforms)',
      'Ensure scalability, security and performance',
      'Risk classification per EU AI Act (interim until Role 7 is filled)',
      'Technical review of all use cases before implementation',
      'Build and maintain MLOps infrastructure',
    ],
    color: { bg: 'bg-blue-50', text: 'text-blue-700', badgeBg: 'bg-blue-600', border: 'border-blue-200' },
  },
  {
    id: 'data_engineer',
    number: 2,
    title: 'Data Engineer',
    responsibility: 'Data quality and availability as the foundation for all AI applications.',
    activities: [
      'Design and operate data pipelines (ETL/ELT)',
      'Ensure data quality, consistency and freshness',
      'Build and maintain the feature store',
      'Connect to internal data sources and external APIs',
      'Collaborate with IT and business units on data strategy',
      'Monitor and log data processes',
    ],
    color: { bg: 'bg-cyan-50', text: 'text-cyan-700', badgeBg: 'bg-cyan-600', border: 'border-cyan-200' },
  },
  {
    id: 'ai_business_analyst',
    number: 3,
    title: 'AI Business Analyst',
    responsibility: 'Bridge between business and technology. Interim: Business-side governance.',
    interim: 'Use case transparency, stakeholder risk communication',
    activities: [
      'Identify, evaluate and prioritise AI use cases by ROI',
      'Translate business requirements into technical specifications',
      'Stakeholder management with business units and C-level',
      'Business cases and impact analyses for AI projects',
      'Support pilot projects and measure success (KPIs)',
      'Document requirements and processes',
      'Interim: risk assessment and transparency for use cases',
    ],
    color: { bg: 'bg-amber-50', text: 'text-amber-700', badgeBg: 'bg-amber-500', border: 'border-amber-200' },
  },
  {
    id: 'ml_ai_engineer',
    number: 4,
    title: 'ML / AI Engineer',
    responsibility: 'Development, training and deployment of AI models and solutions.',
    activities: [
      'Develop and fine-tune ML and GenAI models',
      'Prompt engineering and RAG architectures',
      'Deploy and monitor models in production',
      'MLOps: versioning, testing, CI/CD for AI pipelines',
      'Evaluate model performance and detect drift',
      'Implement use cases in close collaboration with the Architect',
    ],
    color: { bg: 'bg-purple-50', text: 'text-purple-700', badgeBg: 'bg-purple-600', border: 'border-purple-200' },
  },
  {
    id: 'ai_product_manager',
    number: 5,
    title: 'AI Product Manager',
    responsibility: 'AI use case roadmap and delivery across multiple parallel projects.',
    activities: [
      'Prioritise and maintain the AI use case roadmap',
      'Write user stories and acceptance criteria',
      'Coordinate between business analyst, engineers and stakeholders',
      'Sprint planning and progress tracking',
      'KPI measurement and reporting to management',
      'Identify dependencies and risks in the project portfolio',
    ],
    color: { bg: 'bg-green-50', text: 'text-green-700', badgeBg: 'bg-green-600', border: 'border-green-200' },
  },
  {
    id: 'ai_enablement_specialist',
    number: 6,
    title: 'AI Enablement Specialist',
    responsibility: 'Building AI competency and adoption across the organisation.',
    activities: [
      'Design and deliver AI training for all levels',
      'Build an internal Community of Practice (AI Champions)',
      'Develop learning paths and self-service materials',
      'Change management for the introduction of new AI tools',
      'Communicate AI successes and best practices internally',
      'Assess upskilling needs across business units',
    ],
    color: { bg: 'bg-orange-50', text: 'text-orange-700', badgeBg: 'bg-orange-500', border: 'border-orange-200' },
  },
  {
    id: 'ai_governance_specialist',
    number: 7,
    title: 'AI Governance & Compliance Specialist',
    responsibility: 'Regulatory compliance and responsible AI deployment.',
    activities: [
      'Implement and monitor EU AI Act requirements',
      'Risk classification and audit trails for AI systems',
      'Develop company-wide AI policies and standards',
      'Data privacy compliance in alignment with legal and GDPR',
      'Regular audits of deployed AI solutions',
      'Train the team on ethical AI principles',
      'Point of contact for external audits and regulatory authorities',
    ],
    color: { bg: 'bg-rose-50', text: 'text-rose-700', badgeBg: 'bg-rose-600', border: 'border-rose-200' },
  },
]

// ── ISO 42001 §5.3 mapping ────────────────────────────────────────────────

const ISO_REQUIREMENTS = [
  {
    clause: '§5.3 a)',
    requirement: 'Ensure the AIMS conforms to the requirements of ISO 42001',
    description: 'Top management must designate a person or team responsible for ensuring the AI Management System as a whole meets the standard.',
    coveredBy: ['ai_governance_specialist', 'ai_architect'],
    coveredLabel: 'AI Governance Specialist (primary) · AI Architect (interim)',
  },
  {
    clause: '§5.3 b)',
    requirement: 'Report on the performance of the AIMS to top management',
    description: 'Regular reporting on AI system performance, risks, incidents, and objectives must be assigned to a named role.',
    coveredBy: ['ai_governance_specialist', 'ai_product_manager'],
    coveredLabel: 'AI Governance Specialist · AI Product Manager',
  },
  {
    clause: '§5.3 c)',
    requirement: 'Ensure AI policy and objectives are established and communicated',
    description: 'A role must be accountable for the AI policy being documented, maintained, and communicated across the organisation.',
    coveredBy: ['ai_governance_specialist', 'ai_business_analyst'],
    coveredLabel: 'AI Governance Specialist · AI Business Analyst (interim)',
  },
  {
    clause: '§5.3 d)',
    requirement: 'Promote awareness of the AIMS throughout the organisation',
    description: 'Someone must drive AI awareness, training, and a risk-aware culture — especially for teams working with or affected by AI systems.',
    coveredBy: ['ai_enablement_specialist'],
    coveredLabel: 'AI Enablement Specialist',
  },
  {
    clause: '§5.3 e)',
    requirement: 'Ensure AI system roles and responsibilities are assigned and communicated',
    description: 'Accountability must be defined at the use-case level: who owns each AI system, who reviews outputs, who handles incidents.',
    coveredBy: ['ai_product_manager', 'ai_governance_specialist'],
    coveredLabel: 'AI Product Manager · AI Governance Specialist',
  },
]

function Iso42001Section({ assignments }: { assignments: Assignments }) {
  const [open, setOpen] = useState(false)

  const covered = (roleIds: string[]) =>
    roleIds.some((id) => assignments[id]?.trim())

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
            <p className="text-sm font-semibold text-slate-800">ISO 42001 · §5.3 Organisational Roles & Responsibilities</p>
            <p className="text-xs text-slate-500 mt-0.5">5 mandatory role assignments required by the AI Management System standard</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            ISO_REQUIREMENTS.every((r) => covered(r.coveredBy))
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {ISO_REQUIREMENTS.filter((r) => covered(r.coveredBy)).length}/{ISO_REQUIREMENTS.length} assigned
          </span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {/* Standard intro */}
          <div className="px-5 py-3 bg-indigo-50">
            <p className="text-xs text-indigo-700 leading-relaxed">
              <span className="font-semibold">ISO 42001:2023 §5.3</span> requires top management to assign, communicate and ensure understanding of roles relevant to the AI Management System (AIMS). Each clause below must be covered by a named person or role — this is audited in certification.
            </p>
          </div>

          {ISO_REQUIREMENTS.map((req) => {
            const isCovered = covered(req.coveredBy)
            return (
              <div key={req.clause} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  {isCovered ? (
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
                    <p className="text-xs font-semibold text-slate-700">{req.requirement}</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{req.description}</p>
                  <p className="text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-500">Covered by: </span>
                    {isCovered
                      ? <span className="text-green-600 font-medium">{req.coveredLabel}</span>
                      : <span className="text-amber-600 font-medium">⚠ No one assigned yet — assign roles above</span>
                    }
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default function RolesPage() {
  const user = useAuthStore((s) => s.user)
  const demoMode = useDemoStore((s) => s.demoMode)
  const [assignments, setAssignments] = useState<Assignments>({})
  const [original, setOriginal] = useState<Assignments>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (demoMode) {
      setAssignments(DEMO_ASSIGNMENTS)
      setOriginal(DEMO_ASSIGNMENTS)
      setLoading(false)
      return
    }
    async function load() {
      try {
        const { data } = await supabase
          .from('ai_coe_roles')
          .select('assignments')
          .eq('id', 'singleton')
          .single()
        const a = (data?.assignments ?? {}) as Assignments
        setAssignments(a)
        setOriginal(a)
      } catch {}
      setLoading(false)
    }
    load()
  }, [demoMode])

  const isDirty = JSON.stringify(assignments) !== JSON.stringify(original)

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('ai_coe_roles').upsert({
      id: 'singleton',
      assignments,
      updated_at: new Date().toISOString(),
    })
    setOriginal({ ...assignments })
    setSaving(false)
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const role7Assigned = !!(assignments['ai_governance_specialist']?.trim())
  const interimRoles = ROLES.filter((r) => r.interim)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Center of Excellence</h1>
          <p className="text-sm text-slate-500 mt-0.5">Roles & Responsibilities · 7 Positions</p>
        </div>
        {user && isDirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>

      {/* Interim governance banner */}
      {!role7Assigned && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5">
          <p className="text-sm font-semibold text-amber-800">Interim Governance Active</p>
          <p className="text-xs text-amber-700">
            Until Role 7 is filled, the following roles carry additional governance responsibility:
          </p>
          <ul className="space-y-0.5">
            {interimRoles.map((r) => (
              <li key={r.id} className="text-xs text-amber-700">
                <span className="font-semibold">{r.title}:</span> {r.interim}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ISO 42001 §5.3 Info */}
      <Iso42001Section assignments={assignments} />

      {/* Role cards */}
      {loading ? (
        <div className="text-sm text-slate-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ROLES.map((role) => {
            const isExp = expanded.has(role.id)
            const person = assignments[role.id] ?? ''
            return (
              <div
                key={role.id}
                className={`bg-white rounded-xl shadow-md overflow-hidden flex flex-col border-l-4 ${role.color.border}`}
              >
                {/* Top: number + title + responsibility */}
                <div className={`px-5 py-4 ${role.color.bg}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${role.color.badgeBg}`}>
                        {role.number}
                      </span>
                      <h3 className={`font-semibold text-sm leading-snug ${role.color.text}`}>{role.title}</h3>
                    </div>
                    {role.interim && !role7Assigned && (
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                        interim +
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{role.responsibility}</p>
                </div>

                {/* Person assignment */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  {user ? (
                    <input
                      type="text"
                      value={person}
                      onChange={(e) => setAssignments((prev) => ({ ...prev, [role.id]: e.target.value }))}
                      placeholder="Assign person…"
                      className="flex-1 text-sm text-slate-700 bg-transparent focus:outline-none placeholder:text-slate-300"
                    />
                  ) : (
                    <span className={`text-sm ${person ? 'text-slate-700 font-medium' : 'text-slate-300 italic'}`}>
                      {person || 'Not assigned'}
                    </span>
                  )}
                </div>

                {/* Activities toggle */}
                <div className="px-5 py-3 flex-1">
                  <button
                    onClick={() => toggleExpand(role.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${isExp ? 'rotate-90' : ''}`}
                      fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    {role.activities.length} Activities
                  </button>
                  {isExp && (
                    <ul className="mt-2.5 space-y-1.5">
                      {role.activities.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-snug">
                          <span className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${role.color.badgeBg}`} />
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
