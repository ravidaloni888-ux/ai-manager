export type Department =
  | 'Sales'
  | 'Operations'
  | 'Customer Service'
  | 'Finance'
  | 'HR'
  | 'IT'
  | 'Legal'
  | 'Marketing'
  | 'Logistics'
  | 'Other'

export type Status =
  | 'Idea'
  | 'Problem Scoping'
  | 'Data Exploration'
  | 'Modeling & Piloting'
  | 'Evaluation & Testing'
  | 'Production'
  | 'Maintenance'
  | 'Cancelled'

export type AIApproach =
  | 'Supervised Learning'
  | 'Unsupervised Learning'
  | 'Reinforcement Learning'
  | 'Generative AI'
  | 'Computer Vision'
  | 'NLP'

export type TechnicalFeasibility = 'Low' | 'Medium' | 'High'

export type ProjectHealth = 'On Track' | 'At Risk' | 'Blocked'

export type EuAiActRisk = 'Minimal Risk' | 'Limited Risk' | 'High Risk' | 'Unacceptable Risk'

export const EU_AI_ACT_RISKS: EuAiActRisk[] = [
  'Minimal Risk', 'Limited Risk', 'High Risk', 'Unacceptable Risk',
]

export const EU_AI_ACT_BG: Record<EuAiActRisk, string> = {
  'Minimal Risk':      'bg-green-100 text-green-700',
  'Limited Risk':      'bg-amber-100 text-amber-700',
  'High Risk':         'bg-orange-100 text-orange-700',
  'Unacceptable Risk': 'bg-red-100 text-red-700',
}

export interface AimsClause {
  status: 'not_started' | 'in_progress' | 'done'
  note: string
}

export interface GovernanceData {
  richtlinie: {
    zweck: string; daten: string; transparenz: string
    verantwortlichkeiten: string; risikomanagement: string; ethik: string; schulung: string
  }
  roles: { aiOwner: string; dpo: string; security: string; ethics: string; business: string }
  steps: {
    step1: boolean; step2: boolean; step3: boolean; step4: boolean; step5: boolean
    step6: boolean; step7: boolean; step8: boolean; step9: boolean
  }
  aims?: {
    kl4: AimsClause; kl5: AimsClause; kl6: AimsClause; kl7: AimsClause
    kl8: AimsClause; kl9: AimsClause; kl10: AimsClause
  }
}

export const RISK_CATEGORIES = [
  'Bias & Fairness',
  'Data Quality',
  'Model Performance',
  'Security & Privacy',
  'Regulatory & Legal',
  'Operational',
  'Vendor & Technology',
  'Transparency',
] as const
export type RiskCategory = typeof RISK_CATEGORIES[number]

export const MITIGATION_STATUSES = ['None', 'Planned', 'In Progress', 'Implemented'] as const
export type MitigationStatus = typeof MITIGATION_STATUSES[number]

export const MITIGATION_BG: Record<MitigationStatus, string> = {
  'None':         'bg-red-100 text-red-700',
  'Planned':      'bg-slate-100 text-slate-600',
  'In Progress':  'bg-amber-100 text-amber-700',
  'Implemented':  'bg-green-100 text-green-700',
}

export interface AIRisk {
  id: string
  useCaseId: string
  useCaseTitle: string
  category: RiskCategory
  title: string
  description: string
  b: number  // Bedeutung / Severity 1-10
  a: number  // Auftreten / Occurrence 1-10
  e: number  // Entdeckung / Detection 1-10
  mitigation: string
  mitigationStatus: MitigationStatus
  owner: string
  residualB: number
  residualA: number
  residualE: number
}

/**
 * Fünf Auslöser, aus denen ein KI-Vorhaben entsteht. Bewusst knapp: Wer
 * zwölf Kategorien anbietet, bekommt Mehrfachauswahl ohne Aussage. Jeder
 * Auslöser lässt sich später an einer Kennzahl messen.
 */
export type Motivation = 'Zeit' | 'Kosten' | 'Umsatz' | 'Qualität' | 'Risiko'

export interface StrategyFocusArea {
  theme: string
  priority: 'High' | 'Medium' | 'Low' | 'None'
  note: string
}

export interface StrategyKPI {
  id: string
  metric: string
  current: string
  target: string
  deadline: string
}

/** Wie tief will das Haus selbst in KI einsteigen? Setzt den Maßstab für den Reifegrad. */
export type Ambition = 'anwender' | 'integrator' | 'entwickler'

/** Bausteine eines Ziels — der Wizard führt sie, gespeichert wird auch der Satz. */
export interface ZielBaustein {
  was: string
  mess: string
  frist: string
}

export interface StrategyData {
  vision: string
  horizon: '1' | '2' | '3' | '5'
  objectives: string[]
  challenge: string
  /** aus dem Vision-Assistenten — optional, damit alte Stände weiter laden */
  ambition?: Ambition
  treiber?: string[]
  zielBausteine?: ZielBaustein[]
  focusAreas: StrategyFocusArea[]
  budgetTotalK: number
  targetRoiPct: number
  kpis: StrategyKPI[]
}

export const DEFAULT_STRATEGY: StrategyData = {
  vision: 'Bis 2029 verbinden wir erprobte KI-Werkzeuge mit unseren eigenen Daten in Kundenservice, Betrieb und Vertrieb — um im Wettbewerb anschlussfähig zu bleiben und vermeidbaren manuellen Aufwand abzubauen. Die menschliche Entscheidung bleibt dort, wo sie hingehört.',
  horizon: '3',
  ambition: 'integrator',
  treiber: ['wettbewerb', 'kosten'],
  objectives: [
    'KI produktiv in Vertrieb, Betrieb und Finanzen — mindestens 12 Anwendungsfälle bis Q4 2027',
    'Jährlicher Effekt aus KI — 2 Mio. € an Einsparungen und Mehrertrag bis Ende 2027',
    'KI-Kompetenz in der Breite — 80 geschulte Mitarbeitende und 5 Multiplikatoren bis Q1 2027',
  ],
  challenge: 'Ein wichtiger Wettbewerber hat im ersten Quartal 2026 eine KI-gestützte Preis- und Serviceplattform eingeführt; unsere Abschlussquote im Großkundengeschäft ist seither um 11 % gefallen. Manuelle Abläufe in Betrieb und Finanzen kosten geschätzt 4 Mio. € vermeidbaren Aufwand pro Jahr. Ohne Tempo beim KI-Einsatz wächst der Rückstand weiter.',
  focusAreas: [
    { theme: 'Customer Experience',    priority: 'High',   note: 'Chatbot-Einführung und personalisierte Servicevorgänge über alle Kanäle' },
    { theme: 'Operational Efficiency', priority: 'High',   note: 'Vorausschauende Wartung, Bedarfsprognose und Rechnungsverarbeitung im Umfang' },
    { theme: 'Revenue Growth',         priority: 'High',   note: 'Empfehlungssystem und dynamische Preise bereits produktiv' },
    { theme: 'Risk & Compliance',      priority: 'Medium', note: 'Betrugserkennung läuft; Kreditrisiko-KI in der aufsichtsrechtlichen Prüfung' },
    { theme: 'Innovation & R&D',       priority: 'Low',    note: 'Erkundungsbudget für generative Prototypen im zweiten Halbjahr' },
    { theme: 'HR & Talent',            priority: 'Medium', note: 'Bewerbungssichtung und Fluktuationsprognose für den nächsten Zyklus geplant' },
    { theme: 'Data & Analytics',       priority: 'Medium', note: 'Stimmungsanalyse und Lead-Bewertung als Entscheidungsgrundlage' },
    { theme: 'Sustainability',         priority: 'Low',    note: 'Pilot zur Energieprognose für die ESG-Berichtspflichten' },
  ],
  budgetTotalK: 2500,
  targetRoiPct: 250,
  kpis: [
    { id: 'kpi-1', metric: 'Anwendungsfälle im Produktivbetrieb', current: '5',  target: '12',   deadline: 'Q4 2027' },
    { id: 'kpi-2', metric: 'Geschulte Mitarbeitende',            current: '12',  target: '80',   deadline: 'Q1 2027' },
    { id: 'kpi-3', metric: 'Jährliche Einsparung durch KI (T€)', current: '0',   target: '2000', deadline: 'Q4 2027' },
    { id: 'kpi-4', metric: 'Kernprozesse mit KI-Unterstützung',  current: '8 %', target: '30 %', deadline: 'Q2 2027' },
    { id: 'kpi-5', metric: 'Avg. priority score across portfolio', current: '7.4', target: '8.0', deadline: 'Q4 2026' },
  ],
}

export interface AIUseCase {
  id: string
  title: string
  department: Department
  status: Status

  // AI Use Case Canvas — 9 elements (Chapter 2.2)
  businessProblem: string
  successMetrics: string
  dataRequirements: string
  aiApproach: AIApproach
  technicalFeasibility: TechnicalFeasibility
  teamCompetencies: string
  timeline: string
  estimatedCostK: number   // in thousands €
  expectedBenefitK: number // annual value in thousands €

  // Portfolio scoring — weighted model (Chapter 2.5)
  businessImpact: number  // 1–10, weight 40%
  feasibility: number     // 1–10, weight 30%
  strategicFit: number    // 1–10, weight 20%
  urgency: number         // 1–10, weight 10%
  priorityScore: number   // computed

  projectHealth?: ProjectHealth
  motivation?: string
  euAiActRisk?: EuAiActRisk
  complianceLegal?: boolean
  compliancePersonalData?: boolean
  complianceDataMin?: boolean
  complianceDocumentation?: boolean
  complianceLiability?: boolean

  startDate?: string
  cancellationReason?: string

  // Step 9 documentation
  docGoal?: string
  docDataBasis?: string
  docRiskMitigation?: string
  docExplainability?: string
  docOperations?: string
  docRegulatory?: string
  docVersioning?: string

  createdAt: string
  updatedAt: string
}

export const DEPARTMENTS: Department[] = [
  'Sales', 'Operations', 'Customer Service', 'Finance',
  'HR', 'IT', 'Legal', 'Marketing', 'Logistics', 'Other',
]

export const STATUSES: Status[] = [
  'Idea',
  'Problem Scoping',
  'Data Exploration',
  'Modeling & Piloting',
  'Evaluation & Testing',
  'Production',
  'Maintenance',
  'Cancelled',
]

export const AI_APPROACHES: AIApproach[] = [
  'Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning',
  'Generative AI', 'Computer Vision', 'NLP',
]

export const FEASIBILITIES: TechnicalFeasibility[] = ['Low', 'Medium', 'High']

export interface MotivationDef {
  key: Motivation
  desc: string
  bg: string
}

export const MOTIVATION_DEFS: MotivationDef[] = [
  { key: 'Zeit',     desc: 'Durchlaufzeit senken, Bearbeitung beschleunigen',                 bg: 'bg-blue-100 text-blue-700' },
  { key: 'Kosten',   desc: 'Manuellen Aufwand oder wiederkehrende Rüstkosten reduzieren',     bg: 'bg-emerald-100 text-emerald-700' },
  { key: 'Umsatz',   desc: 'Bessere Angebote, höhere Abschlussquote',                         bg: 'bg-green-100 text-green-700' },
  { key: 'Qualität', desc: 'Weniger Fehler, konstantere Ergebnisse',                          bg: 'bg-violet-100 text-violet-700' },
  { key: 'Risiko',   desc: 'Betrug, Ausfälle oder Verstöße früher erkennen und verhindern',   bg: 'bg-red-100 text-red-700' },
]

export const MOTIVATIONS: Motivation[] = MOTIVATION_DEFS.map((m) => m.key)

export const MOTIVATION_BG: Record<Motivation, string> = Object.fromEntries(
  MOTIVATION_DEFS.map((m) => [m.key, m.bg]),
) as Record<Motivation, string>

/**
 * Bestehende Fälle tragen noch die alten zwölf Werte. Sie werden beim
 * Anzeigen auf die fünf abgebildet, statt sie zu verlieren — die Zuordnung
 * folgt dem, was der alte Wert praktisch gemessen hat.
 */
const MOTIVATION_ALT: Record<string, Motivation> = {
  'Time Saving': 'Zeit',
  'Employee Experience': 'Zeit',
  'Cost Reduction': 'Kosten',
  'Scalability': 'Kosten',
  'Sustainability': 'Kosten',
  'Revenue Growth': 'Umsatz',
  'Customer Experience': 'Umsatz',
  'Competitive Advantage': 'Umsatz',
  'Error Reduction': 'Qualität',
  'Quality Improvement': 'Qualität',
  'Data & Insights': 'Qualität',
  'Risk & Compliance': 'Risiko',
}

/**
 * Kommagetrennte Auslöser auf die fünf Kategorien bringen — ohne Dubletten,
 * in der Reihenfolge der Liste. Unbekanntes bleibt unverändert stehen.
 */
export function motivationenLesen(wert: string | undefined): string[] {
  if (!wert) return []
  const roh = wert.split(',').map((s) => s.trim()).filter(Boolean)
  const gemappt = roh.map((r) => MOTIVATION_ALT[r] ?? r)
  const bekannt = MOTIVATIONS.filter((m) => gemappt.includes(m))
  const fremd = [...new Set(gemappt.filter((g) => !(MOTIVATIONS as string[]).includes(g)))]
  return [...bekannt, ...fremd]
}


export const PROJECT_HEALTH_OPTIONS: { value: ProjectHealth; label: string; activeCls: string; dotCls: string }[] = [
  { value: 'On Track', label: 'On Track', activeCls: 'bg-green-500 text-white', dotCls: 'bg-green-500' },
  { value: 'At Risk',  label: 'At Risk',  activeCls: 'bg-amber-400 text-white', dotCls: 'bg-amber-400' },
  { value: 'Blocked',  label: 'Blocked',  activeCls: 'bg-red-500 text-white',   dotCls: 'bg-red-500'   },
]

export const HEALTH_BG: Record<ProjectHealth, string> = {
  'On Track': 'bg-green-100 text-green-700',
  'At Risk':  'bg-amber-100 text-amber-700',
  'Blocked':  'bg-red-100 text-red-600',
}

export const STATUS_COLORS: Record<Status, string> = {
  'Idea':                 '#94a3b8',
  'Problem Scoping':      '#a855f7',
  'Data Exploration':     '#6366f1',
  'Modeling & Piloting':  '#3b82f6',
  'Evaluation & Testing': '#f59e0b',
  'Production':           '#22c55e',
  'Maintenance':          '#14b8a6',
  'Cancelled':            '#ef4444',
}

export const STATUS_BG: Record<Status, string> = {
  'Idea':                 'bg-slate-100 text-slate-600',
  'Problem Scoping':      'bg-purple-100 text-purple-700',
  'Data Exploration':     'bg-indigo-100 text-indigo-700',
  'Modeling & Piloting':  'bg-blue-100 text-blue-700',
  'Evaluation & Testing': 'bg-amber-100 text-amber-700',
  'Production':           'bg-green-100 text-green-700',
  'Maintenance':          'bg-teal-100 text-teal-700',
  'Cancelled':            'bg-red-100 text-red-600',
}

export const APPROACH_BG: Record<AIApproach, string> = {
  'Supervised Learning':    'bg-violet-100 text-violet-700',
  'Unsupervised Learning':  'bg-indigo-100 text-indigo-700',
  'Reinforcement Learning': 'bg-orange-100 text-orange-700',
  'Generative AI':          'bg-pink-100 text-pink-700',
  'Computer Vision':        'bg-cyan-100 text-cyan-700',
  'NLP':                    'bg-teal-100 text-teal-700',
}

export const FEASIBILITY_BG: Record<TechnicalFeasibility, string> = {
  High:   'bg-green-100 text-green-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low:    'bg-red-100 text-red-600',
}

export const TRAINING_TOPICS = [
  { key: 'fundamentals' as const, label: 'KI-Grundlagen & Funktionsweise', short: 'KI-Grundlagen', description: 'Was ist KI (insb. LLMs) und wie funktionieren diese Systeme grundlegend?', audience: 'Alle Mitarbeitenden', duration: '2h', color: 'blue' },
  { key: 'ai_types'     as const, label: 'Unterscheidung von KI-Typen', short: 'KI-Typen', description: 'Was ist der Unterschied zwischen Public-, privaten LLMs und individuellen Modellen?', audience: 'IT, Management', duration: '1.5h', color: 'indigo' },
  { key: 'data_safety'  as const, label: 'Sicherer Umgang mit Daten', short: 'Datensicherheit', description: 'Welche Daten dürfen in KI-Systeme eingegeben werden und welche nicht?', audience: 'Alle Mitarbeitenden', duration: '2h', color: 'red' },
  { key: 'opportunities'as const, label: 'Chancen & Grenzen von KI', short: 'Chancen & Grenzen', description: 'Wofür eignet sich KI gut und wo liegen typische Fehlerquellen oder Halluzinationen?', audience: 'Management, Fachbereiche', duration: '2h', color: 'amber' },
  { key: 'prompting'    as const, label: 'Best Practices im Prompting', short: 'Prompting', description: 'Wie formuliere ich effektive Anfragen, um qualitativ hochwertige Ergebnisse zu erhalten?', audience: 'Alle Anwender', duration: '3h', color: 'green' },
  { key: 'compliance'   as const, label: 'Compliance & Unternehmensrichtlinien', short: 'Compliance', description: 'Welche internen Vorgaben und rechtlichen Rahmenbedingungen müssen beim Einsatz beachtet werden?', audience: 'Management, Legal, HR', duration: '2h', color: 'orange' },
  { key: 'use_cases'    as const, label: 'Praxisnahe Anwendungsfälle', short: 'Anwendungsfälle', description: 'Wie kann KI konkret im eigenen Arbeitsbereich sinnvoll und effizient eingesetzt werden?', audience: 'Fachbereiche', duration: '4h (Workshop)', color: 'purple' },
]

export type TrainingTopicKey = typeof TRAINING_TOPICS[number]['key']
export type TrainingStatus = 'open' | 'planned' | 'done'
export type TrainingMap = Partial<Record<string, Partial<Record<TrainingTopicKey, TrainingStatus>>>>
export interface EnablementData { trainingMap: TrainingMap; adoptionPhase?: number }

export type MeetingStatus = 'active' | 'pending' | 'skip'
export interface MeetingConfig {
  status: MeetingStatus
  dayOfWeek: number   // 0=Mon..4=Fri
  startHour: number
  startMinute: number
}
export interface MeetingsData { configs: Record<string, MeetingConfig> }
