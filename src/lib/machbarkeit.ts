import type { VerfuegbarkeitState } from '../components/assessments/DatenverfuegbarkeitCheck'
import { VERFUEGBARKEIT_FRAGEN } from '../components/assessments/DatenverfuegbarkeitCheck'
import type { DataQualityState } from '../components/assessments/DataQualityCheck'

// ─────────────────────────────────────────────────────────────────────────
// Technische Machbarkeit aus den Datenprüfungen herleiten.
//
// Die Machbarkeit eines KI-Vorhabens hängt fast nie am Modell, sondern an
// den Daten. Statt sie frei zu schätzen, wird sie hier aus dem berechnet,
// was in Verfügbarkeit und Qualität bereits beantwortet wurde.
//
// Es bleibt ein Vorschlag: Es gibt Gründe, davon abzuweichen — etwa ein
// zugekaufter Datensatz, der die eigene Lücke schliesst. Der Vorschlag
// nennt deshalb immer seine Begründung, damit die Abweichung bewusst
// geschieht.
// ─────────────────────────────────────────────────────────────────────────

export interface MachbarkeitVorschlag {
  /** Empfohlener Reglerwert 1–10, oder null wenn zu wenig beantwortet ist */
  wert: number | null
  /** Was den Wert getrieben hat — in der Reihenfolge des Gewichts */
  gruende: string[]
  /** Anteil der beantworteten Fragen, für die Angabe der Belastbarkeit */
  basis: { beantwortet: number; gesamt: number }
}

const QUAL_SCORE: Record<string, number> = { gut: 100, teilweise: 50, kritisch: 0 }

/**
 * Verfügbarkeit deckelt, Qualität feinjustiert.
 *
 * Ein fehlendes Nutzungsrecht oder nicht erhobene Daten sind harte Grenzen —
 * dort hilft keine gute Qualität in anderen Dimensionen. Deshalb wirken sie
 * als Obergrenze und nicht als Abzug, der sich wegmitteln liesse.
 */
export function machbarkeitAusDaten(
  v: VerfuegbarkeitState | undefined,
  q: DataQualityState | undefined,
): MachbarkeitVorschlag {
  const antworten = v?.antworten ?? {}
  const vBeantwortet = VERFUEGBARKEIT_FRAGEN.filter((f) => antworten[f.id]).length

  const dims = q?.dims ?? {}
  const bewertet = Object.values(dims).filter((d) => d.rating !== null)
  const gesamt = VERFUEGBARKEIT_FRAGEN.length + Object.keys(dims).length
  const beantwortet = vBeantwortet + bewertet.length

  // Die Verfügbarkeit allein trägt schon eine Aussage — sie ist das Gate.
  // Ohne sie braucht es genug Qualitätsdimensionen, sonst wäre es geraten.
  const vVollstaendig = vBeantwortet === VERFUEGBARKEIT_FRAGEN.length
  if (!vVollstaendig && bewertet.length < 3) {
    return { wert: null, gruende: [], basis: { beantwortet, gesamt } }
  }

  const gruende: string[] = []

  // Grundwert aus der Datenqualität — ohne Bewertung neutral bei 6
  let wert = 6
  if (bewertet.length > 0) {
    const schnitt = bewertet.reduce((s, d) => s + (QUAL_SCORE[d.rating as string] ?? 0), 0) / bewertet.length
    wert = 1 + (schnitt / 100) * 9   // 0 % → 1, 100 % → 10
    gruende.push(`Datenqualität ${Math.round(schnitt)} % über ${bewertet.length} bewertete Dimensionen`)
  }

  // Brockmann: eine als kritisch markierte Dimension, die kritisch bewertet ist,
  // wiegt schwerer als der Durchschnitt — sie trifft genau den Zweck
  const brockmann = Object.values(dims).filter((d) => d.critical && d.rating === 'kritisch').length
  if (brockmann > 0) {
    wert = Math.min(wert, 4)
    gruende.push(`${brockmann} zweckkritische Dimension${brockmann > 1 ? 'en' : ''} als kritisch bewertet — begrenzt auf 4`)
  }

  // Verfügbarkeit als Obergrenze
  for (const f of VERFUEGBARKEIT_FRAGEN) {
    const a = antworten[f.id]
    if (!a || a === 'ja') continue
    if (a === 'nein') {
      const grenze = f.hart ? 2 : 5
      wert = Math.min(wert, grenze)
      gruende.push(`${f.titel} nicht gegeben — ${f.hart ? 'harte Grenze' : 'begrenzt'} auf ${grenze}`)
    } else if (a === 'teils') {
      const grenze = f.hart ? 5 : 7
      wert = Math.min(wert, grenze)
      gruende.push(`${f.titel} nur teilweise — begrenzt auf ${grenze}`)
    }
  }

  if (gruende.length === 1 && bewertet.length > 0) {
    gruende.push('Verfügbarkeit ohne Einschränkung')
  }

  return {
    wert: Math.max(1, Math.min(10, Math.round(wert))),
    gruende,
    basis: { beantwortet, gesamt },
  }
}
