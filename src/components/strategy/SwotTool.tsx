import { useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { scopedGet, scopedSet } from '../../lib/mandantData'
import { getMandantType } from '../../store/mandantStore'

// ─────────────────────────────────────────────────────────────────────────
// SWOT für den KI-Einsatz.
//
// Die Analyse steht vor der Vision, bleibt aber grob: Sie soll verhindern,
// dass ein Zielbild am Markt oder an der eigenen Lage vorbeigeht — nicht
// die Strategie vorwegnehmen. Deshalb je Feld Denkanstöße statt Freitext
// ins Leere.
// ─────────────────────────────────────────────────────────────────────────

type Feld = 'staerken' | 'schwaechen' | 'chancen' | 'risiken'

interface Eintrag { id: string; text: string }
type SwotDaten = Record<Feld, Eintrag[]>

const LEER: SwotDaten = { staerken: [], schwaechen: [], chancen: [], risiken: [] }

const FELDER: {
  key: Feld
  titel: string
  herkunft: string
  ton: string
  kopf: string
  anstoesse: string[]
}[] = [
  {
    key: 'staerken', titel: 'Stärken', herkunft: 'intern · hilfreich',
    ton: 'border-green-300 bg-green-50', kopf: 'text-green-800',
    anstoesse: [
      'Welche Daten haben wir, die andere nicht haben?',
      'Wo ist Fachwissen im Haus, das eine KI anleiten könnte?',
      'Welche Prozesse sind bereits sauber dokumentiert?',
      'Gibt es Rückhalt in der Führung für das Thema?',
    ],
  },
  {
    key: 'schwaechen', titel: 'Schwächen', herkunft: 'intern · hinderlich',
    ton: 'border-amber-300 bg-amber-50', kopf: 'text-amber-800',
    anstoesse: [
      'Wo liegen Daten verstreut, veraltet oder unvollständig?',
      'Welche Kompetenzen fehlen — und lassen sich nicht schnell einkaufen?',
      'Wo gab es gescheiterte Digitalvorhaben, die noch nachwirken?',
      'Fehlt eine Instanz, die über KI-Vorhaben entscheidet?',
    ],
  },
  {
    key: 'chancen', titel: 'Chancen', herkunft: 'extern · hilfreich',
    ton: 'border-blue-300 bg-blue-50', kopf: 'text-blue-800',
    anstoesse: [
      'Welche Arbeit fragt die Kundschaft nach, die wir heute nicht leisten?',
      'Wo sind Wettbewerber langsam oder unbesetzt?',
      'Welche Förderung oder Partnerschaft steht offen?',
      'Welche Technologie ist reif geworden, die es vor zwei Jahren nicht war?',
    ],
  },
  {
    key: 'risiken', titel: 'Risiken', herkunft: 'extern · hinderlich',
    ton: 'border-red-300 bg-red-50', kopf: 'text-red-800',
    anstoesse: [
      'Welche Auflagen kommen auf uns zu — EU AI Act, Branchenrecht?',
      'Was tun Wettbewerber, das uns Marktanteile kosten könnte?',
      'Wovon würden wir abhängig, wenn wir auf einen Anbieter setzen?',
      'Welche Erwartung im Markt könnte kippen — etwa Vertrauen in KI?',
    ],
  },
]

const BUCKET = 'swot'

export default function SwotTool() {
  const [daten, setDaten] = useState<SwotDaten>(LEER)
  const [entwurf, setEntwurf] = useState<Record<Feld, string>>({
    staerken: '', schwaechen: '', chancen: '', risiken: '',
  })
  const [hilfeFuer, setHilfeFuer] = useState<Feld | null>(null)

  const speicherbar = getMandantType() !== 'demo'

  useEffect(() => { setDaten({ ...LEER, ...scopedGet<SwotDaten>(BUCKET, LEER) }) }, [])

  const sichern = (next: SwotDaten) => {
    setDaten(next)
    if (speicherbar) scopedSet(BUCKET, next)
  }

  const hinzu = (f: Feld) => {
    const text = entwurf[f].trim()
    if (!text) return
    sichern({ ...daten, [f]: [...daten[f], { id: nanoid(), text }] })
    setEntwurf((p) => ({ ...p, [f]: '' }))
  }

  const weg = (f: Feld, id: string) =>
    sichern({ ...daten, [f]: daten[f].filter((e) => e.id !== id) })

  const gesamt = FELDER.reduce((s, f) => s + daten[f.key].length, 0)
  const leereFelder = FELDER.filter((f) => daten[f.key].length === 0)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">SWOT für den KI-Einsatz</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Standortbestimmung vor der Vision — grob halten, zwei bis vier Punkte je Feld genügen.
          </p>
        </div>
        <span className="text-xs font-semibold text-blue-600 flex-shrink-0">{gesamt} Einträge</span>
      </div>

      {leereFelder.length > 0 && gesamt > 0 && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Noch leer: {leereFelder.map((f) => f.titel).join(', ')}. Gerade die unbequemen Felder —
          Schwächen und Risiken — entscheiden darüber, ob die Vision realistisch wird.
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {FELDER.map((f) => (
          <div key={f.key} className={`rounded-xl border ${f.ton} p-4 space-y-3`}>
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className={`text-sm font-bold ${f.kopf}`}>{f.titel}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">{f.herkunft}</p>
              </div>
              <button
                type="button"
                onClick={() => setHilfeFuer(hilfeFuer === f.key ? null : f.key)}
                className="text-[11px] text-slate-500 hover:text-slate-700 underline decoration-dotted flex-shrink-0"
              >
                {hilfeFuer === f.key ? 'Fragen ausblenden' : 'Woran denken?'}
              </button>
            </div>

            {hilfeFuer === f.key && (
              <ul className="space-y-1 bg-white/70 rounded-lg px-3 py-2">
                {f.anstoesse.map((a) => (
                  <li key={a} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                    <span className="text-[11px] text-slate-600 leading-relaxed">{a}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-1.5">
              {daten[f.key].map((e) => (
                <div key={e.id} className="group flex items-start gap-2 bg-white rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-700 leading-snug flex-1">{e.text}</span>
                  <button
                    type="button"
                    onClick={() => weg(f.key, e.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 text-xs flex-shrink-0 transition-opacity"
                    title="Entfernen"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {daten[f.key].length === 0 && (
                <p className="text-[11px] text-slate-400 px-1">Noch nichts erfasst.</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={entwurf[f.key]}
                onChange={(e) => setEntwurf((p) => ({ ...p, [f.key]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') hinzu(f.key) }}
                placeholder="Punkt eintragen…"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => hinzu(f.key)}
                disabled={!entwurf[f.key].trim()}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex-shrink-0"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-400">
        {speicherbar
          ? 'Einträge werden je Mandat gespeichert.'
          : 'Im Demo-Mandanten wird nichts dauerhaft gespeichert.'}
        {' '}Die SWOT ist Vorarbeit — geschärft wird sie, sobald die Vision steht.
      </p>
    </div>
  )
}
