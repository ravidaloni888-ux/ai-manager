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

export type Motivation =
  | 'Cost Reduction'
  | 'Time Saving'
  | 'Error Reduction'
  | 'Revenue Growth'
  | 'Customer Experience'
  | 'Risk & Compliance'
  | 'Quality Improvement'
  | 'Competitive Advantage'
  | 'Scalability'
  | 'Data & Insights'
  | 'Employee Experience'
  | 'Sustainability'

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

export interface StrategyData {
  vision: string
  horizon: '1' | '2' | '3' | '5'
  objectives: string[]
  challenge: string
  focusAreas: StrategyFocusArea[]
  budgetTotalK: number
  targetRoiPct: number
  kpis: StrategyKPI[]
}

export const DEFAULT_STRATEGY: StrategyData = {
  vision: 'By 2029, AI will be embedded in every customer-facing and core operational process — enabling our teams to focus on high-value decisions while intelligent systems handle routine tasks, forecasting, and quality control at scale.',
  horizon: '3',
  objectives: [
    'Deploy AI in production across at least 12 use cases by Q4 2027, covering Sales, Operations and Finance',
    'Achieve €2M in annual AI-driven cost savings and revenue uplift by end of 2027',
    'Ensure 80+ employees are AI-literate and 5 certified AI Champions active across departments by Q1 2027',
  ],
  challenge: 'A key competitor launched an AI-powered pricing and service platform in Q1 2026, reducing our win rate by 11% in the enterprise segment. Manual processes in Operations and Finance are costing an estimated €4M per year in avoidable overhead. Without accelerating AI adoption now, the gap will widen.',
  focusAreas: [
    { theme: 'Customer Experience',    priority: 'High',   note: 'Chatbot rollout + personalised service automation across all touchpoints' },
    { theme: 'Operational Efficiency', priority: 'High',   note: 'Predictive maintenance, demand forecasting and invoice automation in scope' },
    { theme: 'Revenue Growth',         priority: 'High',   note: 'Recommendation engine and dynamic pricing already in production' },
    { theme: 'Risk & Compliance',      priority: 'Medium', note: 'Fraud detection live; credit risk AI under regulatory review' },
    { theme: 'Innovation & R&D',       priority: 'Low',    note: 'Exploratory budget reserved for GenAI prototypes in H2' },
    { theme: 'HR & Talent',            priority: 'Medium', note: 'Resume screening and attrition prediction planned for next cycle' },
    { theme: 'Data & Analytics',       priority: 'Medium', note: 'Sentiment analysis and lead scoring to improve decision-making' },
    { theme: 'Sustainability',         priority: 'Low',    note: 'Energy forecasting pilot to support ESG reporting commitments' },
  ],
  budgetTotalK: 2500,
  targetRoiPct: 250,
  kpis: [
    { id: 'kpi-1', metric: 'Use cases in production',           current: '5',   target: '12',   deadline: 'Q4 2027' },
    { id: 'kpi-2', metric: 'AI-trained employees',              current: '12',  target: '80',   deadline: 'Q1 2027' },
    { id: 'kpi-3', metric: 'Annual AI-driven savings (€k)',     current: '0',   target: '2000', deadline: 'Q4 2027' },
    { id: 'kpi-4', metric: '% of key processes AI-supported',  current: '8%',  target: '30%',  deadline: 'Q2 2027' },
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

export const MOTIVATIONS: Motivation[] = [
  'Cost Reduction',
  'Time Saving',
  'Error Reduction',
  'Revenue Growth',
  'Customer Experience',
  'Risk & Compliance',
  'Quality Improvement',
  'Competitive Advantage',
  'Scalability',
  'Data & Insights',
  'Employee Experience',
  'Sustainability',
]

export const MOTIVATION_BG: Record<Motivation, string> = {
  'Cost Reduction':       'bg-emerald-100 text-emerald-700',
  'Time Saving':          'bg-blue-100 text-blue-700',
  'Error Reduction':      'bg-orange-100 text-orange-700',
  'Revenue Growth':       'bg-green-100 text-green-700',
  'Customer Experience':  'bg-pink-100 text-pink-700',
  'Risk & Compliance':    'bg-red-100 text-red-700',
  'Quality Improvement':  'bg-violet-100 text-violet-700',
  'Competitive Advantage':'bg-indigo-100 text-indigo-700',
  'Scalability':          'bg-cyan-100 text-cyan-700',
  'Data & Insights':      'bg-amber-100 text-amber-700',
  'Employee Experience':  'bg-teal-100 text-teal-700',
  'Sustainability':       'bg-lime-100 text-lime-700',
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
export interface EnablementData { trainingMap: TrainingMap }

export type MeetingStatus = 'active' | 'pending' | 'skip'
export interface MeetingConfig {
  status: MeetingStatus
  dayOfWeek: number   // 0=Mon..4=Fri
  startHour: number
  startMinute: number
}
export interface MeetingsData { configs: Record<string, MeetingConfig> }
