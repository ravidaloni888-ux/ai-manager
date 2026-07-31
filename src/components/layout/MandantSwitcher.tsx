import { useState, useRef, useEffect } from 'react'
import { useMandantStore, MANDANT_STYLE, HUB_ID, DEMO_ID } from '../../store/mandantStore'
import { useUseCasesStore } from '../../store/useCasesStore'
import { useStrategyStore } from '../../store/strategyStore'
import { useRiskStore } from '../../store/riskStore'
import { useGovernanceStore } from '../../store/governanceStore'
import { useEnablementStore } from '../../store/enablementStore'
import { useMeetingsStore } from '../../store/meetingsStore'
import { useWizardStore, SCOPE_PRESETS } from '../../store/wizardStore'

export default function MandantSwitcher() {
  const { mandanten, activeId, setActive, addClient, removeClient } = useMandantStore()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPreset, setNewPreset] = useState(SCOPE_PRESETS[0].key)
  const boxRef = useRef<HTMLDivElement>(null)

  const resetCases  = useUseCasesStore((s) => s.resetStore)
  const initCases   = useUseCasesStore((s) => s.init)
  const initStrategy = useStrategyStore((s) => s.init)
  const initRisks    = useRiskStore((s) => s.init)
  const initGov      = useGovernanceStore((s) => s.init)
  const initEnable   = useEnablementStore((s) => s.init)
  const initMeetings = useMeetingsStore((s) => s.init)
  const initWizard   = useWizardStore((s) => s.init)

  const active = mandanten.find((m) => m.id === activeId) ?? mandanten[0]

  // Klick ausserhalb schliesst das Menü
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const reloadAll = () => {
    // Reihenfolge: erst Use Cases leeren, damit nichts vom alten Mandanten stehenbleibt
    resetCases()
    setTimeout(() => {
      initCases()
      initStrategy()
      initRisks()
      initGov()
      initEnable()
      initMeetings()
      initWizard()
    }, 0)
  }

  const switchTo = (id: string) => {
    if (id !== activeId) {
      setActive(id)
      reloadAll()
    }
    setOpen(false)
    setCreating(false)
  }

  const create = () => {
    const name = newName.trim()
    if (!name) return
    const preset = SCOPE_PRESETS.find((p) => p.key === newPreset) ?? SCOPE_PRESETS[0]
    const id = addClient(name, undefined, preset.steps, preset.key)
    setNewName('')
    setNewPreset(SCOPE_PRESETS[0].key)
    setCreating(false)
    switchTo(id)
  }

  const style = MANDANT_STYLE[active.type]

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-lg pl-2.5 pr-2 py-1.5 transition-colors"
      >
        <span className="text-sm leading-none">{style.icon}</span>
        <div className="text-left">
          <p className="text-xs font-semibold text-white leading-tight max-w-[160px] truncate">{active.name}</p>
          <p className="text-[10px] text-white/50 leading-tight">{style.label}</p>
        </div>
        <svg className={`w-3.5 h-3.5 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`}
             fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Mandat wählen</p>

          {mandanten.map((m) => {
            const st = MANDANT_STYLE[m.type]
            const isActive = m.id === activeId
            return (
              <div key={m.id} className="group flex items-center">
                <button
                  onClick={() => switchTo(m.id)}
                  className={`flex-1 flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${isActive ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                >
                  <span className="text-base leading-none flex-shrink-0">{st.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-tight truncate ${isActive ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                      {m.name}
                    </p>
                    {m.note && <p className="text-[11px] text-slate-400 leading-tight truncate">{m.note}</p>}
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${st.badge}`}>{st.label}</span>
                  {isActive && (
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
                {m.id !== HUB_ID && m.id !== DEMO_ID && (
                  <button
                    onClick={() => {
                      if (confirm(`Mandat "${m.name}" mit allen lokal gespeicherten Daten löschen?`)) {
                        removeClient(m.id)
                        reloadAll()
                      }
                    }}
                    title="Mandat löschen"
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 px-2 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}

          <div className="border-t border-slate-100 mt-1 pt-1">
            {!creating ? (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <span className="text-base leading-none">＋</span> Neues Kundenmandat
              </button>
            ) : (
              <div className="px-3 py-2 space-y-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') create(); if (e.key === 'Escape') setCreating(false) }}
                  placeholder="Kunde / Projektname"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Umfang</p>
                  <div className="space-y-1">
                    {SCOPE_PRESETS.map((preset) => (
                      <label key={preset.key}
                        className={`flex items-start gap-2 rounded-lg border px-2 py-1.5 cursor-pointer transition-colors ${
                          newPreset === preset.key ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}>
                        <input type="radio" name="scope-preset" checked={newPreset === preset.key}
                          onChange={() => setNewPreset(preset.key)} className="mt-0.5 flex-shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-slate-800">
                            {preset.label} <span className="font-normal text-slate-400">· {preset.steps.length}</span>
                          </span>
                          <span className="block text-[10px] text-slate-500 leading-snug">{preset.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={create} disabled={!newName.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
                    Anlegen
                  </button>
                  <button onClick={() => { setCreating(false); setNewName('') }}
                    className="px-3 text-xs text-slate-500 hover:text-slate-700">
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="px-3 pt-1.5 pb-1 text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 mt-1">
            Kundenmandate werden ausschliesslich lokal in diesem Browser gespeichert.
          </p>
        </div>
      )}
    </div>
  )
}
