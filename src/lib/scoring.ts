export function computePriorityScore(
  businessImpact: number,
  feasibility: number,
  strategicFit: number,
  urgency: number,
): number {
  return +(businessImpact * 0.4 + feasibility * 0.3 + strategicFit * 0.2 + urgency * 0.1).toFixed(1)
}

// 3-year ROI: (benefit*3 - cost) / cost * 100
export function computeROI(estimatedCostK: number, expectedBenefitK: number): number {
  if (estimatedCostK === 0) return 0
  return +((expectedBenefitK * 3 - estimatedCostK) / estimatedCostK * 100).toFixed(0)
}

export function scoreColor(score: number): string {
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-amber-600'
  if (score >= 4) return 'text-orange-500'
  return 'text-red-500'
}

export function scoreBg(score: number): string {
  if (score >= 8) return 'bg-green-500'
  if (score >= 6) return 'bg-amber-400'
  if (score >= 4) return 'bg-orange-400'
  return 'bg-red-500'
}
