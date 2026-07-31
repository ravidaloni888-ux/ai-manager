import TheoryBlock from '../ui/TheoryBlock'

// FAIR beurteilt die Datenbasis eines konkreten Vorhabens — gehört an den Fall.

const FAIR_PRINCIPLES = [
  {
    key: 'findable',
    letter: 'F',
    title: 'Findable',
    bedeutung: 'Auffindbar',
    inhalt: 'Daten mit eindeutiger ID in durchsuchbarem Verzeichnis.',
    praxisfrage: 'Kann das System einen Eintrag gezielt finden — oder durchsucht es immer den gesamten Korpus?',
    checks: [
      'Jeder Datensatz / jedes Dokument hat eine eindeutige, stabile ID.',
      'Ein durchsuchbares Verzeichnis (Index/Katalog) existiert.',
      'Metadaten beschreiben den Inhalt für gezieltes Auffinden.',
    ],
  },
  {
    key: 'accessible',
    letter: 'A',
    title: 'Accessible',
    bedeutung: 'Zugänglich',
    inhalt: 'Standard-Protokolle · auch wenn der Ersteller nicht mehr verfügbar ist.',
    praxisfrage: 'Was passiert mit den Daten, wenn der Ersteller in Rente geht und sein Konto deaktiviert wird?',
    checks: [
      'Zugriff über offene Standard-Protokolle (nicht an eine Person gebunden).',
      'Daten bleiben verfügbar, auch wenn der Ersteller ausscheidet.',
      'Zugriffsrechte sind klar geregelt und dokumentiert.',
    ],
  },
  {
    key: 'interoperable',
    letter: 'I',
    title: 'Interoperable',
    bedeutung: 'Interoperabel',
    inhalt: 'Gemeinsame Vokabularien und Formate · kombinierbar mit anderen Datensätzen.',
    praxisfrage: 'Ist die Terminologie mit anderen Systemen (z. B. SAP-Projektbezeichnungen) kompatibel?',
    checks: [
      'Gemeinsame, standardisierte Vokabularien / Terminologie.',
      'Offene, austauschbare Datenformate.',
      'Kombinierbar mit anderen relevanten Datensätzen im Haus.',
    ],
  },
  {
    key: 'reusable',
    letter: 'R',
    title: 'Reusable',
    bedeutung: 'Wiederverwendbar',
    inhalt: 'Klare Nutzungslizenzen + Provenienzangaben (Herkunftsnachweise).',
    praxisfrage: 'Dürfen die Daten auch von anderen Niederlassungen genutzt werden — und wer hat das entschieden?',
    checks: [
      'Klare Nutzungslizenz / Nutzungsrechte definiert.',
      'Provenienz (Herkunft, Quelle) ist dokumentiert.',
      'Nutzungskontext und Einschränkungen sind beschrieben.',
    ],
  },
]

const FAIR_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  F: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-300',   dot: 'bg-blue-500' },
  A: { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-300',   dot: 'bg-teal-500' },
  I: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300', dot: 'bg-purple-500' },
  R: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
}


export type FairState = Record<string, boolean>
export const EMPTY_FAIR: FairState = {}

export default function FairCheck({ value, onChange }: {
  value: FairState
  onChange: (fn: (prev: FairState) => FairState) => void
}) {
  const checked = value
  const toggle = (id: string) => onChange(c => ({ ...c, [id]: !c[id] }))

  const total = FAIR_PRINCIPLES.reduce((n, p) => n + p.checks.length, 0)
  const done = Object.values(checked).filter(Boolean).length
  const pct = Math.round((done / total) * 100)

  const principleScore = (p: typeof FAIR_PRINCIPLES[0]) => {
    const d = p.checks.filter((_, i) => checked[`${p.key}-${i}`]).length
    return { done: d, total: p.checks.length, pct: Math.round((d / p.checks.length) * 100) }
  }

  const weakest = FAIR_PRINCIPLES
    .map(p => ({ p, s: principleScore(p) }))
    .filter(x => x.s.pct < 100)
    .sort((a, b) => a.s.pct - b.s.pct)

  return (
    <div className="space-y-5">
      {/* Info */}
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 rounded-r-xl px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong>FAIR — Leitbild für nachhaltiges Datenmanagement.</strong> Ursprünglich für Forschungsdaten — heute Leitbild für jedes nachhaltige Datenmanagementsystem.
        <span className="block mt-1 text-xs text-slate-400">go-fair.org/fair-principles</span>
      </div>

      {/* FAIR Check tool */}
      <div className="bg-white rounded-xl border-2 border-slate-800 overflow-hidden">
        <div className="px-5 py-3 bg-slate-800 text-white flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">✅ FAIR-Check</p>
            <p className="text-xs text-slate-300 mt-0.5">Prüfe deinen Datensatz gegen die FAIR-Kriterien.</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold leading-none">{pct}%</p>
            <p className="text-[11px] text-slate-300">{done}/{total} erfüllt</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {FAIR_PRINCIPLES.map(p => {
            const c = FAIR_COLORS[p.letter]
            const s = principleScore(p)
            return (
              <div key={p.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-md ${c.bg} ${c.text} text-xs font-bold flex items-center justify-center`}>{p.letter}</span>
                  <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                  <span className="text-[11px] text-slate-400 ml-auto">{s.done}/{s.total}</span>
                </div>
                <div className="space-y-1.5 pl-1">
                  {p.checks.map((chk, i) => {
                    const id = `${p.key}-${i}`
                    const on = !!checked[id]
                    return (
                      <button key={id} onClick={() => toggle(id)}
                        className={`w-full flex items-start gap-2.5 text-left rounded-lg border px-3 py-2 transition-colors ${on ? `${c.border} ${c.bg}` : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                        <span className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border ${on ? `${c.dot} border-transparent` : 'border-slate-300'}`}>
                          {on && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        </span>
                        <span className={`text-xs leading-relaxed ${on ? 'text-slate-700' : 'text-slate-500'}`}>{chk}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Result */}
          {done > 0 && (
            <div className={`rounded-xl border-2 px-4 py-3 ${pct === 100 ? 'bg-green-50 border-green-300 text-green-800' : pct >= 60 ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
              <p className="text-sm font-bold">
                {pct === 100 ? '✅ Vollständig FAIR' : pct >= 60 ? '⚠ Teilweise FAIR' : '⛔ FAIR-Lücken'}
                {' '}— {pct} %
              </p>
              {weakest.length > 0 && (
                <p className="text-xs mt-1 leading-relaxed">
                  Schwächste Prinzipien: {weakest.slice(0, 2).map(x => `${x.p.title} (${x.s.pct} %)`).join(', ')}. Hier zuerst nachbessern, um den Datensatz nachhaltig nutzbar zu machen.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Theorie — bei Bedarf */}
      <TheoryBlock title="Die vier FAIR-Prinzipien" hint="Bedeutung und Praxisfrage je Prinzip">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FAIR_PRINCIPLES.map(p => {
          const c = FAIR_COLORS[p.letter]
          return (
            <div key={p.key} className={`bg-white rounded-xl border ${c.border} p-4 space-y-2`}>
              <div className="flex items-center gap-3">
                <span className={`w-9 h-9 rounded-lg ${c.bg} ${c.text} text-lg font-bold flex items-center justify-center flex-shrink-0`}>{p.letter}</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{p.title}</p>
                  <p className="text-xs text-slate-400">{p.bedeutung}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{p.inhalt}</p>
              <p className={`text-xs italic leading-relaxed ${c.text} ${c.bg} rounded-lg px-2.5 py-1.5`}>„{p.praxisfrage}"</p>
            </div>
          )
        })}
      </div>
      </TheoryBlock>
    </div>
  )
}
