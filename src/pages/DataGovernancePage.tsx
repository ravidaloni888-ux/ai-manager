import { useState } from 'react'
import TheoryBlock from '../components/ui/TheoryBlock'

// ─────────────────────────────────────────────────────────────────────────
// Tag 15 · Datenmanagement & -Governance
// ─────────────────────────────────────────────────────────────────────────

// ── Seite 5: Die sechs Dimensionen der Datenqualität ─────────────────────

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

function DatenqualitaetTool() {
  const [zweck, setZweck] = useState('')
  const [state, setState] = useState<Record<string, DimState>>(
    Object.fromEntries(QUALITY_DIMENSIONS.map(d => [d.key, { rating: null, critical: false }]))
  )

  const setRating = (key: string, rating: Rating) =>
    setState(s => ({ ...s, [key]: { ...s[key], rating: s[key].rating === rating ? null : rating } }))
  const toggleCritical = (key: string) =>
    setState(s => ({ ...s, [key]: { ...s[key], critical: !s[key].critical } }))

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

// ── Seite 7: Datenintegrität — Drei Mechanismen (Info) ───────────────────

const INTEGRITY_MECHANISMS = [
  {
    icon: '🔒',
    title: 'Prüfsummen & Hashes',
    body: 'Beim Einlesen eines Dokuments wird ein kryptographischer Fingerabdruck erzeugt. Bei jedem Abruf wird er verglichen — stimmt er nicht mehr, wurde das Dokument verändert.',
    tag: 'Unveränderlichkeit',
  },
  {
    icon: '📋',
    title: 'Audit-Trail',
    body: 'Protokolliert nach Art. 12 EU AI Act bei Hochrisiko-KI Ereignisse während des Lebenszyklus des Systems in einem der Zweckbestimmung angemessenen Maße.',
    tag: 'Nachvollziehbarkeit',
    highlight: 'Neue Umsetzungsfrist (Digital Omnibus, 7. Mai 2026): 2. Dezember 2027',
  },
  {
    icon: '🗂',
    title: 'Versionierung',
    body: 'Erhält frühere Datenstände und die Möglichkeit, sie wiederherzustellen (Back-up, Disaster Recovery).',
    tag: 'Zustandshistorie',
  },
]

const VERSIONING_PRINCIPLES = [
  { title: 'Zustandshistorie', body: 'Jeder frühere Datenzustand bleibt abrufbar — kein Informationsverlust durch Überschreiben.' },
  { title: 'Änderungstransparenz', body: 'Was wurde geändert? Von wem? Zu welchem Zeitpunkt? Die Änderung ist sichtbar und begründet.' },
  { title: 'Parallelbetrieb', body: 'Alt und neu koexistieren — keine Zwangsentscheidung beim Anlegen einer neuen Version.' },
]

function DatenintegritaetTab() {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 rounded-r-xl px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong>Datenintegrität</strong> stellt sicher, dass Daten das bleiben, was sie sein sollen. Drei Mechanismen greifen ineinander.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {INTEGRITY_MECHANISMS.map(m => (
          <div key={m.title} className="bg-white rounded-xl border-2 border-orange-200 p-5 space-y-2 flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{m.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{m.tag}</span>
            </div>
            <p className="text-sm font-bold text-slate-800">{m.title}</p>
            <p className="text-xs text-slate-600 leading-relaxed flex-1">{m.body}</p>
            {m.highlight && (
              <p className="text-[11px] font-semibold text-orange-700 bg-orange-50 rounded-lg px-2.5 py-1.5 mt-1">{m.highlight}</p>
            )}
          </div>
        ))}
      </div>

      {/* Versioning detail */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Versionierung · Drei Kernprinzipien</p>
          <p className="text-xs text-slate-400 mt-1">Zustände erhalten, Änderungen nachvollziehen. Die alte Version bleibt erhalten — auch wenn eine neue angelegt wird.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VERSIONING_PRINCIPLES.map(p => (
            <div key={p.title} className="border border-orange-200 rounded-lg p-3 space-y-1">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">{p.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Seite 12: FAIR-Prinzipien (Info + Check-Tool) ────────────────────────

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

function FairTab() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setChecked(c => ({ ...c, [id]: !c[id] }))

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

// ── Page ─────────────────────────────────────────────────────────────────

export default function DataGovernancePage() {
  const [tab, setTab] = useState<'qualitaet' | 'integritaet' | 'fair'>('qualitaet')

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-4">
        <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-1">KI-Beauftragte:r · Tag 15</p>
        <h1 className="text-2xl font-bold text-slate-800">Datenmanagement &amp; -Governance</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Qualität · Integrität · FAIR — Daten prüfen, bevor die KI sie nutzt
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {([
          { id: 'qualitaet',   label: '🧪 Datenqualität' },
          { id: 'integritaet', label: '🔒 Datenintegrität' },
          { id: 'fair',        label: '✅ FAIR-Check' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'qualitaet' && <DatenqualitaetTool />}
      {tab === 'integritaet' && <DatenintegritaetTab />}
      {tab === 'fair' && <FairTab />}
    </div>
  )
}
