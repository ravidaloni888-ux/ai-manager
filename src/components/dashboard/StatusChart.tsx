import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AIUseCase, Status, STATUS_COLORS, STATUSES } from '../../types'

interface Props {
  useCases: AIUseCase[]
}

export default function StatusChart({ useCases }: Props) {
  const data = useMemo(() => {
    const counts: Record<Status, number> = {
      Idea: 0, Evaluation: 0, Pilot: 0, Production: 0, Cancelled: 0,
    }
    useCases.forEach((uc) => { counts[uc.status]++ })
    return STATUSES.map((s) => ({ name: s, value: counts[s] })).filter((d) => d.value > 0)
  }, [useCases])

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Status Distribution</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={STATUS_COLORS[entry.name as Status]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} cases`, '']} />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
