// ─────────────────────────────────────────────────────────────────────────
// Datenverfügbarkeit — drei Fragen vor jedem Business Case.
//
// Das Modell ist selten das Problem, die Daten schon. In den meisten
// gescheiterten KI-Projekten liegt die Ursache nicht in der Technologie,
// sondern darin, dass Daten zwar existieren, aber verteilt, uneinheitlich,
// rechtlich beschränkt oder zu grob sind.
//
// Dieser Check steht deshalb VOR der Detailbewertung der sechs
// Qualitätsdimensionen: Wenn Daten nicht erhoben werden oder nicht genutzt
// werden dürfen, braucht man ihre Vollständigkeit nicht mehr zu bewerten.
// ─────────────────────────────────────────────────────────────────────────

export type VerfuegbarkeitAntwort = 'ja' | 'teils' | 'nein'
export type VerfuegbarkeitFrage = 'existenz' | 'zugang' | 'qualitaet' | 'recht'

export interface VerfuegbarkeitState {
  antworten: Partial<Record<VerfuegbarkeitFrage, VerfuegbarkeitAntwort>>
}

export const EMPTY_VERFUEGBARKEIT: VerfuegbarkeitState = { antworten: {} }

interface FrageDef {
  id: VerfuegbarkeitFrage
  titel: string
  frage: string
  hinweis: string
  /** Was ein Nein bedeutet — der eigentliche Wert dieses Checks */
  beiNein: string
  /** Blockiert ein Nein den Business Case ganz? */
  hart: boolean
}

export const VERFUEGBARKEIT_FRAGEN: FrageDef[] = [
  {
    id: 'existenz',
    titel: 'Existenz',
    frage: 'Werden die nötigen Daten überhaupt erhoben und gespeichert?',
    hinweis: 'Auch die Granularität zählt: Tagessummen helfen nicht, wenn das Modell einzelne Vorgänge braucht.',
    beiNein: 'Die Erhebung muss erst aufgesetzt werden. Rechnen Sie mit Vorlaufzeit, bis genug Historie für ein Training zusammenkommt — je nach Fall Monate. Der Business Case beginnt hier, nicht beim Modell.',
    hart: true,
  },
  {
    id: 'zugang',
    titel: 'Zugänglichkeit',
    frage: 'Kann maschinenlesbar darauf zugegriffen werden?',
    hinweis: 'Daten in PDF, in Einzeldateien oder hinter einer Oberfläche ohne Schnittstelle gelten als nicht zugänglich.',
    beiNein: 'Vor dem Vorhaben steht eine Datenintegration: Schnittstellen, Export oder Ablösung des Altsystems. Das ist häufig der größere Teil des Aufwands und gehört in die Schätzung.',
    hart: false,
  },
  {
    id: 'recht',
    titel: 'Nutzungsrecht',
    frage: 'Dürfen sie für genau diesen Zweck genutzt werden?',
    hinweis: 'Vertraglich, regulatorisch und datenschutzrechtlich. Zweckbindung: Für Abrechnung erhoben heißt nicht für Training erlaubt.',
    beiNein: 'Ohne Rechtsgrundlage kein Business Case — unabhängig davon, wie gut das Modell würde. Klären Sie das zuerst mit DSB und Vertragsseite, nicht am Ende.',
    hart: true,
  },
]

const ANTWORTEN: { wert: VerfuegbarkeitAntwort; label: string; cls: string }[] = [
  { wert: 'ja',    label: 'Ja',        cls: 'bg-green-500 text-white' },
  { wert: 'teils', label: 'Teilweise', cls: 'bg-amber-500 text-white' },
  { wert: 'nein',  label: 'Nein',      cls: 'bg-red-500 text-white' },
]

/** Wie steht es insgesamt? */
export function verfuegbarkeitUrteil(v: VerfuegbarkeitState) {
  const a = v.antworten
  const beantwortet = VERFUEGBARKEIT_FRAGEN.filter((f) => a[f.id]).length
  const harteNeins = VERFUEGBARKEIT_FRAGEN.filter((f) => f.hart && a[f.id] === 'nein')
  const weicheNeins = VERFUEGBARKEIT_FRAGEN.filter((f) => !f.hart && a[f.id] === 'nein')
  const teils = VERFUEGBARKEIT_FRAGEN.filter((f) => a[f.id] === 'teils')
  return {
    beantwortet,
    vollstaendig: beantwortet === VERFUEGBARKEIT_FRAGEN.length,
    harteNeins,
    weicheNeins,
    teils,
    tragfaehig: beantwortet === VERFUEGBARKEIT_FRAGEN.length && harteNeins.length === 0,
  }
}

export default function DatenverfuegbarkeitCheck({ value, onChange }: {
  value: VerfuegbarkeitState
  onChange: (fn: (prev: VerfuegbarkeitState) => VerfuegbarkeitState) => void
}) {
  const setAntwort = (id: VerfuegbarkeitFrage, wert: VerfuegbarkeitAntwort) =>
    onChange((p) => ({
      antworten: { ...p.antworten, [id]: p.antworten[id] === wert ? undefined : wert },
    }))

  const u = verfuegbarkeitUrteil(value)

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-800">Datenverfügbarkeit — drei Fragen vor dem Business Case</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Das Modell ist selten das Problem, die Daten schon. Erst wenn diese drei stehen,
          lohnt die Detailbewertung darunter.
        </p>
      </div>

      <div className="px-5 py-4 space-y-3">
        {VERFUEGBARKEIT_FRAGEN.map((f, i) => {
          const gewaehlt = value.antworten[f.id]
          const zeigtFolge = gewaehlt === 'nein' || gewaehlt === 'teils'
          return (
            <div key={f.id} className={`rounded-lg border px-4 py-3 transition-colors ${
              gewaehlt === 'nein' ? (f.hart ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50')
              : gewaehlt === 'teils' ? 'border-amber-200 bg-amber-50/50'
              : gewaehlt === 'ja' ? 'border-green-200 bg-green-50/40'
              : 'border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    <span className="text-slate-400 mr-1.5">{i + 1}</span>
                    {f.titel}
                    {f.hart && (
                      <span className="ml-2 text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full align-middle">
                        K.-o.-Frage
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] text-slate-700 mt-0.5 leading-snug">{f.frage}</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{f.hinweis}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {ANTWORTEN.map((a) => (
                    <button
                      key={a.wert}
                      type="button"
                      onClick={() => setAntwort(f.id, a.wert)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                        gewaehlt === a.wert ? a.cls : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {zeigtFolge && (
                <p className={`text-[11px] mt-2.5 pt-2.5 border-t leading-relaxed ${
                  gewaehlt === 'nein' && f.hart ? 'border-red-200 text-red-900' : 'border-amber-200 text-amber-900'
                }`}>
                  <strong>Was daraus folgt: </strong>{f.beiNein}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Gesamturteil */}
      {u.beantwortet > 0 && (
        <div className="px-5 pb-5">
          {u.harteNeins.length > 0 ? (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-800">Der Business Case trägt so nicht</p>
              <p className="text-[12px] text-red-900 mt-1 leading-relaxed">
                {u.harteNeins.map((f) => f.titel).join(' und ')} {u.harteNeins.length > 1 ? 'sind' : 'ist'} nicht gegeben.
                Das lässt sich nicht durch ein besseres Modell ausgleichen — hier steht Vorarbeit an,
                bevor das Vorhaben bewertet werden kann.
              </p>
            </div>
          ) : u.tragfaehig && u.teils.length === 0 && u.weicheNeins.length === 0 ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-semibold text-green-800">Datengrundlage trägt</p>
              <p className="text-[12px] text-green-900 mt-1 leading-relaxed">
                Alle drei Fragen sind bejaht. Jetzt lohnt die Detailbewertung der sieben Qualitätsdimensionen.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">Machbar, aber mit Vorarbeit</p>
              <p className="text-[12px] text-amber-900 mt-1 leading-relaxed">
                {!u.vollstaendig && `Noch ${VERFUEGBARKEIT_FRAGEN.length - u.beantwortet} von ${VERFUEGBARKEIT_FRAGEN.length} Fragen offen. `}
                {[...u.weicheNeins, ...u.teils].length > 0 && (
                  <>Einschränkungen bei {[...new Set([...u.weicheNeins, ...u.teils].map((f) => f.titel))].join(', ')} — der
                  Aufwand dafür gehört in die Schätzung des Vorhabens, nicht in den Betrieb.</>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
