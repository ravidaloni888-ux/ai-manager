import { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

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
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}
