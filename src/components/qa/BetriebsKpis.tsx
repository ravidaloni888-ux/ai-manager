import { useEffect, useState } from 'react'
import { scopedGet, scopedSet } from '../../lib/mandantData'
import { getMandantType } from '../../store/mandantStore'

// ─────────────────────────────────────────────────────────────────────────
// Betriebs-KPI — die zweite Ebene des Business Case.
//
// Die fünf Auslöser (Zeit, Kosten, Umsatz, Qualität, Risiko) sagen, was das
// Unternehmen davon hat. Sie sagen aber nicht, ob das System überhaupt
// funktioniert und genutzt wird — und daran scheitern die meisten Vorhaben,
// nicht am Geschäftsmodell.
//
// Diese Kennzahlen sind fast immer Leading-Indikatoren: Sie zeigen Monate
// früher als der ROI, ob es trägt.
// ─────────────────────────────────────────────────────────────────────────

interface KpiDef {
  key: string
  titel: string
  formel: string
  beantwortet: string
  hinweis?: string
}

export const BETRIEBS_KPIS: KpiDef[] = [
  {
    key: 'adoption',
    titel: 'Adoptionsrate',
    formel: 'Aktive Nutzende ÷ berechtigte Nutzende',
    beantwortet: 'Ohne Nutzung kein Nutzen — egal wie gut das Modell ist.',
    hinweis: 'Fällt sie nach dem Start ab, liegt es selten am Modell. Dann ist es ein Change-Thema.',
  },
  {
    key: 'automatisierung',
    titel: 'Automatisierungsgrad',
    formel: 'Vollständig automatisch abgeschlossene Vorgänge ÷ Gesamtvorgänge',
    beantwortet: 'Die direkte Brücke zur Kostenrechnung.',
    hinweis: 'Nur vollständig abgeschlossene zählen. Ein Vorgang, den jemand nachbearbeitet, spart nichts.',
  },
  {
    key: 'override',
    titel: 'Human-Override-Rate',
    formel: 'Verworfene KI-Vorschläge ÷ alle Vorschläge',
    beantwortet: 'Anteil der Vorschläge, die ein Mensch verwirft und durch eigenes Urteil ersetzt.',
    hinweis: 'Eine Rate nahe null ist kein gutes Zeichen — dann prüft vermutlich niemand mehr ernsthaft.',
  },
  {
    key: 'fehlrate',
    titel: 'Fehl- oder Falschaussagenrate',
    formel: 'Sachlich falsche Ergebnisse ÷ geprüfte Ergebnisse',
    beantwortet: 'Wie oft liefert das System sachlich falsche Ergebnisse?',
    hinweis: 'Bei generativer KI die zentrale Qualitätsgröße — und die einzige, die eine Stichprobe braucht.',
  },
  {
    key: 'kosten',
    titel: 'Kosten je Vorgang',
    formel: 'Laufende Kosten ÷ Vorgänge im Zeitraum',
    beantwortet: 'Einschließlich laufender Modellkosten.',
    hinweis: 'Bei Sprachmodellen wandert der Aufwand von Personal zu Token. Beides gehört in dieselbe Zahl.',
  },
]

interface KpiWerte {
  relevant?: boolean
  baseline?: string
  ziel?: string
  methode?: string
}

type Stand = Record<string, KpiWerte>

const BUCKET = 'betriebskpi'
const inputCls = 'w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

const SPALTEN: { key: keyof KpiWerte; label: string; platzhalter: string }[] = [
  { key: 'baseline', label: 'Baseline',    platzhalter: 'heute — z. B. 0 %' },
  { key: 'ziel',     label: 'Zielwert',    platzhalter: 'bis wann — z. B. 60 % nach 6 Monaten' },
  { key: 'methode',  label: 'Messmethode', platzhalter: 'wer erhebt, wie oft' },
]

export default function BetriebsKpis() {
  const [stand, setStand] = useState<Stand>({})
  const speicherbar = getMandantType() !== 'demo'

  useEffect(() => { setStand(scopedGet<Stand>(BUCKET, {})) }, [])

  const sichern = (next: Stand) => {
    setStand(next)
    if (speicherbar) scopedSet(BUCKET, next)
  }

  const setzen = (key: string, feld: keyof KpiWerte, wert: string | boolean) =>
    sichern({ ...stand, [key]: { ...stand[key], [feld]: wert } })

  const gewaehlt = BETRIEBS_KPIS.filter((k) => stand[k.key]?.relevant)
  const vollstaendig = gewaehlt.filter((k) => {
    const w = stand[k.key] ?? {}
    return w.baseline?.trim() && w.ziel?.trim() && w.methode?.trim()
  })

  return (
    <div className="space-y-5">
      {/* Warum es diese zweite Ebene braucht */}
      <div className="bg-slate-800 text-white rounded-xl px-6 py-5 space-y-3">
        <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400">Zweite Ebene des Business Case</p>
        <h2 className="text-xl font-bold">Ob es sich lohnt, ist eine Frage. Ob es funktioniert, eine andere.</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Die fünf Auslöser eines Anwendungsfalls — Zeit, Kosten, Umsatz, Qualität, Risiko — sagen, was das
          Unternehmen davon hat. Sie sagen nicht, ob das System überhaupt funktioniert und genutzt wird.
          Genau daran scheitern die meisten Vorhaben, nicht am Geschäftsmodell.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">
          Deshalb braucht ein KI-Business-Case eine zweite Ebene: Kennzahlen, die den Betrieb der Lösung
          selbst messen. Sie sind fast immer <strong className="text-white">Leading-Indikatoren</strong> — sie
          zeigen Monate früher als der ROI, ob es trägt.
        </p>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Die fünf Betriebs-KPI</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Auswählen, was für Ihre Systeme zählt — und je Kennzahl Baseline, Ziel und Messmethode festlegen.
          </p>
        </div>
        {gewaehlt.length > 0 && (
          <span className="text-xs font-semibold text-blue-600 flex-shrink-0">
            {vollstaendig.length}/{gewaehlt.length} vollständig
          </span>
        )}
      </div>

      <div className="space-y-2">
        {BETRIEBS_KPIS.map((k) => {
          const w = stand[k.key] ?? {}
          const an = !!w.relevant
          return (
            <div key={k.key} className={`rounded-xl border transition-colors ${
              an ? 'border-blue-200 bg-white' : 'border-slate-200 bg-slate-50/60'
            }`}>
              <button
                type="button"
                onClick={() => setzen(k.key, 'relevant', !an)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left"
              >
                <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                  an ? 'bg-blue-600 text-white' : 'border border-slate-300 text-transparent'
                }`}>
                  ✓
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${an ? 'text-slate-800' : 'text-slate-600'}`}>
                    {k.titel}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">{k.formel}</p>
                  <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">{k.beantwortet}</p>
                </div>
              </button>

              {an && (
                <div className="px-4 pb-4 space-y-2">
                  {k.hinweis && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
                      {k.hinweis}
                    </p>
                  )}
                  <div className="grid sm:grid-cols-3 gap-2">
                    {SPALTEN.map((sp) => (
                      <div key={sp.key}>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">{sp.label}</label>
                        <input
                          className={inputCls}
                          value={(w[sp.key] as string) ?? ''}
                          onChange={(e) => setzen(k.key, sp.key, e.target.value)}
                          placeholder={sp.platzhalter}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {gewaehlt.length === 0 && (
        <p className="text-[12px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
          Noch keine Betriebs-KPI gewählt. Mindestens die <strong>Adoptionsrate</strong> gehört in jeden Fall —
          ohne Nutzung wird keine der anderen Zahlen je gut.
        </p>
      )}

      {gewaehlt.length > 0 && vollstaendig.length < gewaehlt.length && (
        <p className="text-[12px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
          {gewaehlt.length - vollstaendig.length} gewählte {gewaehlt.length - vollstaendig.length === 1 ? 'Kennzahl ist' : 'Kennzahlen sind'} noch
          unvollständig. Ohne Baseline lässt sich später keine Verbesserung zeigen, ohne Messmethode wird
          gar nicht erst erhoben.
        </p>
      )}

      {!speicherbar && (
        <p className="text-[10px] text-slate-400">Im Demo-Mandanten wird nichts dauerhaft gespeichert.</p>
      )}
    </div>
  )
}
