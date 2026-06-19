import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUseCasesStore } from '../store/useCasesStore'
import { computeROI, scoreColor } from '../lib/scoring'
import { STATUS_BG, Status } from '../types'
import KpiCard from '../components/dashboard/KpiCard'
import StatusChart from '../components/dashboard/StatusChart'
import DeptChart from '../components/dashboard/DeptChart'
import ImpactMatrix from '../components/dashboard/ImpactMatrix'
import EuAiActChart from '../components/dashboard/EuAiActChart'
import StartBanner from '../components/dashboard/StartBanner'
import { IconClipboard, IconRocket, IconStar, IconMoneybag, IconTrendingUp, IconPlus } from '../components/icons/NavIcons'
import { useAuthStore } from '../store/authStore'

export default function DashboardPage() {
  const { useCases } = useUseCasesStore()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const stats = useMemo(() => {
    const total = useCases.length
    const inProduction = useCases.filter((uc) => uc.status === 'Production').length
    const avgScore = total
      ? +(useCases.reduce((s, uc) => s + uc.priorityScore, 0) / total).toFixed(1)
      : 0
    const totalBenefit = useCases.reduce((s, uc) => s + uc.expectedBenefitK, 0)
    const totalCost = useCases.reduce((s, uc) => s + uc.estimatedCostK, 0)
    const portfolioROI = computeROI(totalCost, totalBenefit)
    return { total, inProduction, avgScore, totalBenefit, totalCost, portfolioROI }
  }, [useCases])

  const top5 = useMemo(
    () => [...useCases].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5),
    [useCases],
  )

  return (
    <div className="p-6 space-y-6">
      {/* Getting Started banner */}
      <StartBanner />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">AI Use Case Portfolio Overview</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          label="Total Use Cases"
          value={stats.total}
          icon={<IconClipboard />}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="In Production"
          value={stats.inProduction}
          sub={`${Math.round((stats.inProduction / stats.total) * 100)}% of portfolio`}
          icon={<IconRocket />}
          color="bg-green-50 text-green-600"
        />
        <KpiCard
          label="Avg Priority Score"
          value={stats.avgScore}
          sub="out of 10.0"
          icon={<IconStar />}
          color="bg-amber-50 text-amber-600"
        />
        <KpiCard
          label="Total Annual Benefit"
          value={`€${stats.totalBenefit.toLocaleString()}k`}
          sub="expected per year"
          icon={<IconMoneybag />}
          color="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="3-Y Portfolio ROI"
          value={`${stats.portfolioROI}%`}
          sub={`€${stats.totalCost.toLocaleString()}k invested`}
          icon={<IconTrendingUp />}
          color="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatusChart useCases={useCases} />
        <DeptChart useCases={useCases} />
      </div>

      {/* EU AI Act risk chart */}
      <EuAiActChart useCases={useCases} />

      {/* Impact / Feasibility Matrix */}
      <ImpactMatrix useCases={useCases} />

      {/* Top 5 */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Top 5 Use Cases by Priority Score</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
              <th className="text-left py-2 font-semibold">#</th>
              <th className="text-left py-2 font-semibold">Title</th>
              <th className="text-left py-2 font-semibold">Department</th>
              <th className="text-left py-2 font-semibold">Phase</th>
              <th className="text-right py-2 font-semibold">Score</th>
              <th className="text-right py-2 font-semibold">3-Y ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {top5.map((uc, i) => {
              const roi = computeROI(uc.estimatedCostK, uc.expectedBenefitK)
              return (
                <tr
                  key={uc.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/canvas/${uc.id}`)}
                >
                  <td className="py-2.5 pr-2 text-slate-400 font-medium">{i + 1}</td>
                  <td className="py-2.5 font-medium text-blue-600 hover:underline">{uc.title}</td>
                  <td className="py-2.5 text-slate-500">{uc.department}</td>
                  <td className="py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BG[uc.status as Status]}`}>
                      {uc.status}
                    </span>
                  </td>
                  <td className={`py-2.5 text-right font-bold ${scoreColor(uc.priorityScore)}`}>
                    {uc.priorityScore}
                  </td>
                  <td className={`py-2.5 text-right font-medium ${roi > 200 ? 'text-green-600' : 'text-amber-600'}`}>
                    {roi}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
