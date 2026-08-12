import { Pruefblock, Frage, Wahl, Fazit, Balken, TON } from '../ui/Pruefung'
import type { WahlOption, Ton } from '../ui/Pruefung'

// Datenqualität ist zweckbezogen — deshalb gehört diese Prüfung an den
// einzelnen Anwendungsfall und nicht auf eine allgemeine Seite.
//
// Hier steht nur das Werkzeug. Was die Dimensionen bedeuten, steht unter
// /data — sonst liest man die Theorie bei jedem Fall erneut.

export const QUALITY_DIMENSIONS = [
  {
    key: 'vollstaendigkeit',
    icon: '🧩',
    title: 'Vollständigkeit',
    frage: 'Fehlt etwas, das vorhanden sein sollte?',
    beispiel: 'Brockmanns Bücher: 30 % fehlen.',
    check: 'Sind alle für den Zweck erforderlichen Datensätze, Felder und Dokumente vorhanden?',
  },
  {
    key: 'konsistenz',
    icon: '🔗',
    title: 'Konsistenz',
    frage: 'Sind Daten über Quellen hinweg widerspruchsfrei?',
    beispiel: 'SAP vs. Dienstbuch vs. E-Mail: unterschiedliche Bezeichnungen.',
    check: 'Werden dieselben Objekte in allen Quellen gleich benannt und stimmen die Werte überein?',
  },
  {
    key: 'genauigkeit',
    icon: '🎯',
    title: 'Genauigkeit',
    frage: 'Stimmen die Daten mit der Realität überein?',
    beispiel: 'OCR-Qualität (optische Zeichenerkennung) älterer Dokumente.',
    check: 'Bilden die Werte die reale Welt korrekt ab (z. B. korrekte Erfassung, saubere Digitalisierung)?',
  },
  {
    key: 'aktualitaet',
    icon: '📅',
    title: 'Aktualität',
    frage: 'Sind die Daten noch gültig?',
    beispiel: '15 % betreffen Bautypen, die WellSeal heute nicht mehr fertigt.',
    check: 'Sind die Daten aktuell genug für den Zweck oder betreffen sie veraltete Zustände?',
  },
  {
    key: 'relevanz',
    icon: '💡',
    title: 'Relevanz',
    frage: 'Helfen die Daten der Zielgruppe?',
    beispiel: 'Bremer Insider-Jargon ist für Agenten in Houston ohne Erklärung nutzlos.',
    check: 'Sind die Daten für die konkrete Zielgruppe und deren Kontext verständlich und nützlich?',
  },
  {
    key: 'interoperabilitaet',
    icon: '🔌',
    title: 'Interoperabilität',
    frage: 'Passen die Daten mit den Nachbarsystemen zusammen?',
    beispiel: 'Projektbezeichnungen im Dienstbuch weichen von denen in SAP ab.',
    check: 'Sind Formate, Schlüssel und Terminologie so, dass andere Systeme die Daten ohne Übersetzung verwenden können?',
  },
  {
    key: 'eindeutigkeit',
    icon: '🔍',
    title: 'Eindeutigkeit',
    frage: 'Ist jedes Objekt nur einmal erfasst?',
    beispiel: 'Duplikate verzerren die Gewichtung bei der Wahl der Antwortmöglichkeiten.',
    check: 'Gibt es Duplikate oder mehrfach erfasste Objekte, die Ergebnisse verzerren?',
  },
]

type Rating = 'gut' | 'teilweise' | 'kritisch' | null

const BEWERTUNG: WahlOption<Exclude<Rating, null>>[] = [
  { wert: 'gut',       label: 'Erfüllt',   ton: 'ok' },
  { wert: 'teilweise', label: 'Teilweise', ton: 'teils' },
  { wert: 'kritisch',  label: 'Kritisch',  ton: 'stopp' },
]

const PUNKTE: Record<Exclude<Rating, null>, number> = { gut: 100, teilweise: 50, kritisch: 0 }

interface DimState { rating: Rating; critical: boolean }

export interface DataQualityState {
  zweck: string
  dims: Record<string, DimState>
}

export const EMPTY_DATA_QUALITY: DataQualityState = {
  zweck: '',
  dims: Object.fromEntries(QUALITY_DIMENSIONS.map(d => [d.key, { rating: null, critical: false }])),
}

export default function DataQualityCheck({ value, onChange }: {
  value: DataQualityState
  onChange: (fn: (prev: DataQualityState) => DataQualityState) => void
}) {
  const zweck = value.zweck
  const state = value.dims
  const setZweck = (v: string) => onChange(p => ({ ...p, zweck: v }))

  const setRating = (key: string, rating: Rating) =>
    onChange(p => ({ ...p, dims: { ...p.dims, [key]: { ...p.dims[key], rating: p.dims[key].rating === rating ? null : rating } } }))
  const toggleCritical = (key: string) =>
    onChange(p => ({ ...p, dims: { ...p.dims, [key]: { ...p.dims[key], critical: !p.dims[key].critical } } }))

  const rated = QUALITY_DIMENSIONS.filter(d => state[d.key].rating !== null)
  const allRated = rated.length === QUALITY_DIMENSIONS.length
  const avgScore = rated.length
    ? Math.round(rated.reduce((sum, d) => sum + PUNKTE[state[d.key].rating as Exclude<Rating, null>], 0) / rated.length)
    : 0

  // Brockmann-Faktor: eine als "kritisch" priorisierte Dimension, die kritisch bewertet ist
  const brockmannHits = QUALITY_DIMENSIONS.filter(d => state[d.key].critical && state[d.key].rating === 'kritisch')
  const criticalGaps = QUALITY_DIMENSIONS.filter(d => state[d.key].rating === 'kritisch')

  let verdict: { ton: Ton; label: string; text: string } | null = null
  if (allRated) {
    if (brockmannHits.length > 0) {
      verdict = {
        ton: 'stopp',
        label: 'Nicht freigeben',
        text: `Brockmann-Faktor: ${brockmannHits.map(d => d.title).join(', ')} ist für diesen Zweck kritisch UND unzureichend. Ein RAG mit 70 % der Daten kann schlechter sein als keins, wenn die fehlenden 30 % genau die kritischen Fälle abdecken. Zuerst diese Lücke schließen.`,
      }
    } else if (avgScore >= 80 && criticalGaps.length === 0) {
      verdict = {
        ton: 'ok',
        label: 'Gut genug für den Zweck',
        text: `Datenqualität ist zweckbezogen ausreichend (Score ${avgScore} %). Keine kritischen Lücken in als wichtig markierten Dimensionen. Freigabe möglich — mit laufendem Monitoring.`,
      }
    } else if (avgScore >= 50) {
      verdict = {
        ton: 'teils',
        label: 'Bedingt — Lücken schließen',
        text: `Score ${avgScore} %. ${criticalGaps.length > 0 ? `Kritische Lücken in: ${criticalGaps.map(d => d.title).join(', ')}. ` : ''}Vor der Freigabe nachbessern oder den Verwendungszweck enger fassen.`,
      }
    } else {
      verdict = {
        ton: 'stopp',
        label: 'Zu geringe Qualität',
        text: `Score ${avgScore} %. Für einen produktiven KI-Einsatz nicht ausreichend. Datenaufbereitung ist Voraussetzung, nicht optional.`,
      }
    }
  }

  return (
    <Pruefblock
      titel={`Datenqualität — ${QUALITY_DIMENSIONS.length} Dimensionen`}
      hinweis="Zweckbezogen bewerten: gut genug fürs Controlling heisst nicht gut genug für ein RAG-System."
      stand={<span className="text-[11px] text-slate-400 flex-shrink-0">{rated.length}/{QUALITY_DIMENSIONS.length}</span>}
    >
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Verwendungszweck</label>
        <input
          value={zweck} onChange={e => setZweck(e.target.value)}
          placeholder="z. B. RAG-System für Service-Ingenieure, das technische Handbücher durchsucht"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          „Wichtig" markiert die Dimensionen, die für genau diesen Zweck entscheidend sind — eine
          Lücke dort wiegt schwerer als anderswo (Brockmann-Faktor).
        </p>
      </div>

      {QUALITY_DIMENSIONS.map((d, i) => {
        const st = state[d.key]
        return (
          <Frage
            key={d.key}
            id={`dim-${d.key}`}
            nr={i + 1}
            titel={d.title}
            text={d.check}
            ton={st.rating === 'gut' ? 'ok' : st.rating === 'teilweise' ? 'teils' : st.rating === 'kritisch' ? 'stopp' : null}
            marke={
              <button
                type="button"
                onClick={() => toggleCritical(d.key)}
                className={`ml-2 align-middle text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                  st.critical ? TON.warn.voll : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                {st.critical ? 'wichtig' : 'wichtig?'}
              </button>
            }
          >
            <Wahl optionen={BEWERTUNG} wert={st.rating} onWaehle={(r) => setRating(d.key, r)} />
          </Frage>
        )
      })}

      <Balken
        text={`${rated.length}/${QUALITY_DIMENSIONS.length} bewertet`}
        rechts={rated.length > 0 ? `Ø ${avgScore} %` : undefined}
        anteil={allRated ? avgScore / 100 : rated.length / QUALITY_DIMENSIONS.length}
        ton={!allRated ? 'neutral' : avgScore >= 80 ? 'ok' : avgScore >= 50 ? 'teils' : 'stopp'}
      />

      {verdict && (
        <Fazit ton={verdict.ton} titel={`${verdict.label}${zweck ? ` — „${zweck}"` : ''}`}>
          {verdict.text}
        </Fazit>
      )}
    </Pruefblock>
  )
}
