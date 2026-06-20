import { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useWizardStore, ROUTE_STEPS } from '../../store/wizardStore'
import { useDemoStore } from '../../store/demoStore'

interface NavItemProps {
  to?: string
  icon: ReactNode
  label: string
  disabled?: boolean
  badge?: string
}

export default function NavItem({ to, icon, label, disabled, badge }: NavItemProps) {
  const { search } = useLocation()
  const fromWizard = new URLSearchParams(search).get('from') === 'wizard'
  const demoMode = useDemoStore((s) => s.demoMode)
  const done = useWizardStore((s) => s.done)
  const steps = to ? ROUTE_STEPS[to] : undefined
  const incomplete = !demoMode && !!steps && !steps.some((id) => done.has(id))
  if (disabled) {
    return (
      <div
        title={`Coming in ${badge}`}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 cursor-not-allowed select-none"
      >
        <span className="opacity-40">{icon}</span>
        <span className="text-sm">{label}</span>
        {badge && (
          <span className="ml-auto text-[10px] font-semibold bg-white/10 text-slate-400 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={to!}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? `bg-blue-600 text-white font-medium${fromWizard ? ' nav-pulse' : ''}`
            : `hover:bg-white/10 hover:text-white ${incomplete ? 'text-slate-300/50' : 'text-slate-300'}`
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}
