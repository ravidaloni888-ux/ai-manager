import { createClient } from '@supabase/supabase-js'
import { AIUseCase } from '../types'

const SUPABASE_URL = 'https://zvmujqhjqgzujmrvdxbr.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_Mru4tFYVXpUmBxnq98cvfw_-JoKYzGb'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export function rowToUseCase(row: Record<string, unknown>): AIUseCase {
  return {
    id: row.id as string,
    title: row.title as string,
    department: row.department as AIUseCase['department'],
    status: row.status as AIUseCase['status'],
    businessProblem: row.business_problem as string,
    successMetrics: row.success_metrics as string,
    dataRequirements: row.data_requirements as string,
    aiApproach: row.ai_approach as AIUseCase['aiApproach'],
    technicalFeasibility: row.technical_feasibility as AIUseCase['technicalFeasibility'],
    teamCompetencies: row.team_competencies as string,
    timeline: row.timeline as string,
    estimatedCostK: row.estimated_cost_k as number,
    expectedBenefitK: row.expected_benefit_k as number,
    businessImpact: row.business_impact as number,
    feasibility: row.feasibility as number,
    strategicFit: row.strategic_fit as number,
    urgency: row.urgency as number,
    priorityScore: row.priority_score as number,
    startDate: (row.start_date as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function useCaseToRow(uc: AIUseCase): Record<string, unknown> {
  return {
    id: uc.id,
    title: uc.title,
    department: uc.department,
    status: uc.status,
    business_problem: uc.businessProblem,
    success_metrics: uc.successMetrics,
    data_requirements: uc.dataRequirements,
    ai_approach: uc.aiApproach,
    technical_feasibility: uc.technicalFeasibility,
    team_competencies: uc.teamCompetencies,
    timeline: uc.timeline,
    estimated_cost_k: uc.estimatedCostK,
    expected_benefit_k: uc.expectedBenefitK,
    business_impact: uc.businessImpact,
    feasibility: uc.feasibility,
    strategic_fit: uc.strategicFit,
    urgency: uc.urgency,
    priority_score: uc.priorityScore,
    start_date: uc.startDate ?? null,
    created_at: uc.createdAt,
    updated_at: uc.updatedAt,
  }
}
