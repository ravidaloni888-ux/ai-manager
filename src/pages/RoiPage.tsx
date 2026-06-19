import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import { useUseCasesStore } from '../store/useCasesStore'

export default function RoiPage() {
  const { useCases } = useUseCasesStore()
  const navigate = useNavigate()

  const [selectedId, setSelectedId] = useState(useCases[0]?.id ?? '')
  const selected = useCases.find((uc) => uc.id === selectedId) ?? useCases[0]

  const [costK, setCostK]       = useState(selected?.estimatedCostK ?? 0)
  const [benefitK, setBenefitK] = useState(selected?.expectedBenefitK ?? 0)
  const [horizonYr, setHorizon] = useState(3)

  // When user switches use case, reset inputs to that case's values
  const handleSelect = (id: string) => {
    const uc = useCases.find((u) => u.id === id)
    if (!uc) return
    setSelectedId(id)
    setCostK(uc.estimatedCostK)
    setBenefitK(uc.expectedBenefitK)
  }

  const months = horizonYr * 12
  const monthlyBenefit = benefitK / 12

  // Month-by-month cumulative data
  const chartData = useMemo(() => {
    return Array.from({ length: months + 1 }, (_, m) => ({
      month: m,
      label: m === 0 ? 'Start' : `M${m}`,
      investment: costK,
      cumBenefit: +(monthlyBenefit * m).toFixed(1),
      net: +(monthlyBenefit * m - costK).toFixed(1),
    }))
  }, [costK, monthlyBenefit, months])

  // Payback month = first month where cumBenefit >= costK
  const paybackMonth = monthlyBenefit > 0 ? Math.ceil(costK / monthlyBenefit) : null
  const paybackWithinHorizon = paybackMonth !== null && paybackMonth <= months

  const totalBenefit = benefitK * horizonYr
  const roi = costK > 0 ? Math.round(((totalBenefit - costK) / costK) * 100) : 0
  const netValue = totalBenefit - costK

  const roiColor = roi >= 100 ? 'text-green-600' : roi >= 0 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ROI Calculator</h1>
        <p className="text-sm text-slate-500 mt-0.5">Linked to your AI use cases — adjust assumptions and see the return.</p>
      </div>

      {/* Use case selector */}
      <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Use Case</label>
          <div className="flex items-center gap-3">
            <select
              value={selectedId}
              onChange={(e) => handleSelect(e.target.value)}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {useCases.map((uc) => (
                <option key={uc.id} value={uc.id}>{uc.title}</option>
              ))}
            </select>
            {selected && (
              <button
                onClick={() => navigate(`/canvas/${selected.id}`)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold whitespace-nowrap"
              >
                Open canvas →
              </button>
            )}
          </div>
        </div>

        {/* Editable inputs */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Investment Cost (€k)</label>
            <input
              type="number"
              value={costK}
              onChange={(e) => setCostK(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Annual Benefit (€k)</label>
            <input
              type="number"
              value={benefitK}
              onChange={(e) => setBenefitK(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Horizon</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 5].map((y) => (
                <button
                  key={y}
                  onClick={() => setHorizon(y)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    horizonYr === y
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  {y}y
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Result cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 space-y-1">
          <p className="text-xs text-slate-500">{horizonYr}-Year ROI</p>
          <p className={`text-3xl font-bold ${roiColor}`}>{roi}%</p>
          <p className="text-xs text-slate-400">on €{costK.toLocaleString()}k invested</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 space-y-1">
          <p className="text-xs text-slate-500">Net Value</p>
          <p className={`text-3xl font-bold ${netValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            €{netValue.toLocaleString()}k
          </p>
          <p className="text-xs text-slate-400">benefit minus cost</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 space-y-1">
          <p className="text-xs text-slate-500">Payback Period</p>
          {paybackMonth === null || costK === 0 ? (
            <p className="text-3xl font-bold text-slate-400">—</p>
          ) : paybackWithinHorizon ? (
            <>
              <p className="text-3xl font-bold text-blue-600">
                {paybackMonth < 12 ? `${paybackMonth}m` : `${Math.round(paybackMonth / 1.2) / 10}y`}
              </p>
              <p className="text-xs text-slate-400">
                {paybackMonth >= 12
                  ? `${paybackMonth} months`
                  : `within first year`}
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-amber-500">{Math.ceil(paybackMonth / 12)}y+</p>
              <p className="text-xs text-slate-400">beyond {horizonYr}-yr horizon</p>
            </>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 space-y-1">
          <p className="text-xs text-slate-500">Total Benefit</p>
          <p className="text-3xl font-bold text-slate-800">€{totalBenefit.toLocaleString()}k</p>
          <p className="text-xs text-slate-400">over {horizonYr} year{horizonYr !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Break-even chart */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Break-even Chart</h3>
          {paybackWithinHorizon && paybackMonth !== null && (
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
              Break-even at month {paybackMonth}
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ left: 10, right: 10, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="benefitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval={Math.floor(months / 6)}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `€${v}k`}
            />
            <Tooltip
              formatter={(v: number, name: string) => [
                `€${v.toLocaleString()}k`,
                name === 'investment' ? 'Total Investment' : 'Cumulative Benefit',
              ]}
              labelFormatter={(l) => `${l}`}
            />
            <Legend
              formatter={(v) => v === 'investment' ? 'Investment' : 'Cumulative Benefit'}
              iconType="circle"
              iconSize={8}
            />
            {paybackWithinHorizon && paybackMonth !== null && (
              <ReferenceLine
                x={`M${paybackMonth}`}
                stroke="#22c55e"
                strokeDasharray="4 3"
                label={{ value: 'Break-even', position: 'top', fontSize: 10, fill: '#16a34a' }}
              />
            )}
            <Area type="monotone" dataKey="investment" stroke="#3b82f6" strokeWidth={2} fill="url(#costGrad)"    dot={false} />
            <Area type="monotone" dataKey="cumBenefit" stroke="#22c55e" strokeWidth={2} fill="url(#benefitGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
