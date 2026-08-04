// Der Entscheidungsbaum fragt nach EINEM konkreten System — gehört an den Fall.
//
// Aufbau in der Prüfreihenfolge der Verordnung:
//   1 Ist es überhaupt ein KI-System?      Art. 3 Nr. 1
//   2 Greift eine Bereichsausnahme?         Art. 2
//   3 Verbotene Praktik?                    Art. 5
//   4 Sicherheitsbauteil eines Produkts?    Anhang I
//   5 Anhang-III-Bereich?                   Art. 6 Abs. 2
//   6 Entlastung nach Art. 6 Abs. 3?        — hebt Hochrisiko wieder auf
//   7 Transparenzpflicht?                   Art. 50

import type { EuAiActRisk } from '../../types'

export type NodeId =
  | 's1' | 's2' | 's3' | 's4' | 's5' | 's6' | 's7'
  | 'rKein' | 'rAusnahme' | 'rVerboten' | 'rHochAnhangI' | 'rHochAnhangIII'
  | 'rGefiltert' | 'rBegrenzt' | 'rMinimal'

interface Result {
  level: number
  name: string
  color: string
  bg: string
  border: string
  text: string
  desc: string
  law: string
}

interface TreeNode {
  id: NodeId
  type: 'question' | 'result'
  text: string
  sub?: string
  hints?: string[]
  /** Beschriftung der beiden Knöpfe, falls „Ja/Nein“ nicht passt */
  jaLabel?: string
  neinLabel?: string
  yes?: NodeId
  no?: NodeId
  result?: Result
}

export const TREE_NODES: Record<NodeId, TreeNode> = {
  s1: {
    id: 's1', type: 'question',
    text: 'Ist es überhaupt ein KI-System im Sinne der Verordnung?',
    sub: 'Art. 3 Nr. 1 — maschinengestützt, mit einem Grad an Autonomie, leitet aus Eingaben Ausgaben ab.',
    hints: [
      'Ja: maschinelles Lernen, neuronale Netze, Sprachmodelle, Computer Vision',
      'Ja: wissensbasierte Systeme mit Inferenz- und Suchlogik',
      'Nein: klassische Regelwerke „wenn A dann B", von Menschen vollständig festgelegt',
      'Nein: reine Statistik, Formeln in Tabellen, klassische Optimierung ohne Lernen',
    ],
    yes: 's2', no: 'rKein',
  },
  s2: {
    id: 's2', type: 'question',
    text: 'Greift eine Bereichsausnahme nach Art. 2?',
    sub: 'Trifft einer der Punkte zu, ist der AI Act auf diesen Einsatz nicht anwendbar.',
    hints: [
      'Ausschliesslich militärische Zwecke, Verteidigung oder nationale Sicherheit',
      'Reine Forschung und Entwicklung — vor dem Inverkehrbringen, nicht im Realbetrieb',
      'Rein private, nicht berufliche Nutzung durch natürliche Personen',
      'Freie Open-Source-Modelle — sofern nicht Hochrisiko, verboten oder unter Art. 50',
    ],
    jaLabel: 'Ja, eine trifft zu', neinLabel: 'Nein, keine trifft zu',
    yes: 'rAusnahme', no: 's3',
  },
  s3: {
    id: 's3', type: 'question',
    text: 'Fällt das KI-System unter eine der verbotenen Praktiken nach Art. 5?',
    sub: 'Gilt seit dem 2. Februar 2025 ohne Übergangsfrist.',
    hints: [
      'Unterschwellige Manipulation — beeinflusst Verhalten unbemerkt',
      'Social Scoring durch Behörden mit Konsequenzen in anderen Lebensbereichen',
      'Biometrische Echtzeit-Fernidentifizierung im öffentlichen Raum',
      'Prädiktive Polizeiarbeit allein auf Basis persönlicher Merkmale',
      'Emotionserkennung am Arbeitsplatz oder in Bildungseinrichtungen',
      'KI-generierte intime Bilder ohne Einwilligung (neu durch Digital Omnibus)',
    ],
    yes: 'rVerboten', no: 's4',
  },
  s4: {
    id: 's4', type: 'question',
    text: 'Ist die KI Sicherheitsbauteil eines Produkts nach Anhang I?',
    sub: 'Art. 6 Abs. 1 — produktintegrierte KI, die schon heute einer EU-Produktsicherheitsprüfung unterliegt.',
    hints: [
      'Medizinprodukte und In-vitro-Diagnostika (MDR / IVDR)',
      'Maschinen, Aufzüge, Seilbahnen, Druckgeräte',
      'Fahrzeuge, Luftfahrt, Bahn, Schiffe',
      'Spielzeug, Funkanlagen, persönliche Schutzausrüstung',
      'Faustregel: Trägt das Produkt heute schon eine CE-Kennzeichnung mit Prüfstelle?',
    ],
    yes: 'rHochAnhangI', no: 's5',
  },
  s5: {
    id: 's5', type: 'question',
    text: 'Wird das System in einem Bereich nach Anhang III eingesetzt?',
    sub: 'Art. 6 Abs. 2 — die acht Hochrisiko-Bereiche.',
    hints: [
      'Biometrische Identifizierung oder Kategorisierung von Personen',
      'Kritische Infrastruktur (Energie, Wasser, Verkehr)',
      'Bildung & Berufsausbildung (Zulassung, Beurteilung)',
      'Beschäftigung & Personalmanagement (Einstellung, Entlassung, Leistungsbewertung)',
      'Zugang zu wesentlichen Dienstleistungen (Kredit, Sozialleistungen, Notrufe)',
      'Strafverfolgung · Migration & Asyl · Justiz und demokratische Prozesse',
    ],
    yes: 's6', no: 's7',
  },
  s6: {
    id: 's6', type: 'question',
    text: 'Erfüllt das System dort nur eine entlastende Funktion nach Art. 6 Abs. 3?',
    sub: 'Trifft einer der vier Punkte zu, gilt das System trotz Anhang III nicht als hochriskant — es sei denn, es führt ein Profiling natürlicher Personen durch.',
    hints: [
      'Eng gefasste Verfahrensaufgabe (z. B. Dokumente sortieren, Dubletten finden)',
      'Verbessert nur das Ergebnis einer bereits abgeschlossenen menschlichen Tätigkeit',
      'Erkennt Entscheidungsmuster oder Abweichungen davon, ohne die Bewertung zu ersetzen',
      'Rein vorbereitende Aufgabe für eine Bewertung, die ein Mensch trifft',
      'Achtung: Profiling natürlicher Personen schliesst die Entlastung immer aus',
    ],
    jaLabel: 'Ja, nur entlastende Funktion', neinLabel: 'Nein, greift in die Bewertung ein',
    yes: 'rGefiltert', no: 'rHochAnhangIII',
  },
  s7: {
    id: 's7', type: 'question',
    text: 'Handelt es sich um einen Chatbot, generiert das System Inhalte oder erkennt es Emotionen?',
    sub: 'Transparenzpflicht (Art. 50) — Nutzer müssen wissen, dass sie mit KI interagieren.',
    hints: [
      'Chatbot oder konversationelle KI (auch integriert in andere Systeme)',
      'Generierung von Texten, Bildern, Audio oder Video (z. B. für Marketing)',
      'Deepfake-Erstellung oder synthetische Medien',
      'Emotionserkennung (sofern nicht bereits unter Art. 5 verboten)',
    ],
    yes: 'rBegrenzt', no: 'rMinimal',
  },

  // ── Ergebnisse ──
  rKein: {
    id: 'rKein', type: 'result', text: '',
    result: {
      level: 0, name: 'Kein KI-System — AI Act nicht anwendbar',
      color: 'bg-slate-400', bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700',
      desc: 'Nach Art. 3 Nr. 1 liegt kein KI-System vor. Der AI Act greift nicht. Allgemeines Recht — DSGVO, Produkthaftung, Arbeitsrecht — gilt unverändert weiter. Halten Sie diese Einschätzung schriftlich fest; die Abgrenzung wird bei Prüfungen gern hinterfragt.',
      law: 'Art. 3 Nr. 1 — Begriffsbestimmung',
    },
  },
  rAusnahme: {
    id: 'rAusnahme', type: 'result', text: '',
    result: {
      level: 0, name: 'Vom Anwendungsbereich ausgenommen',
      color: 'bg-slate-400', bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700',
      desc: 'Der Einsatz fällt unter eine Ausnahme des Art. 2. Vorsicht: Die Ausnahme gilt nur, solange sie trägt — geht ein Forschungssystem in den Realbetrieb oder wird ein privat genutztes System beruflich eingesetzt, greift der AI Act sofort. Ausnahme und Begründung dokumentieren.',
      law: 'Art. 2 — Anwendungsbereich',
    },
  },
  rVerboten: {
    id: 'rVerboten', type: 'result', text: '',
    result: {
      level: 1, name: 'Inakzeptables Risiko — VERBOTEN',
      color: 'bg-red-600', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700',
      desc: 'Dieses KI-System ist grundsätzlich verboten. Einsatz und Inverkehrbringen sind unzulässig. Bußgelder bis zu 35 Mio. € oder 7 % des weltweiten Jahresumsatzes.',
      law: 'Art. 5 EU AI Act · gilt seit 2. Feb 2025',
    },
  },
  rHochAnhangI: {
    id: 'rHochAnhangI', type: 'result', text: '',
    result: {
      level: 2, name: 'Hohes Risiko — produktintegriert (Anhang I)',
      color: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700',
      desc: 'Erlaubt, aber mit den vollen Hochrisiko-Pflichten. Besonderheit: Die Konformitätsbewertung läuft im bestehenden Produktverfahren mit (MDR, Maschinenverordnung etc.) — meist mit Prüfstelle nach Anhang VII. Frist ist der 2. August 2028, nicht 2027.',
      law: 'Art. 6 Abs. 1 + Anhang I · gilt ab Aug 2028',
    },
  },
  rHochAnhangIII: {
    id: 'rHochAnhangIII', type: 'result', text: '',
    result: {
      level: 2, name: 'Hohes Risiko',
      color: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700',
      desc: 'Erlaubt — aber nur mit umfassenden Pflichten: Risikomanagement, technische Dokumentation (Anhang IV), CE-Kennzeichnung, Konformitätsbewertung vor Inverkehrbringen, EU-Datenbankregistrierung, menschliche Aufsicht.',
      law: 'Art. 6 Abs. 2 + Anhang III · gilt ab Dez 2027',
    },
  },
  rGefiltert: {
    id: 'rGefiltert', type: 'result', text: '',
    result: {
      level: 3, name: 'Kein Hochrisiko — Entlastung nach Art. 6 Abs. 3',
      color: 'bg-amber-400', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700',
      desc: 'Das System liegt in einem Anhang-III-Bereich, erfüllt dort aber nur eine entlastende Funktion — die Hochrisiko-Pflichten entfallen. Zwei Auflagen bleiben: Sie müssen die Einschätzung dokumentieren, bevor das System in Betrieb geht (Art. 6 Abs. 4), und das System auf Verlangen in der EU-Datenbank registrieren. Prüfen Sie zusätzlich die Transparenzpflicht nach Art. 50.',
      law: 'Art. 6 Abs. 3 + 4 · Dokumentationspflicht bleibt',
    },
  },
  rBegrenzt: {
    id: 'rBegrenzt', type: 'result', text: '',
    result: {
      level: 3, name: 'Begrenztes Risiko',
      color: 'bg-amber-400', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700',
      desc: 'Erlaubt — Nutzer müssen darüber informiert werden, dass sie mit KI interagieren oder Inhalte KI-generiert sind. Keine weiteren spezifischen Compliance-Anforderungen nach AI Act.',
      law: 'Art. 50 EU AI Act · gilt ab Aug 2026',
    },
  },
  rMinimal: {
    id: 'rMinimal', type: 'result', text: '',
    result: {
      level: 4, name: 'Minimales Risiko',
      color: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700',
      desc: 'Keine spezifischen Pflichten nach dem EU AI Act. Freie Nutzung — allgemeine Rechtsvorschriften (DSGVO, Produkthaftung etc.) gelten weiterhin.',
      law: 'Keine AI-Act-Pflichten',
    },
  },
}

const QUESTION_ORDER: NodeId[] = ['s1', 's2', 's3', 's4', 's5', 's6', 's7']
const START_NODE: NodeId = 's1'

/**
 * Abbildung des Ergebnisses auf die vier Portfolio-Risikoklassen.
 * „Nicht anwendbar" und „ausgenommen" gibt es dort nicht — sie landen auf
 * Minimal, weil daraus keine AI-Act-Pflichten folgen.
 */
/**
 * Anzeigename des Ergebnisses — leer, wenn die ID aus einer älteren
 * Baumversion stammt. Immer hierüber auflösen, nie direkt über TREE_NODES:
 * gespeicherte Stände können IDs enthalten, die es nicht mehr gibt.
 */
export function resultName(id: NodeId | null | undefined): string {
  return (id && TREE_NODES[id]?.result?.name) || ''
}

export function riskFromResult(id: NodeId | null | undefined): EuAiActRisk | undefined {
  switch (id) {
    case 'rVerboten':       return 'Unacceptable Risk'
    case 'rHochAnhangI':
    case 'rHochAnhangIII':  return 'High Risk'
    case 'rGefiltert':
    case 'rBegrenzt':       return 'Limited Risk'
    case 'rKein':
    case 'rAusnahme':
    case 'rMinimal':        return 'Minimal Risk'
    default:                return undefined
  }
}

export interface RiskClassState {
  answers: Record<string, boolean | null>
  currentNode: NodeId
  done: boolean
  resultId: NodeId | null
  /** Anbieter eines KI-Modells mit allgemeinem Verwendungszweck? (Art. 51–55) */
  gpai?: boolean | null
}

export const EMPTY_RISK_CLASS: RiskClassState = {
  answers: {},
  currentNode: START_NODE,
  done: false,
  resultId: null,
  gpai: null,
}

/** Stände aus einer älteren Baumversion verwerfen statt daran zu scheitern. */
function normalisieren(v: RiskClassState): RiskClassState {
  const knotenBekannt = !!TREE_NODES[v.currentNode]
  const ergebnisBekannt = v.resultId === null || !!TREE_NODES[v.resultId]
  if (knotenBekannt && ergebnisBekannt) return v
  return { ...EMPTY_RISK_CLASS, gpai: v.gpai ?? null }
}

export default function RiskClassCheck({ value, onChange }: {
  value: RiskClassState
  onChange: (fn: (prev: RiskClassState) => RiskClassState) => void
}) {
  const { answers, currentNode, done, resultId, gpai } = normalisieren(value)

  const antworte = (nodeId: NodeId, ja: boolean) => {
    const node = TREE_NODES[nodeId]
    const next = ja ? node.yes! : node.no!
    const zielIstErgebnis = TREE_NODES[next].type === 'result'
    onChange((p) => {
      const basis = normalisieren(p)
      return {
        ...basis,
        answers: { ...basis.answers, [nodeId]: ja },
        currentNode: zielIstErgebnis ? basis.currentNode : next,
        resultId: zielIstErgebnis ? next : null,
        done: zielIstErgebnis,
      }
    })
  }

  const reset = () => onChange((p) => ({ ...EMPTY_RISK_CLASS, gpai: normalisieren(p).gpai }))
  const setGpai = (v: boolean) => onChange((p) => ({ ...normalisieren(p), gpai: v }))

  const beantwortet = QUESTION_ORDER.filter((id) => answers[id] !== undefined && answers[id] !== null)
  const result = resultId ? TREE_NODES[resultId].result! : null

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Risikoklassen-Check — Wo fällt mein KI-System rein?</p>
          <p className="text-xs text-slate-500 mt-0.5">In der Prüfreihenfolge der Verordnung — meist sind 3–5 Fragen nötig</p>
        </div>
        {(beantwortet.length > 0 || done) && (
          <button type="button" onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 underline flex-shrink-0">
            Neu starten
          </button>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Fortschritt */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {QUESTION_ORDER.map((id, i) => {
            const ist = answers[id] !== undefined && answers[id] !== null
            const aktuell = currentNode === id && !done
            return (
              <div key={id} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  ist ? (answers[id] ? 'bg-green-500 text-white' : 'bg-slate-400 text-white')
                  : aktuell ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-400'
                }`}>
                  {ist ? (answers[id] ? '✓' : '✗') : i + 1}
                </div>
                {i < QUESTION_ORDER.length - 1 && (
                  <div className={`h-px w-3 ${ist ? 'bg-slate-300' : 'bg-slate-100'}`} />
                )}
              </div>
            )
          })}
          {done && result && (
            <>
              <div className="h-px w-3 bg-slate-300" />
              <div className={`w-6 h-6 rounded-full ${result.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                {result.level || '–'}
              </div>
            </>
          )}
        </div>

        {/* Bisherige Antworten */}
        {beantwortet.map((id) => {
          const node = TREE_NODES[id]
          const ja = answers[id]
          return (
            <div key={id} className="flex items-start gap-3 py-2 border-b border-slate-50">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${ja ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {ja ? 'Ja' : 'Nein'}
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">{node.text}</p>
            </div>
          )
        })}

        {/* Aktuelle Frage */}
        {!done && (() => {
          const node = TREE_NODES[currentNode]
          return (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{node.text}</p>
                {node.sub && <p className="text-xs text-blue-600 mt-1">{node.sub}</p>}
                {node.hints && (
                  <ul className="mt-3 space-y-1">
                    {node.hints.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                        <span className="text-xs text-slate-600">{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => antworte(currentNode, true)}
                  className="flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                  {node.jaLabel ?? 'Ja'}
                </button>
                <button type="button" onClick={() => antworte(currentNode, false)}
                  className="flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                  {node.neinLabel ?? 'Nein'}
                </button>
              </div>
            </div>
          )
        })()}

        {/* Ergebnis */}
        {done && result && (
          <div className={`rounded-xl border ${result.border} ${result.bg} px-5 py-4 space-y-2`}>
            <div className="flex items-center gap-3">
              <span className={`w-9 h-9 rounded-full ${result.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                {result.level || '–'}
              </span>
              <p className={`text-base font-bold ${result.text}`}>{result.name}</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{result.desc}</p>
            <p className={`text-[10px] font-semibold font-mono ${result.text}`}>{result.law}</p>
            <p className="text-[10px] text-slate-400 pt-1">Dieser Check dient der Erstorientierung. Für verbindliche Einordnung: Art. 6 und Anhang III lesen oder Fachanwalt hinzuziehen.</p>
          </div>
        )}

        {/* GPAI gilt zusätzlich zur Risikoklasse, nicht statt ihrer */}
        {done && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-slate-700">Zusätzlich: Entwickeln Sie selbst ein KI-Modell mit allgemeinem Verwendungszweck?</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Gemeint ist das Modell, nicht die Anwendung — ein zugekauftes Modell zu nutzen zählt nicht.
              Diese Pflichten gelten neben der Risikoklasse.
            </p>
            <div className="flex gap-2 mt-2.5">
              <button type="button" onClick={() => setGpai(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  gpai === true ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}>
                Ja
              </button>
              <button type="button" onClick={() => setGpai(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  gpai === false ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}>
                Nein
              </button>
            </div>
            {gpai === true && (
              <p className="text-[11px] text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 mt-2.5 leading-relaxed">
                <strong>GPAI-Pflichten kommen hinzu:</strong> technische Dokumentation des Modells,
                Informationen für nachgelagerte Anbieter, Urheberrechts-Strategie und eine öffentliche
                Zusammenfassung der Trainingsdaten. Ab 10<sup>25</sup> FLOPs Trainingsrechenleistung gilt das
                Modell als systemisch riskant — dann zusätzlich Modellbewertung, Angriffstests,
                Vorfallmeldung und Cybersicherheitsschutz.
                <span className="block text-[10px] font-mono text-slate-500 mt-1">Art. 51–55 · gilt seit 2. Aug 2025</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
