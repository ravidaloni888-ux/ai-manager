import { NavLink } from 'react-router-dom'

interface NavItemProps {
  to?: string
  icon: string
  label: string
  disabled?: boolean
  badge?: string
}

export default function NavItem({ to, icon, label, disabled, badge }: NavItemProps) {
  if (disabled) {
    return (
      <div
        title={`Coming in ${badge}`}
        className="group flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 cursor-not-allowed select-none"
      >
        <span className="text-base leading-none">{icon}</span>
        <span className="text-sm">{label}</span>
        {badge && (
          <span className="ml-auto text-[10px] font-semibold bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
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
            ? 'bg-blue-600 text-white font-medium'
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`
      }
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </NavLink>
  )
}
