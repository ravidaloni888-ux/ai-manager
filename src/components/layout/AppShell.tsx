import { ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavItem from './NavItem'
import {
  IconDashboard, IconList, IconChartBar, IconMap,
  IconAlert, IconBuilding, IconCurrency, IconFlag, IconSearch,
  IconBrain, IconPlus, IconSettings, IconAcademic, IconCalendar, IconUsers, IconInfo, IconRocket, IconClipboard, IconStar, IconShield, IconSitemap,
} from '../icons/NavIcons'
import { useAuthStore } from '../../store/authStore'
import BetaRequestModal from './BetaRequestModal'
import DemoToggle from './DemoToggle'
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
          <NavItem to="/start" icon={<IconRocket />} label="Einstieg" />
          <NavItem to="/dashboard" icon={<IconDashboard />} label="Dashboard" />

          <div className="pt-4" />

          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pb-2">
            KI-Programm
          </p>
          <NavItem to="/strategy" icon={<IconMap />} label="Strategie-Assistent" />
          <NavItem to="/maturity" icon={<IconChartBar />} label="Reifegradcheck" />
          <NavItem to="/governance" icon={<IconBuilding />} label="KI-Governance" />
          <NavItem to="/use-cases" icon={<IconList />} label="KI-Anwendungsfälle" />
          <NavItem to="/risk" icon={<IconAlert />} label="Risikomanager" />
          <NavItem to="/roadmap" icon={<IconFlag />} label="Roadmap-Generator" />
          <NavItem to="/roi" icon={<IconCurrency />} label="ROI-Rechner" />
          <NavItem to="/enablement" icon={<IconAcademic />} label="Schulung & Coaching" />
          <NavItem to="/meetings" icon={<IconCalendar />} label="Regelmäßige Meetings" />
          <NavItem to="/stakeholders" icon={<IconSitemap />} label="Stakeholder-Analyse" />

          <div className="pt-4" />

          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pb-2">
            Mehr
          </p>
          <NavItem to="/roles" icon={<IconUsers />} label="Team & Rollen" />
          <NavItem to="/vendors" icon={<IconSearch />} label="Anbietervergleich" />
          <NavItem to="/qa" icon={<IconClipboard />} label="KI-Qualitätssicherung" />
          <NavItem to="/glossary" icon={<IconSearch />} label="KI-Glossar" />
          <NavItem to="/prompts" icon={<IconStar />} label="Prompt-Bibliothek" />
          <NavItem to="/eu-ai-act" icon={<IconFlag />} label="EU AI Act" />
          <NavItem to="/dsgvo" icon={<IconShield />} label="DSGVO & Datenschutz" />
          <NavItem to="/ethik" icon={<IconFlag />} label="KI-Ethik" />
          <NavItem to="/settings" icon={<IconSettings />} label="Einstellungen" />
          <NavItem to="/about" icon={<IconInfo />} label="Über uns" />
        </nav>

        {/* Sidebar footer — user info when logged in */}
        {user && (
          <div className="px-3 py-4 border-t border-white/10">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-slate-400 truncate max-w-[130px]">{user.email}</span>
              <button onClick={() => signOut()} className="text-xs text-slate-400 hover:text-white transition-colors">
                Abmelden
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-3" style={{ background: '#1a2538' }}>
          <DemoToggle />
          {user ? (
            <button
              onClick={() => navigate('/canvas/new')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <IconPlus /> Neuer Anwendungsfall
            </button>
          ) : (
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
          )}
        </div>

        <WizardBanner />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {showBeta && <BetaRequestModal onClose={() => setShowBeta(false)} />}
    </div>
  )
}
