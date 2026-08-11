import React from 'react'

// ─────────────────────────────────────────────────────────────────────────
// Ein Bausatz für alle Prüfungen im Fall.
//
// Vorher hatte jede Prüfung ihr eigenes Aussehen: mal ein dunkler Kopf, mal
// eine farbige Symbolkachel, mal Kästchen zum Anhaken, mal Knöpfe. Gleiches
// sah verschieden aus. Hier steht jetzt jedes Teil genau einmal — die Karte,
// die Frage, die Antwort, das Ergebnis. Wer eine Prüfung baut, nimmt diese.
//
// Die Ebene erkennt man an der Form, nicht an der Farbe:
//   Sektion     Schatten, eckige Nummer   — ein Canvas-Abschnitt
//   Schritt     Zeile, runde Nummer       — ein Schritt im Fall-Wizard
//   Pruefblock  Rahmen ohne Schatten      — ein Werkzeug
//   Frage       getönter Kasten           — eine einzelne Frage
//
// Farbe bedeutet immer dasselbe und nie nur Dekoration:
//   ok grün · teils gelb · warn orange · stopp rot · neutral grau
// ─────────────────────────────────────────────────────────────────────────

export type Ton = 'ok' | 'teils' | 'warn' | 'stopp' | 'neutral'

interface TonKlassen {
  rand: string
  flaeche: string
  schrift: string
  /** Gefüllt — für die gewählte Antwort und den Statuspunkt */
  voll: string
  punkt: string
}

export const TON: Record<Ton, TonKlassen> = {
  ok:      { rand: 'border-emerald-200', flaeche: 'bg-emerald-50', schrift: 'text-emerald-800', voll: 'bg-emerald-600 text-white', punkt: 'bg-emerald-500' },
  teils:   { rand: 'border-amber-200',   flaeche: 'bg-amber-50',   schrift: 'text-amber-800',   voll: 'bg-amber-500 text-white',   punkt: 'bg-amber-500' },
  warn:    { rand: 'border-orange-200',  flaeche: 'bg-orange-50',  schrift: 'text-orange-800',  voll: 'bg-orange-500 text-white',  punkt: 'bg-orange-500' },
  stopp:   { rand: 'border-red-200',     flaeche: 'bg-red-50',     schrift: 'text-red-800',     voll: 'bg-red-600 text-white',     punkt: 'bg-red-500' },
  neutral: { rand: 'border-slate-200',   flaeche: 'bg-slate-50',   schrift: 'text-slate-700',   voll: 'bg-slate-800 text-white',   punkt: 'bg-slate-400' },
}

/**
 * Ein Werkzeug innerhalb eines Wizard-Schritts. Rahmen statt Schatten —
 * der Schatten bleibt der Canvas-Sektion vorbehalten, sonst verschwimmen
 * die Ebenen ineinander.
 */
export function Pruefblock({ titel, hinweis, stand, aktion, children }: {
  titel: string
  hinweis?: string
  /** Kurzer Stand rechts im Kopf, z. B. „3/7 bewertet" */
  stand?: React.ReactNode
  /** Nebenhandlung rechts im Kopf, z. B. „Neu starten" */
  aktion?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{titel}</p>
          {hinweis && <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{hinweis}</p>}
        </div>
        {stand}
        {aktion}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )
}

export interface WahlOption<T> {
  wert: T
  label: string
  /** Farbe der gewählten Antwort — ohne Angabe neutral */
  ton?: Ton
}

/**
 * Die einzige Art, im Fall eine Frage zu beantworten. Zwei, drei oder vier
 * Möglichkeiten nebeneinander; nichts gewählt heisst unbeantwortet, was ein
 * Häkchen nicht ausdrücken kann.
 */
export function Wahl<T extends string | number | boolean>({
  optionen, wert, onWaehle, breit = false, alsAktion = false,
}: {
  optionen: WahlOption<T>[]
  wert: T | null | undefined
  onWaehle: (wert: T) => void
  /** Über die volle Breite statt kompakt rechts neben der Frage */
  breit?: boolean
  /**
   * Die Wahl bleibt nicht stehen, sondern führt weiter — wie im Prüfbaum,
   * wo die Antwort zur nächsten Frage springt. Ohne bleibende Auswahl sähen
   * die Knöpfe sonst aus, als wären sie gesperrt.
   */
  alsAktion?: boolean
}) {
  return (
    <div className={`${breit ? 'flex w-full' : 'inline-flex'} gap-1 rounded-lg bg-slate-100 p-1`}>
      {optionen.map((o) => {
        const aktiv = wert === o.wert
        return (
          <button
            key={String(o.wert)}
            type="button"
            onClick={() => onWaehle(o.wert)}
            className={`${breit ? 'flex-1' : ''} whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              aktiv ? TON[o.ton ?? 'neutral'].voll
              : alsAktion ? 'bg-white text-slate-700 shadow-sm hover:bg-slate-800 hover:text-white'
              : 'text-slate-500 hover:bg-white hover:text-slate-800'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Die häufigste Wahl überhaupt — überall dieselbe Beschriftung. */
export const JA_NEIN: WahlOption<boolean>[] = [
  { wert: true,  label: 'Ja' },
  { wert: false, label: 'Nein' },
]

/** Kleines Etikett an einer Frage, z. B. „K.-o.-Frage". */
export function Marke({ ton = 'neutral', children }: { ton?: Ton; children: React.ReactNode }) {
  return (
    <span className={`ml-2 align-middle text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TON[ton].flaeche} ${TON[ton].schrift}`}>
      {children}
    </span>
  )
}

/**
 * Eine einzelne Frage: links was gefragt wird, rechts die Antwort. Der
 * Kasten färbt sich nach der Antwort, damit der Stand ohne Lesen erkennbar
 * ist. Ohne Antwort bleibt er weiss.
 */
export function Frage({ nr, titel, text, hinweis, marke, ton, folge, children }: {
  nr?: number
  /** Kurzer Name der Frage — ohne ihn steht die Frage selbst fett */
  titel?: string
  text: string
  hinweis?: string
  marke?: React.ReactNode
  /** Farbe nach der gegebenen Antwort; ohne Angabe unbeantwortet */
  ton?: Ton | null
  /** Was aus der Antwort folgt — erscheint abgetrennt unter der Frage */
  folge?: React.ReactNode
  children: React.ReactNode
}) {
  const t = ton ? TON[ton] : null
  return (
    <div className={`rounded-lg border px-3.5 py-3 transition-colors ${t ? `${t.rand} ${t.flaeche}` : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {titel ? (
            <>
              <p className="text-sm font-semibold text-slate-800">
                {nr !== undefined && <span className="text-slate-400 mr-1.5">{nr}</span>}
                {titel}
                {marke}
              </p>
              <p className="text-[12px] text-slate-700 mt-0.5 leading-snug">{text}</p>
            </>
          ) : (
            <p className="text-[13px] text-slate-800 leading-snug">
              {nr !== undefined && <span className="text-slate-400 mr-1.5">{nr}</span>}
              {text}
              {marke}
            </p>
          )}
          {hinweis && <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{hinweis}</p>}
        </div>
        <div className="flex-shrink-0">{children}</div>
      </div>
      {folge && (
        <div className={`text-[11px] mt-2.5 pt-2.5 border-t leading-relaxed ${t ? `${t.rand} ${t.schrift}` : 'border-slate-100 text-slate-600'}`}>
          {folge}
        </div>
      )}
    </div>
  )
}

/** Das Ergebnis einer Prüfung — überall gleich aufgebaut. */
export function Fazit({ ton, titel, children }: { ton: Ton; titel: string; children?: React.ReactNode }) {
  const t = TON[ton]
  return (
    <div className={`rounded-lg border ${t.rand} ${t.flaeche} px-4 py-3`}>
      <p className={`text-sm font-semibold ${t.schrift} flex items-start gap-2`}>
        <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${t.punkt}`} />
        <span>{titel}</span>
      </p>
      {children && <div className={`text-[12px] mt-1.5 leading-relaxed ${t.schrift} pl-4`}>{children}</div>}
    </div>
  )
}

/** Fortschritt innerhalb einer Prüfung — eine Form, nicht drei. */
export function Balken({ text, rechts, anteil, ton = 'neutral' }: {
  text: string
  rechts?: React.ReactNode
  /** 0 bis 1 */
  anteil: number
  ton?: Ton
}) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
        <span>{text}</span>
        {rechts && <span className="font-semibold">{rechts}</span>}
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${TON[ton].punkt}`}
          style={{ width: `${Math.round(Math.min(Math.max(anteil, 0), 1) * 100)}%` }}
        />
      </div>
    </div>
  )
}
