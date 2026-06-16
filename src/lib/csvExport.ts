import { AIUseCase } from '../types'
import { computeROI } from './scoring'

function esc(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportToCSV(useCases: AIUseCase[]) {
  const headers = [
    'Title', 'Department', 'Status', 'AI Approach', 'Technical Feasibility',
    'Business Impact (1-10)', 'Feasibility (1-10)', 'Strategic Fit (1-10)', 'Urgency (1-10)',
    'Priority Score', 'Estimated Cost (€k)', 'Expected Annual Benefit (€k)', '3-Year ROI (%)',
    'Timeline', 'Business Problem', 'Success Metrics', 'Data Requirements',
    'Team Competencies', 'Created At',
  ]

  const rows = useCases.map(uc => [
    esc(uc.title),
    esc(uc.department),
    esc(uc.status),
    esc(uc.aiApproach),
    esc(uc.technicalFeasibility),
    esc(uc.businessImpact),
    esc(uc.feasibility),
    esc(uc.strategicFit),
    esc(uc.urgency),
    esc(uc.priorityScore),
    esc(uc.estimatedCostK),
    esc(uc.expectedBenefitK),
    esc(computeROI(uc.estimatedCostK, uc.expectedBenefitK)),
    esc(uc.timeline),
    esc(uc.businessProblem),
    esc(uc.successMetrics),
    esc(uc.dataRequirements),
    esc(uc.teamCompetencies),
    esc(new Date(uc.createdAt).toLocaleDateString()),
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ai-use-cases-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
