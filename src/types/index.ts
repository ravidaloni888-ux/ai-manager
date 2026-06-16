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

export type Status = 'Idea' | 'Evaluation' | 'Pilot' | 'Production' | 'Cancelled'

export type AIApproach =
  | 'Supervised Learning'
  | 'Unsupervised Learning'
  | 'Reinforcement Learning'
  | 'Generative AI'
  | 'Computer Vision'
  | 'NLP'

export type TechnicalFeasibility = 'Low' | 'Medium' | 'High'

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

  startDate?: string

  createdAt: string
  updatedAt: string
}

export const DEPARTMENTS: Department[] = [
  'Sales', 'Operations', 'Customer Service', 'Finance',
  'HR', 'IT', 'Legal', 'Marketing', 'Logistics', 'Other',
]

export const STATUSES: Status[] = ['Idea', 'Evaluation', 'Pilot', 'Production', 'Cancelled']

export const AI_APPROACHES: AIApproach[] = [
  'Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning',
  'Generative AI', 'Computer Vision', 'NLP',
]

export const FEASIBILITIES: TechnicalFeasibility[] = ['Low', 'Medium', 'High']

export const STATUS_COLORS: Record<Status, string> = {
  Idea:       '#94a3b8',
  Evaluation: '#f59e0b',
  Pilot:      '#3b82f6',
  Production: '#22c55e',
  Cancelled:  '#ef4444',
}

export const STATUS_BG: Record<Status, string> = {
  Idea:       'bg-slate-100 text-slate-600',
  Evaluation: 'bg-amber-100 text-amber-700',
  Pilot:      'bg-blue-100 text-blue-700',
  Production: 'bg-green-100 text-green-700',
  Cancelled:  'bg-red-100 text-red-600',
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
