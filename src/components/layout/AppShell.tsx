import { ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavItem from './NavItem'
import {
  IconDashboard, IconList, IconChartBar, IconMap,
  IconAlert, IconBuilding, IconCurrency, IconFlag, IconSearch,
  IconBrain, IconPlus, IconSettings,
} from '../icons/NavIcons'
import { useAuthStore } from '../../store/authStore'
import BetaRequestModal from './BetaRequestModal'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const [showBeta, setShowBeta] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#e8eff7' }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col no-print" style={{ background: '#1a2538' }}>
        {/* Brand */}
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <IconBrain />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">AI Manager</p>
              <p className="text-slate-400 text-xs">Release 1.0</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pb-2">
            Core
          </p>
          <NavItem to="/dashboard" icon={<IconDashboard />} label="Dashboard" />
          <NavItem to="/use-cases" icon={<IconList />} label="AI Use Cases" />
          <NavItem to="/settings" icon={<IconSettings />} label="Settings" />

          <div className="pt-4" />

          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pb-2">
            Release 2
          </p>
          <NavItem icon={<IconChartBar />} label="Maturity Assessment" disabled badge="R2" />
          <NavItem icon={<IconMap />} label="Strategy Wizard" disabled badge="R2" />

          <div className="pt-4" />

          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pb-2">
            Release 3
          </p>
          <NavItem icon={<IconAlert />} label="Risk Manager" disabled badge="R3" />
          <NavItem icon={<IconBuilding />} label="Governance Center" disabled badge="R3" />
          <NavItem icon={<IconCurrency />} label="ROI Calculator" disabled badge="R3" />
          <NavItem icon={<IconFlag />} label="Roadmap Generator" disabled badge="R3" />
          <NavItem icon={<IconSearch />} label="Vendor Comparison" disabled badge="R3" />
        </nav>

        {/* Footer action */}
        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          {user ? (
            <>
              <button
                onClick={() => navigate('/canvas/new')}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 px-3 rounded-lg transition-colors"
              >
                <IconPlus /> New Use Case
              </button>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-slate-400 truncate max-w-[120px]">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBeta(true)}
                className="flex-shrink-0 text-xs text-slate-300 hover:text-white border border-white/20 hover:border-white/40 px-2.5 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                Request access
              </button>
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 text-slate-500 text-sm font-medium py-2 px-2 rounded-lg cursor-not-allowed"
              >
                <IconPlus /> New Use Case
              </button>
            </div>
          )}
          {showBeta && <BetaRequestModal onClose={() => setShowBeta(false)} />}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
