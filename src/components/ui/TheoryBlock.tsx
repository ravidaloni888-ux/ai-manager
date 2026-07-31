import { ReactNode, useState } from 'react'

interface TheoryBlockProps {
  /** Überschrift, z. B. "Die sechs Dimensionen der Datenqualität" */
  title: string
  /** Kurzer Hinweis, was drinsteckt — steht neben der Überschrift */
  hint?: string
  /** Standardmässig eingeklappt; nur setzen, wenn der Inhalt wirklich zuerst gelesen werden muss */
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * Theorie und Hintergrund — eingeklappt, damit das Werkzeug oben steht und
 * die Erklärung nur bei Bedarf aufgeht.
 */
export default function TheoryBlock({ title, hint, defaultOpen = false, children }: TheoryBlockProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-base leading-none flex-shrink-0">📖</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{title}</p>
          {hint && <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{hint}</p>}
        </div>
        <span className="text-[10px] font-semibold text-slate-400 flex-shrink-0">
          {open ? 'Ausblenden' : 'Anzeigen'}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 space-y-5">
          {children}
        </div>
      )}
    </section>
  )
}
