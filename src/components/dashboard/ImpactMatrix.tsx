import { useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ResponsiveContainer, ZAxis, Label,
} from 'recharts'
import { AIUseCase, Status, STATUS_COLORS } from '../../types'

interface Props {
  useCases: AIUseCase[]
}

interface Point {
  x: number
  y: number
  z: number
  title: string
  status: Status
  dept: string
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d: Point = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow text-xs space-y-1">
      <p className="font-semibold text-slate-800">{d.title}</p>
      <p className="text-slate-500">{d.dept}</p>
      <p>Feasibility: <strong>{d.x}/10</strong></p>
      <p>Business Impact: <strong>{d.y}/10</strong></p>
      <p>Est. Cost: <strong>€{d.z}k</strong></p>
    </div>
  )
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props
  if (cx === undefined || cy === undefined) return null
  const color = STATUS_COLORS[payload.status as Status] || '#94a3b8'
  const r = Math.max(7, Math.sqrt(payload.z) * 0.9)
  return (
    <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.75} stroke={color} strokeWidth={1.5} />
  )
}

export default function ImpactMatrix({ useCases }: Props) {
  const points: Point[] = useMemo(() =>
    useCases.map((uc) => ({
      x: uc.feasibility,
      y: uc.businessImpact,
      z: uc.estimatedCostK,
      title: uc.title,
      status: uc.status,
      dept: uc.department,
    })), [useCases])

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">
        Impact / Feasibility Matrix
      </h3>
      <p className="text-xs text-slate-400 mb-4">Bubble size = estimated cost · Color = status</p>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          {/* Quadrant backgrounds */}
          <ReferenceArea x1={0} x2={5} y1={5} y2={10} fill="#fef9c3" fillOpacity={0.4} />
          <ReferenceArea x1={5} x2={10} y1={5} y2={10} fill="#dcfce7" fillOpacity={0.4} />
          <ReferenceArea x1={0} x2={5} y1={0} y2={5} fill="#fee2e2" fillOpacity={0.3} />
          <ReferenceArea x1={5} x2={10} y1={0} y2={5} fill="#dbeafe" fillOpacity={0.3} />

          <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
          <XAxis type="number" dataKey="x" domain={[0, 10]} tick={{ fontSize: 11 }}>
            <Label value="Feasibility →" position="insideBottom" offset={-15} style={{ fontSize: 11, fill: '#64748b' }} />
          </XAxis>
          <YAxis type="number" dataKey="y" domain={[0, 10]} tick={{ fontSize: 11 }}>
            <Label value="Business Impact →" angle={-90} position="insideLeft" offset={10} style={{ fontSize: 11, fill: '#64748b' }} />
          </YAxis>
          <ZAxis type="number" dataKey="z" range={[40, 600]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={points} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Quadrant legend */}
      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200" />
          <span className="text-slate-500">Strategic Bets (high impact, hard)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
          <span className="text-slate-500">Quick Wins (high impact, easy)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
          <span className="text-slate-500">Avoid (low impact, hard)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
          <span className="text-slate-500">Defer (low impact, easy)</span>
        </div>
      </div>
    </div>
  )
}
