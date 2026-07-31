import { useState } from 'react'
import TheoryBlock from '../ui/TheoryBlock'

// Datenqualität ist zweckbezogen — deshalb gehört diese Prüfung an den
// einzelnen Anwendungsfall und nicht auf eine allgemeine Seite.

const QUALITY_DIMENSIONS = [
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
    key: 'eindeutigkeit',
    icon: '🔍',
    title: 'Eindeutigkeit',
    frage: 'Ist jedes Objekt nur einmal erfasst?',
    beispiel: 'Duplikate verzerren die Gewichtung bei der Wahl der Antwortmöglichkeiten.',
    check: 'Gibt es Duplikate oder mehrfach erfasste Objekte, die Ergebnisse verzerren?',
  },
]

type Rating = 'gut' | 'teilweise' | 'kritisch' | null

const RATING_META: Record<Exclude<Rating, null>, { label: string; score: number; color: string; activeColor: string }> = {
  gut:       { label: '✓ Erfüllt',    score: 100, color: 'text-green-700 border-green-300',  activeColor: 'bg-green-500 text-white border-green-500' },
  teilweise: { label: '~ Teilweise',  score: 50,  color: 'text-amber-700 border-amber-300',  activeColor: 'bg-amber-500 text-white border-amber-500' },
  kritisch:  { label: '✗ Kritisch',   score: 0,   color: 'text-red-700 border-red-300',      activeColor: 'bg-red-500 text-white border-red-500' },
}

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
    ? Math.round(rated.reduce((sum, d) => sum + RATING_META[state[d.key].rating as Exclude<Rating, null>].score, 0) / rated.length)
    : 0

  // Brockmann-Faktor: eine als "kritisch" priorisierte Dimension, die kritisch bewertet ist
  const brockmannHits = QUALITY_DIMENSIONS.filter(d => state[d.key].critical && state[d.key].rating === 'kritisch')
  const criticalGaps = QUALITY_DIMENSIONS.filter(d => state[d.key].rating === 'kritisch')

  let verdict: { label: string; color: string; text: string } | null = null
  if (allRated) {
    if (brockmannHits.length > 0) {
      verdict = {
        label: '⛔ NICHT freigeben',
        color: 'bg-red-50 border-red-300 text-red-800',
        text: `Brockmann-Faktor: ${brockmannHits.map(d => d.title).join(', ')} ist für diesen Zweck kritisch UND unzureichend. Ein RAG mit 70 % der Daten kann schlechter sein als keins, wenn die fehlenden 30 % genau die kritischen Fälle abdecken. Zuerst diese Lücke schließen.`,
      }
    } else if (avgScore >= 80 && criticalGaps.length === 0) {
      verdict = {
        label: '✅ Gut genug für den Zweck',
        color: 'bg-green-50 border-green-300 text-green-800',
        text: `Datenqualität ist zweckbezogen ausreichend (Score ${avgScore} %). Keine kritischen Lücken in als wichtig markierten Dimensionen. Freigabe möglich — mit laufendem Monitoring.`,
      }
    } else if (avgScore >= 50) {
      verdict = {
        label: '⚠ Bedingt — Lücken schließen',
        color: 'bg-amber-50 border-amber-300 text-amber-800',
        text: `Score ${avgScore} %. ${criticalGaps.length > 0 ? `Kritische Lücken in: ${criticalGaps.map(d => d.title).join(', ')}. ` : ''}Vor der Freigabe nachbessern oder den Verwendungszweck enger fassen.`,
      }
    } else {
      verdict = {
        label: '⛔ Zu geringe Qualität',
        color: 'bg-red-50 border-red-300 text-red-800',
        text: `Score ${avgScore} %. Für einen produktiven KI-Einsatz nicht ausreichend. Datenaufbereitung ist Voraussetzung, nicht optional.`,
      }
    }
  }

  return (
    <div className="space-y-5">
      {/* Info block */}
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 rounded-r-xl px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong>Datenqualität ist immer zweckbezogen.</strong> „Gut genug für ein Brainstorming" ist nicht automatisch „gut genug für ein RAG-System, das in 30 Sekunden eine Servicefrage beantwortet." Dieselben SAP-Daten: für das Controlling ausreichend — für das RAG-System unvollständig.
        <span className="block mt-1 text-xs text-slate-400">Quelle: DAMA DMBOK2 Revised Edition (März 2024)</span>
      </div>

      {/* Assessment tool */}
      <div className="bg-white rounded-xl border-2 border-slate-800 overflow-hidden">
        <div className="px-5 py-3 bg-slate-800 text-white">
          <p className="text-sm font-bold">🧪 Datenqualität-Prüftool</p>
          <p className="text-xs text-slate-300 mt-0.5">Bewerte eine Datenquelle gegen die 6 Dimensionen — zweckbezogen.</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Zweck input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Verwendungszweck / Use Case</label>
            <input
              value={zweck} onChange={e => setZweck(e.target.value)}
              placeholder="z. B. RAG-System für Service-Ingenieure, das technische Handbücher durchsucht"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">Markiere Dimensionen als <strong>kritisch</strong>, die für genau diesen Zweck entscheidend sind (Brockmann-Faktor).</p>
          </div>

          {/* Dimension rows */}
          <div className="space-y-2">
            {QUALITY_DIMENSIONS.map(d => {
              const st = state[d.key]
              return (
                <div key={d.key} className={`rounded-lg border p-3 transition-colors ${st.critical ? 'border-orange-300 bg-orange-50/50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-base flex-shrink-0">{d.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{d.title}</p>
                        <p className="text-[11px] text-slate-500 leading-snug">{d.check}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCritical(d.key)}
                      className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-md border transition-colors ${st.critical ? 'bg-orange-500 text-white border-orange-500' : 'text-slate-400 border-slate-200 hover:border-orange-300'}`}
                    >
                      {st.critical ? '★ kritisch' : '☆ kritisch?'}
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2.5">
                    {(['gut', 'teilweise', 'kritisch'] as const).map(r => {
                      const m = RATING_META[r]
                      const active = st.rating === r
                      return (
                        <button key={r} onClick={() => setRating(d.key, r)}
                          className={`flex-1 text-xs font-semibold py-1.5 rounded-md border transition-colors ${active ? m.activeColor : `bg-white ${m.color} hover:bg-slate-50`}`}>
                          {m.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progress + Score */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>{rated.length}/{QUALITY_DIMENSIONS.length} bewertet</span>
                {rated.length > 0 && <span className="font-semibold">Ø {avgScore} %</span>}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${avgScore >= 80 ? 'bg-green-500' : avgScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${allRated ? avgScore : (rated.length / QUALITY_DIMENSIONS.length) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Verdict */}
          {verdict && (
            <div className={`rounded-xl border-2 px-4 py-3 ${verdict.color}`}>
              <p className="text-sm font-bold">{verdict.label}{zweck ? ` — „${zweck}"` : ''}</p>
              <p className="text-xs mt-1 leading-relaxed">{verdict.text}</p>
            </div>
          )}
          {!allRated && rated.length > 0 && (
            <p className="text-xs text-slate-400 text-center">Bewerte alle 6 Dimensionen für ein Gesamturteil.</p>
          )}
        </div>
      </div>

      {/* Theorie — bei Bedarf */}
      <TheoryBlock title="Die sechs Dimensionen der Datenqualität" hint="Was jede Dimension bedeutet, mit Beispielen">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {QUALITY_DIMENSIONS.map(d => (
            <div key={d.key} className="bg-white rounded-xl border border-slate-200 p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{d.icon}</span>
                <p className="text-sm font-bold text-slate-800">{d.title}</p>
              </div>
              <p className="text-xs text-slate-600">{d.frage}</p>
              <p className="text-[11px] text-slate-400 italic">{d.beispiel}</p>
            </div>
          ))}
        </div>
      </TheoryBlock>

      {/* Synthese */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong>Synthese:</strong> Datenqualität entsteht nicht durch bessere Technik — sie entsteht, wenn jemand (Data Owner, Data Steward) die Verantwortung dafür trägt und die Anforderungen klar definiert sind. Welche Dimension am wichtigsten ist, entscheidet nicht die IT, sondern der Fachbereich.
      </div>
    </div>
  )
}
