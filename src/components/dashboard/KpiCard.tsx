interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  icon: string
  color?: string
}

export default function KpiCard({ label, value, sub, icon, color = 'bg-blue-50 text-blue-600' }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`${color} rounded-lg p-2.5 text-xl leading-none`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
