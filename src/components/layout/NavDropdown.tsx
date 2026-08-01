import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────────────────
// Navigation als Dropdown neben der Marke — ersetzt die linke Seitenleiste.
// ─────────────────────────────────────────────────────────────────────────

interface Entry { to: string; label: string }
interface Group { title?: string; entries: Entry[] }

export const NAV_GROUPS: Group[] = [
  {
    entries: [
      { to: '/guide', label: '🚀 Geführter Modus' },
      { to: '/start', label: '📋 Einstieg · Übersicht' },
      { to: '/dashboard', label: '📊 Dashboard' },
    ],
  },
  {
    title: 'KI-Programm',
    // Reihenfolge folgt den Schritten des Einstiegs-Assistenten
    entries: [
      { to: '/strategy', label: 'Strategie-Assistent' },
      { to: '/maturity', label: 'Reifegradcheck' },
      { to: '/eu-ai-act', label: 'EU AI Act' },
      { to: '/dsgvo', label: 'DSGVO & Datenschutz' },
      { to: '/ethik', label: 'KI-Ethik' },
      { to: '/governance', label: 'KI-Governance' },
      { to: '/stakeholders', label: 'Stakeholder-Analyse' },
      { to: '/use-cases', label: 'KI-Anwendungsfälle' },
      { to: '/data', label: 'Daten & Qualität' },
      { to: '/risk', label: 'Risikomanager' },
      { to: '/roadmap', label: 'Roadmap-Generator' },
      { to: '/roi', label: 'ROI-Rechner' },
      { to: '/qa', label: 'KI-Qualitätssicherung' },
      { to: '/change', label: 'Change Management' },
      { to: '/enablement', label: 'Schulung & Coaching' },
    ],
  },
  {
    title: 'Mehr',
    entries: [
      { to: '/vendors', label: 'Anbietervergleich' },
      { to: '/meetings', label: 'Regelmäßige Meetings' },
      { to: '/roles', label: 'Team & Rollen' },
      { to: '/glossary', label: 'KI-Glossar' },
      { to: '/prompts', label: 'Prompt-Bibliothek' },
      { to: '/settings', label: 'Einstellungen' },
      { to: '/about', label: 'Über uns' },
    ],
  },
]

const ALL_ENTRIES = NAV_GROUPS.flatMap((g) => g.entries)

export default function NavDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const current =
    ALL_ENTRIES.find((e) => pathname === e.to || pathname.startsWith(e.to + '/'))
    ?? (pathname.startsWith('/canvas') ? { to: '/use-cases', label: 'KI-Anwendungsfälle' } : undefined)

  // Klick außerhalb oder Escape schließt das Menü
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-white/90 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2 rounded-lg transition-colors max-w-[240px]"
      >
        <span className="truncate">{current ? current.label.replace(/^\S+\s/, (m) => (/[🚀📋📊]/.test(m) ? '' : m)) : 'Navigation'}</span>
        <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
             fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 max-h-[75vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 py-2">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-1 pt-1 border-t border-slate-100' : ''}>
              {group.title && (
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 pt-2 pb-1">
                  {group.title}
                </p>
              )}
              {group.entries.map((e) => {
                const active = current?.to === e.to
                return (
                  <button
                    key={e.to}
                    type="button"
                    onClick={() => go(e.to)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {e.label}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
