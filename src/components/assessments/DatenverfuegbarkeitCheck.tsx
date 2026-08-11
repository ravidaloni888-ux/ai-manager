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

import { Pruefblock, Frage, Wahl, Marke, Fazit } from '../ui/Pruefung'
import type { WahlOption } from '../ui/Pruefung'

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

const ANTWORTEN: WahlOption<VerfuegbarkeitAntwort>[] = [
  { wert: 'ja',    label: 'Ja',        ton: 'ok' },
  { wert: 'teils', label: 'Teilweise', ton: 'teils' },
  { wert: 'nein',  label: 'Nein',      ton: 'stopp' },
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
    <Pruefblock
      titel={`Gate — ${VERFUEGBARKEIT_FRAGEN.length} Fragen vor dem Business Case`}
      hinweis="Das Modell ist selten das Problem, die Daten schon. Erst wenn diese Fragen stehen, lohnt die Detailbewertung darunter."
      stand={<span className="text-[11px] text-slate-400 flex-shrink-0">{u.beantwortet}/{VERFUEGBARKEIT_FRAGEN.length}</span>}
    >
      {VERFUEGBARKEIT_FRAGEN.map((f, i) => {
        const gewaehlt = value.antworten[f.id]
        return (
          <Frage
            key={f.id}
            nr={i + 1}
            titel={f.titel}
            text={f.frage}
            hinweis={f.hinweis}
            marke={f.hart ? <Marke>K.-o.-Frage</Marke> : undefined}
            ton={gewaehlt === 'ja' ? 'ok' : gewaehlt === 'teils' ? 'teils' : gewaehlt === 'nein' ? (f.hart ? 'stopp' : 'warn') : null}
            folge={(gewaehlt === 'nein' || gewaehlt === 'teils')
              ? <><strong>Was daraus folgt: </strong>{f.beiNein}</>
              : undefined}
          >
            <Wahl optionen={ANTWORTEN} wert={gewaehlt} onWaehle={(w) => setAntwort(f.id, w)} />
          </Frage>
        )
      })}

      {/* Gesamturteil */}
      {u.beantwortet > 0 && (
        u.harteNeins.length > 0 ? (
          <Fazit ton="stopp" titel="Der Business Case trägt so nicht">
            {u.harteNeins.map((f) => f.titel).join(' und ')} {u.harteNeins.length > 1 ? 'sind' : 'ist'} nicht gegeben.
            Das lässt sich nicht durch ein besseres Modell ausgleichen — hier steht Vorarbeit an,
            bevor das Vorhaben bewertet werden kann.
          </Fazit>
        ) : u.tragfaehig && u.teils.length === 0 && u.weicheNeins.length === 0 ? (
          <Fazit ton="ok" titel="Datengrundlage trägt">
            Alle {VERFUEGBARKEIT_FRAGEN.length} Fragen sind bejaht. Jetzt lohnt die Detailbewertung
            der sieben Qualitätsdimensionen.
          </Fazit>
        ) : (
          <Fazit ton="teils" titel="Machbar, aber mit Vorarbeit">
            {!u.vollstaendig && `Noch ${VERFUEGBARKEIT_FRAGEN.length - u.beantwortet} von ${VERFUEGBARKEIT_FRAGEN.length} Fragen offen. `}
            {[...u.weicheNeins, ...u.teils].length > 0 && (
              <>Einschränkungen bei {[...new Set([...u.weicheNeins, ...u.teils].map((f) => f.titel))].join(', ')} — der
              Aufwand dafür gehört in die Schätzung des Vorhabens, nicht in den Betrieb.</>
            )}
          </Fazit>
        )
      )}
    </Pruefblock>
  )
}
