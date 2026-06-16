import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import NavItem from './NavItem'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 flex flex-col no-print">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-white font-bold text-sm leading-tight">AI Manager</p>
              <p className="text-slate-400 text-xs">Release 1.0</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* Release 1 */}
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pb-1">
            Core
          </p>
          <NavItem to="/dashboard" icon="📊" label="Dashboard" />
          <NavItem to="/use-cases" icon="📋" label="AI Use Cases" />

          <div className="pt-3" />

          {/* Release 2 */}
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pb-1">
            Release 2
          </p>
          <NavItem icon="📈" label="Maturity Assessment" disabled badge="R2" />
          <NavItem icon="🗺️" label="Strategy Wizard" disabled badge="R2" />

          <div className="pt-3" />

          {/* Release 3 */}
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pb-1">
            Release 3
          </p>
          <NavItem icon="⚠️" label="Risk Manager" disabled badge="R3" />
          <NavItem icon="🏛️" label="Governance Center" disabled badge="R3" />
          <NavItem icon="💰" label="ROI Calculator" disabled badge="R3" />
          <NavItem icon="🛣️" label="Roadmap Generator" disabled badge="R3" />
          <NavItem icon="🔍" label="Vendor Comparison" disabled badge="R3" />
        </nav>

        {/* Footer action */}
        <div className="px-3 py-4 border-t border-slate-700">
          <button
            onClick={() => navigate('/canvas/new')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            <span>＋</span> New Use Case
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
