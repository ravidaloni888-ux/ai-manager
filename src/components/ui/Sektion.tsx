import React from 'react'

/**
 * Ein Abschnitt des Canvas — die oberste Ebene.
 *
 * Zugeklappt bleibt der Stand im Kopf ablesbar, sonst müsste man zum
 * Nachsehen jedes Mal aufklappen. Die Nummer ist eckig; ein Schritt im
 * Fall-Wizard darunter trägt eine runde. So ist an der Form erkennbar,
 * auf welcher Ebene man gerade ist.
 */
export function Sektion({
  id, nummer, titel, zusatz, stand, offen, onToggle, children,
}: {
  id?: string
  /** Stelle im Canvas — macht die Reihenfolge sichtbar */
  nummer?: number
  titel: string
  zusatz?: string
  stand?: React.ReactNode
  offen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section id={id} className="bg-white rounded-xl shadow-md overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        {nummer !== undefined && (
          <span className="w-6 h-6 rounded-md bg-slate-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {nummer}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            {titel}
            {zusatz && <span className="text-slate-400 font-normal normal-case ml-1.5">{zusatz}</span>}
          </h2>
        </div>
        {stand}
        <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${offen ? 'rotate-180' : ''}`}
             fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {offen && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </section>
  )
}

/** Kleine Zahl im Sektionskopf — grün, sobald vollständig. */
export function StandZahl({ ist, soll }: { ist: number; soll: number }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
      ist >= soll ? 'bg-emerald-50 text-emerald-700' : ist > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'
    }`}>
      {ist}/{soll}
    </span>
  )
}

