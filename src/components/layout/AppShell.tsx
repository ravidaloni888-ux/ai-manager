import { ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBrain } from '../icons/NavIcons'
import { useAuthStore } from '../../store/authStore'
import BetaRequestModal from './BetaRequestModal'
import MandantSwitcher from './MandantSwitcher'
import NavDropdown from './NavDropdown'
import WizardBanner from './WizardBanner'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const [showBeta, setShowBeta] = useState(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#e8eff7' }}>
      {/* Top bar: Marke + Navigation als Dropdown + Mandant/Konto */}
      <header className="flex-shrink-0 flex items-center gap-4 px-4 py-3 no-print" style={{ background: '#1a2538' }}>
        <button
          type="button"
          onClick={() => navigate('/guide')}
          className="flex items-center gap-2.5 flex-shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <IconBrain />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-white font-semibold text-sm leading-tight">AI Manager</p>
            <p className="text-slate-400 text-xs">Release 1.0</p>
          </div>
        </button>

        <NavDropdown />

        <div className="ml-auto flex items-center gap-3">
          <MandantSwitcher />
          {!user ? (
            <>
              <button
                onClick={() => setShowBeta(true)}
                className="text-sm text-white/60 hover:text-white border border-white/20 hover:border-white/40 px-4 py-2 rounded-lg transition-colors"
              >
                Zugang anfragen
              </button>
              <button
                onClick={() => navigate('/login')}
                className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Anmelden
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 truncate max-w-[160px] hidden md:inline">{user.email}</span>
              <button onClick={() => signOut()} className="text-xs text-slate-400 hover:text-white transition-colors">
                Abmelden
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <WizardBanner />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {showBeta && <BetaRequestModal onClose={() => setShowBeta(false)} />}
    </div>
  )
}
