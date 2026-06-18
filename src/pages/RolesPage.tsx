import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

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
    responsibility: 'Technisches Fundament und Architektur aller AI-Lösungen. Interim: Governance & Compliance.',
    interim: 'Technische Governance (EU AI Act, Risikoklassifizierung, Standards)',
    activities: [
      'Entwicklung der technischen AI-Strategie und Referenzarchitektur',
      'Definition von Standards, Frameworks und Technologie-Stack',
      'Integration von AI-Lösungen in bestehende Systeme (CRM, ERP, Datenplattformen)',
      'Sicherstellung von Skalierbarkeit, Sicherheit und Performance',
      'Risikoklassifizierung nach EU AI Act (interim bis Rolle 7)',
      'Technisches Review aller Use Cases vor Umsetzung',
      'Aufbau und Pflege der MLOps-Infrastruktur',
    ],
    color: { bg: 'bg-blue-50', text: 'text-blue-700', badgeBg: 'bg-blue-600', border: 'border-blue-200' },
  },
  {
    id: 'data_engineer',
    number: 2,
    title: 'Data Engineer',
    responsibility: 'Datenqualität und -verfügbarkeit als Grundlage für alle AI-Anwendungen.',
    activities: [
      'Design und Betrieb von Datenpipelines (ETL/ELT)',
      'Sicherstellung von Datenqualität, -konsistenz und -aktualität',
      'Aufbau und Pflege des Feature Stores',
      'Anbindung an interne Datenquellen und externe APIs',
      'Zusammenarbeit mit IT und Fachbereichen zur Datenstrategie',
      'Monitoring und Logging von Datenprozessen',
    ],
    color: { bg: 'bg-cyan-50', text: 'text-cyan-700', badgeBg: 'bg-cyan-600', border: 'border-cyan-200' },
  },
  {
    id: 'ai_business_analyst',
    number: 3,
    title: 'AI Business Analyst',
    responsibility: 'Brücke zwischen Business und Technologie. Interim: Business-seitige Governance.',
    interim: 'Use-Case-Transparenz, Stakeholder-Risikokommunikation',
    activities: [
      'Identifikation, Bewertung und Priorisierung von AI-Use-Cases nach ROI',
      'Übersetzung von Business-Anforderungen in technische Spezifikationen',
      'Stakeholder-Management mit Fachbereichen und C-Level',
      'Business Cases und Impact-Analysen für AI-Projekte',
      'Begleitung von Pilotprojekten und Erfolgsmessung (KPIs)',
      'Dokumentation von Anforderungen und Prozessen',
      'Interim: Risikobewertung und Transparenz zu Use Cases',
    ],
    color: { bg: 'bg-amber-50', text: 'text-amber-700', badgeBg: 'bg-amber-500', border: 'border-amber-200' },
  },
  {
    id: 'ml_ai_engineer',
    number: 4,
    title: 'ML / AI Engineer',
    responsibility: 'Entwicklung, Training und Deployment von AI-Modellen und -Lösungen.',
    activities: [
      'Entwicklung und Fine-Tuning von ML- und GenAI-Modellen',
      'Prompt Engineering und RAG-Architekturen',
      'Deployment und Monitoring von Modellen in Produktion',
      'MLOps: Versionierung, Testing, CI/CD für AI-Pipelines',
      'Evaluation von Modellperformance und Drift-Erkennung',
      'Technische Umsetzung von Use Cases in enger Abstimmung mit dem Architect',
    ],
    color: { bg: 'bg-purple-50', text: 'text-purple-700', badgeBg: 'bg-purple-600', border: 'border-purple-200' },
  },
  {
    id: 'ai_product_manager',
    number: 5,
    title: 'AI Product Manager',
    responsibility: 'Use-Case-Roadmap und Delivery bei mehreren parallelen Projekten.',
    activities: [
      'Priorisierung und Pflege der AI-Use-Case-Roadmap',
      'Erstellung von User Stories und Akzeptanzkriterien',
      'Koordination zwischen Business Analyst, Engineers und Stakeholdern',
      'Sprint-Planung und Fortschritts-Tracking',
      'KPI-Messung und Reporting an das Management',
      'Identifikation von Abhängigkeiten und Risiken im Projektportfolio',
    ],
    color: { bg: 'bg-green-50', text: 'text-green-700', badgeBg: 'bg-green-600', border: 'border-green-200' },
  },
  {
    id: 'ai_enablement_specialist',
    number: 6,
    title: 'AI Enablement Specialist',
    responsibility: 'Aufbau von AI-Kompetenz und Adoption im Unternehmen.',
    activities: [
      'Konzeption und Durchführung von AI-Trainings für alle Ebenen',
      'Aufbau einer internen Community of Practice (AI Champions)',
      'Entwicklung von Lernpfaden und Self-Service-Materialien',
      'Change Management bei der Einführung neuer AI-Tools',
      'Kommunikation von AI-Erfolgen und Best Practices intern',
      'Bedarfsanalyse für Weiterbildung in Fachbereichen',
    ],
    color: { bg: 'bg-orange-50', text: 'text-orange-700', badgeBg: 'bg-orange-500', border: 'border-orange-200' },
  },
  {
    id: 'ai_governance_specialist',
    number: 7,
    title: 'AI Governance & Compliance Specialist',
    responsibility: 'Regulatorische Sicherheit und verantwortungsvoller AI-Einsatz.',
    activities: [
      'Umsetzung und Monitoring der Anforderungen aus dem EU AI Act',
      'Risikoklassifizierung und Audit-Trails für AI-Systeme',
      'Entwicklung unternehmensweiter AI-Richtlinien und Standards',
      'Datenschutz-Compliance in Abstimmung mit Legal und DSGVO',
      'Regelmäßige Audits der eingesetzten AI-Lösungen',
      'Schulung des Teams zu ethischen AI-Prinzipien',
      'Ansprechpartner für externe Prüfungen und Behörden',
    ],
    color: { bg: 'bg-rose-50', text: 'text-rose-700', badgeBg: 'bg-rose-600', border: 'border-rose-200' },
  },
]

export default function RolesPage() {
  const user = useAuthStore((s) => s.user)
  const [assignments, setAssignments] = useState<Assignments>({})
  const [original, setOriginal] = useState<Assignments>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
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
  }, [])

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
          <p className="text-sm text-slate-500 mt-0.5">Rollen & Verantwortlichkeiten · 7 Positionen</p>
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
          <p className="text-sm font-semibold text-amber-800">Interim-Governance aktiv</p>
          <p className="text-xs text-amber-700">
            Bis Rolle 7 besetzt ist, tragen folgende Rollen zusätzliche Governance-Verantwortung:
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
                    {role.activities.length} Tätigkeiten
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
