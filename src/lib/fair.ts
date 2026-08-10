import type { VerfuegbarkeitState, VerfuegbarkeitFrage } from '../components/assessments/DatenverfuegbarkeitCheck'
import type { DataQualityState } from '../components/assessments/DataQualityCheck'

// ─────────────────────────────────────────────────────────────────────────
// FAIR als Perspektive, nicht als dritte Erhebung.
//
// Die vier FAIR-Prinzipien (Wilkinson et al. 2016) fragen fast dasselbe wie
// die Datengrundlage, nur im Vokabular der Forschungsdaten:
//
//   Auffindbar      ← werden die Daten erhoben und sind sie zu finden
//   Zugänglich      ← besteht maschinenlesbarer Zugriff
//   Interoperabel   ← passen Formate und Terminologie zu Nachbarsystemen
//   Wiederverwendbar← dürfen sie für diesen Zweck genutzt werden
//
// Wer beides getrennt ausfüllt, beantwortet dieselbe Frage zweimal — und
// kann sich dabei widersprechen. Deshalb wird FAIR hier abgeleitet und
// zeigt jeweils, worauf es sich stützt. Die Theorie steht unter /data.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Alter Stand des FAIR-Fragebogens. Wird nicht mehr erhoben, bleibt aber
 * im Datensatz, damit gespeicherte Antworten nicht verlorengehen.
 */
export type FairState = Record<string, boolean>
export const EMPTY_FAIR: FairState = {}

export type FairStand = 'erfuellt' | 'teilweise' | 'kritisch' | 'offen'

export interface FairZeile {
  key: 'findable' | 'accessible' | 'interoperable' | 'reusable'
  buchstabe: string
  titel: string
  stand: FairStand
  /** Worauf sich die Einschätzung stützt */
  quelle: string
}

const AUS_ANTWORT: Record<string, FairStand> = {
  ja: 'erfuellt', teils: 'teilweise', nein: 'kritisch',
}

const AUS_RATING: Record<string, FairStand> = {
  gut: 'erfuellt', teilweise: 'teilweise', kritisch: 'kritisch',
}

export const FAIR_STAND_LABEL: Record<FairStand, string> = {
  erfuellt: 'erfüllt', teilweise: 'teilweise', kritisch: 'kritisch', offen: 'noch offen',
}

/** Der schlechtere von zwei Ständen — eine Lücke wiegt schwerer als ein Haken. */
function schlechter(a: FairStand, b: FairStand): FairStand {
  const rang: Record<FairStand, number> = { kritisch: 0, teilweise: 1, erfuellt: 2, offen: 3 }
  // „offen" nur, wenn beide offen sind — sonst zählt die vorhandene Aussage
  if (a === 'offen') return b
  if (b === 'offen') return a
  return rang[a] <= rang[b] ? a : b
}

export function fairAusPruefungen(
  v: VerfuegbarkeitState | undefined,
  q: DataQualityState | undefined,
): FairZeile[] {
  const a = v?.antworten ?? {}
  const dims = q?.dims ?? {}

  const vonAntwort = (id: VerfuegbarkeitFrage): FairStand => (a[id] ? AUS_ANTWORT[a[id] as string] ?? 'offen' : 'offen')
  const vonDim = (key: string): FairStand => {
    const r = dims[key]?.rating
    return r ? AUS_RATING[r] ?? 'offen' : 'offen'
  }

  return [
    {
      key: 'findable', buchstabe: 'F', titel: 'Auffindbar',
      stand: vonAntwort('existenz'),
      quelle: 'Existenz der Daten',
    },
    {
      key: 'accessible', buchstabe: 'A', titel: 'Zugänglich',
      stand: vonAntwort('zugang'),
      quelle: 'Zugänglichkeit',
    },
    {
      key: 'interoperable', buchstabe: 'I', titel: 'Interoperabel',
      stand: schlechter(vonDim('interoperabilitaet'), vonDim('konsistenz')),
      quelle: 'Interoperabilität und Konsistenz',
    },
    {
      key: 'reusable', buchstabe: 'R', titel: 'Wiederverwendbar',
      stand: vonAntwort('recht'),
      quelle: 'Nutzungsrecht',
    },
  ]
}
