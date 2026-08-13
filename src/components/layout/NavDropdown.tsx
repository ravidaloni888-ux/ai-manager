import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { STEPS } from '../../pages/StartPage'
import { useActiveScope, useWizardStore, StepId } from '../../store/wizardStore'
import { useIsDemo } from '../../store/mandantStore'

// ─────────────────────────────────────────────────────────────────────────
// Navigation als Dropdown neben der Marke.
//
// Die Programmphasen sind die Ordner, die Schritte darin die Einträge —
// abgeleitet aus derselben Liste, aus der auch der geführte Modus lebt.
// Es gibt damit nur eine Quelle für Reihenfolge und Benennung.
//
// Programm-Einträge führen in den geführten Modus, damit Schiene und
// Fußleiste erhalten bleiben. Die reinen Werkzeugseiten stehen unter „Mehr".
// ─────────────────────────────────────────────────────────────────────────

interface Entry { to: string; label: string; step?: StepId }
interface Group { title?: string; entries: Entry[] }

const START_GROUP: Group = {
  entries: [
    { to: '/guide', label: '🚀 Geführter Modus' },
    { to: '/start', label: '📋 Einstieg · Übersicht' },
    { to: '/dashboard', label: '📊 Dashboard' },
  ],
}

const MEHR_GROUP: Group = {
  title: 'Mehr',
  entries: [
    { to: '/vendors', label: 'Anbietervergleich' },
    { to: '/meetings', label: 'Regelmäßige Meetings' },
    { to: '/roles', label: 'Team & Rollen' },
    { to: '/chat', label: '💬 Frag die App' },
    { to: '/glossary', label: 'KI-Glossar' },
    { to: '/prompts', label: 'Prompt-Bibliothek' },
    { to: '/settings', label: 'Einstellungen' },
    { to: '/about', label: 'Über uns' },
  ],
}

export default function NavDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const scope = useActiveScope()
  const done = useWizardStore((s) => s.done)
  const istDemo = useIsDemo()

  // Phasen aus den Programmschritten aufbauen — nur, was für dieses Mandat gilt
  const gruppen = useMemo<Group[]>(() => {
    const imUmfang = new Set<StepId>(scope)
    const phasen: Group[] = []
    for (const s of STEPS) {
      if (!imUmfang.has(s.id)) continue
      let g = phasen.find((p) => p.title === s.phase)
      if (!g) { g = { title: s.phase, entries: [] }; phasen.push(g) }
      g.entries.push({ to: `/guide?step=${s.id}`, label: s.title, step: s.id })
    }
    return [START_GROUP, ...phasen, MEHR_GROUP]
  }, [scope])

  const alleEintraege = useMemo(() => gruppen.flatMap((g) => g.entries), [gruppen])

  // Was ist gerade offen? Im geführten Modus zählt der Schritt, sonst der Pfad.
  const aktuellerStep = pathname === '/guide' ? (params.get('step') as StepId | null) : null
  const current =
    (aktuellerStep && alleEintraege.find((e) => e.step === aktuellerStep))
    ?? alleEintraege.find((e) => !e.step && (pathname === e.to || pathname.startsWith(e.to + '/')))
    ?? (pathname.startsWith('/canvas') ? alleEintraege.find((e) => e.step === 'usecases') : undefined)
    ?? (pathname === '/guide' ? START_GROUP.entries[0] : undefined)

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

  const beschriftung = current
    ? current.label.replace(/^[🚀📋📊]\s*/, '')
    : 'Navigation'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-white/90 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2 rounded-lg transition-colors max-w-[280px]"
      >
        <span className="truncate">{beschriftung}</span>
        <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
             fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-80 max-h-[78vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 py-2">
          {gruppen.map((group, gi) => (
            <div key={group.title ?? gi} className={gi > 0 ? 'mt-1 pt-1 border-t border-slate-100' : ''}>
              {group.title && (
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 pt-2 pb-1">
                  {group.title}
                </p>
              )}
              {group.entries.map((e) => {
                const active = current === e
                const fertig = e.step ? done.has(e.step) : false
                return (
                  <button
                    key={e.to}
                    type="button"
                    onClick={() => go(e.to)}
                    className={`w-full text-left flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {/* Stand nur bei Programmschritten — und nicht im Demo,
                        wo bauartbedingt alles als erledigt gilt */}
                    {e.step && !istDemo && (
                      <span className={`w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold ${
                        fertig ? 'bg-green-500 text-white' : 'border border-slate-300'
                      }`}>
                        {fertig ? '✓' : ''}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{e.label}</span>
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
