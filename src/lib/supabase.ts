import { createClient } from '@supabase/supabase-js'
import { AIUseCase, ProjectHealth, EuAiActRisk, GovernanceData, EnablementData, TrainingMap, MeetingsData } from '../types'

function legacyHealth(raw: string | undefined): ProjectHealth {
  if (raw === 'Green' || raw === 'On Track') return 'On Track'
  if (raw === 'Amber' || raw === 'At Risk') return 'At Risk'
  if (raw === 'Red' || raw === 'Blocked') return 'Blocked'
  return 'On Track'
}

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
    projectHealth: legacyHealth(row.project_health as string),
    motivation: (row.motivation as string) ?? undefined,
    euAiActRisk: (row.eu_ai_act_risk as EuAiActRisk) ?? 'Minimal Risk',
    complianceLegal: (row.compliance_legal as boolean) ?? false,
    compliancePersonalData: (row.compliance_personal_data as boolean) ?? false,
    complianceDataMin: (row.compliance_data_min as boolean) ?? false,
    complianceDocumentation: (row.compliance_documentation as boolean) ?? false,
    complianceLiability: (row.compliance_liability as boolean) ?? false,
    startDate: (row.start_date as string) ?? undefined,
    cancellationReason: (row.cancellation_reason as string) ?? undefined,
    docGoal:          (row.doc_goal as string)           ?? undefined,
    docDataBasis:     (row.doc_data_basis as string)     ?? undefined,
    docRiskMitigation:(row.doc_risk_mitigation as string)?? undefined,
    docExplainability:(row.doc_explainability as string) ?? undefined,
    docOperations:    (row.doc_operations as string)     ?? undefined,
    docRegulatory:    (row.doc_regulatory as string)     ?? undefined,
    docVersioning:    (row.doc_versioning as string)     ?? undefined,
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
    project_health: uc.projectHealth ?? 'On Track',
    motivation: uc.motivation ?? null,
    eu_ai_act_risk: uc.euAiActRisk ?? 'Minimal Risk',
    compliance_legal: uc.complianceLegal ?? false,
    compliance_personal_data: uc.compliancePersonalData ?? false,
    compliance_data_min: uc.complianceDataMin ?? false,
    compliance_documentation: uc.complianceDocumentation ?? false,
    compliance_liability: uc.complianceLiability ?? false,
    start_date: uc.startDate ?? null,
    cancellation_reason: uc.cancellationReason ?? null,
    doc_goal:           uc.docGoal           ?? null,
    doc_data_basis:     uc.docDataBasis      ?? null,
    doc_risk_mitigation:uc.docRiskMitigation ?? null,
    doc_explainability: uc.docExplainability ?? null,
    doc_operations:     uc.docOperations     ?? null,
    doc_regulatory:     uc.docRegulatory     ?? null,
    doc_versioning:     uc.docVersioning     ?? null,
    created_at: uc.createdAt,
    updated_at: uc.updatedAt,
  }
}

const DEFAULT_GOVERNANCE: GovernanceData = {
  richtlinie: { zweck: '', daten: '', transparenz: '', verantwortlichkeiten: '', risikomanagement: '', ethik: '', schulung: '' },
  roles: { aiOwner: '', dpo: '', security: '', ethics: '', business: '' },
  steps: { step1: false, step2: false, step3: false, step4: false, step5: false, step6: false, step7: false, step8: false, step9: false },
}

export async function loadGovernance(): Promise<GovernanceData> {
  const { data } = await supabase.from('ai_governance').select('*').eq('id', 'singleton').single()
  if (!data) return DEFAULT_GOVERNANCE
  return {
    richtlinie: {
      zweck: data.richtlinie_zweck ?? '',
      daten: data.richtlinie_daten ?? '',
      transparenz: data.richtlinie_transparenz ?? '',
      verantwortlichkeiten: data.richtlinie_verantwortlichkeiten ?? '',
      risikomanagement: data.richtlinie_risikomanagement ?? '',
      ethik: data.richtlinie_ethik ?? '',
      schulung: data.richtlinie_schulung ?? '',
    },
    roles: {
      aiOwner: data.role_ai_owner ?? '',
      dpo: data.role_dpo ?? '',
      security: data.role_security ?? '',
      ethics: data.role_ethics ?? '',
      business: data.role_business ?? '',
    },
    steps: {
      step1: data.step1 ?? false, step2: data.step2 ?? false, step3: data.step3 ?? false,
      step4: data.step4 ?? false, step5: data.step5 ?? false, step6: data.step6 ?? false,
      step7: data.step7 ?? false, step8: data.step8 ?? false, step9: data.step9 ?? false,
    },
  }
}

const DEFAULT_ENABLEMENT: EnablementData = { trainingMap: {} }

export async function loadEnablement(): Promise<EnablementData> {
  try {
    const { data } = await supabase.from('ai_enablement').select('*').eq('id', 'singleton').single()
    if (!data) return DEFAULT_ENABLEMENT
    return { trainingMap: (data.training_map as TrainingMap) ?? {} }
  } catch {
    return DEFAULT_ENABLEMENT
  }
}

export async function saveEnablement(d: EnablementData): Promise<void> {
  await supabase.from('ai_enablement').upsert({
    id: 'singleton',
    training_map: d.trainingMap,
    updated_at: new Date().toISOString(),
  })
}

export async function loadMeetings(): Promise<MeetingsData> {
  try {
    const { data } = await supabase.from('ai_meetings').select('*').eq('id', 'singleton').single()
    if (!data) return { configs: {} }
    return { configs: (data.configs as MeetingsData['configs']) ?? {} }
  } catch {
    return { configs: {} }
  }
}

export async function saveMeetings(d: MeetingsData): Promise<void> {
  await supabase.from('ai_meetings').upsert({
    id: 'singleton',
    configs: d.configs,
    updated_at: new Date().toISOString(),
  })
}

export async function saveGovernance(g: GovernanceData): Promise<void> {
  await supabase.from('ai_governance').upsert({
    id: 'singleton',
    richtlinie_zweck: g.richtlinie.zweck,
    richtlinie_daten: g.richtlinie.daten,
    richtlinie_transparenz: g.richtlinie.transparenz,
    richtlinie_verantwortlichkeiten: g.richtlinie.verantwortlichkeiten,
    richtlinie_risikomanagement: g.richtlinie.risikomanagement,
    richtlinie_ethik: g.richtlinie.ethik,
    richtlinie_schulung: g.richtlinie.schulung,
    role_ai_owner: g.roles.aiOwner,
    role_dpo: g.roles.dpo,
    role_security: g.roles.security,
    role_ethics: g.roles.ethics,
    role_business: g.roles.business,
    step1: g.steps.step1, step2: g.steps.step2, step3: g.steps.step3,
    step4: g.steps.step4, step5: g.steps.step5, step6: g.steps.step6,
    step7: g.steps.step7, step8: g.steps.step8, step9: g.steps.step9,
    updated_at: new Date().toISOString(),
  })
}
