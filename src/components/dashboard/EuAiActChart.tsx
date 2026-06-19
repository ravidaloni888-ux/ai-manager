import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AIUseCase, EU_AI_ACT_RISKS, EuAiActRisk } from '../../types'

interface Props {
  useCases: AIUseCase[]
}

const RISK_COLORS: Record<EuAiActRisk, string> = {
  'Minimal Risk':      '#22c55e',
  'Limited Risk':      '#f59e0b',
  'High Risk':         '#f97316',
  'Unacceptable Risk': '#ef4444',
}

const DPIA_URL = 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/how-do-we-do-a-dpia/'

export default function EuAiActChart({ useCases }: Props) {
  const data = useMemo(() => {
    const counts: Record<EuAiActRisk, number> = {
      'Minimal Risk': 0, 'Limited Risk': 0, 'High Risk': 0, 'Unacceptable Risk': 0,
    }
    useCases.forEach((uc) => {
      if (uc.euAiActRisk && counts[uc.euAiActRisk as EuAiActRisk] !== undefined) {
        counts[uc.euAiActRisk as EuAiActRisk]++
      }
    })
    return EU_AI_ACT_RISKS.map((r) => ({ name: r, count: counts[r] }))
  }, [useCases])

  const highRiskCount = data.find((d) => d.name === 'High Risk')?.count ?? 0
  const unacceptableCount = data.find((d) => d.name === 'Unacceptable Risk')?.count ?? 0
  const needsDpia = highRiskCount + unacceptableCount > 0

  return (
    <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-slate-700">EU AI Act Risk Distribution</h3>
        {needsDpia && (
          <a
            href={DPIA_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            DPIA required — ICO Guide →
          </a>
        )}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v} Use Cases`, 'Count']} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.name} fill={RISK_COLORS[d.name as EuAiActRisk]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {needsDpia && (
        <p className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
          <strong>{highRiskCount + unacceptableCount} use case{highRiskCount + unacceptableCount !== 1 ? 's' : ''}</strong> flagged as High Risk or Unacceptable Risk require a{' '}
          <a href={DPIA_URL} target="_blank" rel="noreferrer" className="underline font-semibold">
            Data Protection Impact Assessment (DPIA)
          </a>{' '}
          under GDPR Art. 35.
        </p>
      )}
    </div>
  )
}
