import { useNavigate } from 'react-router-dom'
import { AIUseCase, STATUSES, STATUS_COLORS, STATUS_BG, EU_AI_ACT_BG, EuAiActRisk } from '../../types'
import { scoreColor } from '../../lib/scoring'

interface Props {
  useCases: AIUseCase[]
  onEdit: (id: string) => void
}

const DEPT_BG: Record<string, string> = {
  Sales:            'bg-blue-100 text-blue-700',
  Operations:       'bg-green-100 text-green-700',
  'Customer Service': 'bg-pink-100 text-pink-700',
  Finance:          'bg-yellow-100 text-yellow-700',
  HR:               'bg-rose-100 text-rose-700',
  IT:               'bg-indigo-100 text-indigo-700',
  Legal:            'bg-purple-100 text-purple-700',
  Marketing:        'bg-orange-100 text-orange-700',
  Logistics:        'bg-cyan-100 text-cyan-700',
  Other:            'bg-slate-100 text-slate-600',
}

export default function PipelineView({ useCases, onEdit }: Props) {
  const navigate = useNavigate()

  const lanes = STATUSES.map((status) => ({
    status,
    cases: useCases.filter((uc) => uc.status === status),
  })).filter((lane) => lane.cases.length > 0)

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {lanes.map(({ status, cases }) => {
          const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS]
          return (
            <div key={status} className="w-56 flex-shrink-0">
              {/* Lane header */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-t-lg mb-1"
                style={{ background: color + '22', borderBottom: `2px solid ${color}` }}
              >
                <span className="text-xs font-bold text-slate-700">{status}</span>
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: color }}
                >
                  {cases.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {cases.map((uc) => (
                  <div
                    key={uc.id}
                    onClick={() => onEdit(uc.id)}
                    className="bg-white rounded-lg shadow-sm border border-slate-100 p-3 cursor-pointer hover:shadow-md hover:border-slate-200 transition-all group"
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    <p className="text-xs font-semibold text-slate-800 leading-snug mb-2 group-hover:text-blue-700 transition-colors">
                      {uc.title}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${DEPT_BG[uc.department] ?? DEPT_BG.Other}`}>
                        {uc.department}
                      </span>
                      {uc.euAiActRisk && uc.euAiActRisk !== 'Minimal Risk' && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${EU_AI_ACT_BG[uc.euAiActRisk as EuAiActRisk]}`}>
                          {uc.euAiActRisk}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{uc.aiApproach}</span>
                      <span className={`text-xs font-bold ${scoreColor(uc.priorityScore)}`}>
                        {uc.priorityScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
