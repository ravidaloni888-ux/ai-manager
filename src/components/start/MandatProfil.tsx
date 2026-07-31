import { useState } from 'react'
import { useProfil, useProfilStore, profilCount } from '../../store/mandantProfil'
import type { Rolle, IsoZiel, Branche } from '../../store/mandantProfil'

// Vier Angaben über die Organisation. Sie steuern, welche Schritte greifen,
// und ersparen dem Projektplan dieselben Fragen bei jedem Anwendungsfall.

const ROLLEN: { value: Rolle; label: string; hint: string }[] = [
  { value: 'betreiber', label: 'Betreiber', hint: 'Wir setzen KI-Systeme ein, die andere gebaut haben' },
  { value: 'anbieter',  label: 'Anbieter',  hint: 'Wir entwickeln KI-Systeme und bringen sie in Verkehr' },
]

const ISO_ZIELE: { value: IsoZiel; label: string }[] = [
  { value: 'ja',      label: 'Ja, angestrebt' },
  { value: 'spaeter', label: 'Später' },
  { value: 'nein',    label: 'Nein' },
]

const BRANCHEN: { value: Branche; label: string }[] = [
  { value: 'sonstige',    label: 'Keine besondere' },
  { value: 'medizin',     label: 'Medizin / MDR' },
  { value: 'finanzen',    label: 'Finanzen' },
  { value: 'oeffentlich', label: 'Öffentliche Stelle' },
]

function Feld({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5 mb-1.5">{hint}</p>}
      <div className={`flex flex-wrap gap-1.5 ${hint ? '' : 'mt-1.5'}`}>{children}</div>
    </div>
  )
}

function Wahl({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
      }`}
    >
      {children}
    </button>
  )
}

export default function MandatProfil() {
  const profil = useProfil()
  const setProfil = useProfilStore((s) => s.set)
  const count = profilCount(profil)
  const [open, setOpen] = useState(count === 0)

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-base leading-none flex-shrink-0">🏷️</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 leading-tight">Mandat einrichten</p>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
            Vier Angaben über die Organisation — sie bestimmen, welche Schritte greifen
          </p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
          count === 4 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {count}/4
        </span>
        <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
             fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Feld label="Unsere Rolle nach EU AI Act" hint="Betreiber und Anbieter haben unterschiedliche Pflichten.">
            {ROLLEN.map((r) => (
              <Wahl key={r.value} active={profil.rolle === r.value} onClick={() => setProfil({ rolle: r.value })}>
                {r.label}
              </Wahl>
            ))}
          </Feld>

          <Feld label="ISO 42001 angestrebt?" hint="Bestimmt, ob der AIMS-Teil der Governance für Sie zählt.">
            {ISO_ZIELE.map((i) => (
              <Wahl key={i.value} active={profil.iso42001 === i.value} onClick={() => setProfil({ iso42001: i.value })}>
                {i.label}
              </Wahl>
            ))}
          </Feld>

          <Feld label="Betriebsrat vorhanden?" hint="Bei Mitarbeiterdaten greift §87 BetrVG vor der Einführung.">
            <Wahl active={profil.betriebsrat === true}  onClick={() => setProfil({ betriebsrat: true })}>Ja</Wahl>
            <Wahl active={profil.betriebsrat === false} onClick={() => setProfil({ betriebsrat: false })}>Nein</Wahl>
          </Feld>

          <Feld label="Branche mit Sondervorschriften?" hint="Beeinflusst das Konformitätsverfahren.">
            {BRANCHEN.map((b) => (
              <Wahl key={b.value} active={profil.branche === b.value} onClick={() => setProfil({ branche: b.value })}>
                {b.label}
              </Wahl>
            ))}
          </Feld>
        </div>
      )}
    </section>
  )
}
