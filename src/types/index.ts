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
