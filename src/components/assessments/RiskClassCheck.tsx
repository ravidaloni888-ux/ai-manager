import { useState } from 'react'

// Der Entscheidungsbaum fragt nach EINEM konkreten System — gehört an den Fall.

type NodeId = 'start' | 'q1' | 'q2' | 'q3' | 'r1' | 'r2' | 'r3' | 'r4'

interface TreeNode {
  id: NodeId
  type: 'question' | 'result'
  text: string
  sub?: string
  hints?: string[]
  yes?: NodeId
  no?: NodeId
  result?: { level: number; name: string; color: string; bg: string; border: string; text: string; desc: string; law: string }
}

export const TREE_NODES: Record<NodeId, TreeNode> = {
  start: { id: 'start', type: 'question', text: '', yes: 'q1' },
  q1: {
    id: 'q1', type: 'question',
    text: 'Fällt das KI-System unter eine der verbotenen Praktiken nach Art. 5?',
    sub: 'Gilt seit dem 2. Februar 2025 ohne Übergangsfrist.',
    hints: [
      'Unterschwellige Manipulation — beeinflusst Verhalten unbemerkt',
      'Social Scoring durch Behörden mit Konsequenzen in anderen Lebensbereichen',
      'Biometrische Echtzeit-Fernidentifizierung im öffentlichen Raum',
      'Prädiktive Polizeiarbeit allein auf Basis persönlicher Merkmale',
      'Emotionserkennung am Arbeitsplatz oder in Bildungseinrichtungen',
    ],
    yes: 'r1', no: 'q2',
  },
  q2: {
    id: 'q2', type: 'question',
    text: 'Wird das System in einem Hochrisiko-Bereich eingesetzt? (Art. 6 + Anhang III)',
    sub: 'Die entscheidende Frage — Hochrisiko bedeutet erheblichen Compliance-Aufwand.',
    hints: [
      'Biometrische Identifizierung oder Kategorisierung von Personen',
      'Kritische Infrastruktur (Energie, Wasser, Verkehr)',
      'Bildung & Berufsausbildung (Zulassung, Beurteilung)',
      'Beschäftigung & Personalmanagement (Einstellung, Entlassung, Leistungsbewertung)',
      'Zugang zu wesentlichen Dienstleistungen (Kredit, Sozialleistungen)',
      'Strafverfolgung, Migration & Asyl, Justiz & demokratische Prozesse',
      'KI in Medizinprodukten oder sicherheitsrelevanten Komponenten',
    ],
    yes: 'r2', no: 'q3',
  },
  q3: {
    id: 'q3', type: 'question',
    text: 'Handelt es sich um einen Chatbot, generiert das System Inhalte oder erkennt es Emotionen?',
    sub: 'Transparenzpflicht (Art. 50) — Nutzer müssen wissen, dass sie mit KI interagieren.',
    hints: [
      'Chatbot oder konversationelle KI (auch integriert in andere Systeme)',
      'Generierung von Texten, Bildern, Audio oder Video (z. B. für Marketing)',
      'Deepfake-Erstellung oder synthetische Medien',
      'Emotionserkennung (sofern nicht bereits unter Art. 5 verboten)',
    ],
    yes: 'r3', no: 'r4',
  },
  r1: {
    id: 'r1', type: 'result', text: '',
    result: {
      level: 1, name: 'Inakzeptables Risiko — VERBOTEN',
      color: 'bg-red-600', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700',
      desc: 'Dieses KI-System ist grundsätzlich verboten. Einsatz und Inverkehrbringen sind unzulässig. Bußgelder bis zu 35 Mio. € oder 7 % des weltweiten Jahresumsatzes.',
      law: 'Art. 5 EU AI Act · gilt seit 2. Feb 2025',
    },
  },
  r2: {
    id: 'r2', type: 'result', text: '',
    result: {
      level: 2, name: 'Hohes Risiko',
      color: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700',
      desc: 'Erlaubt — aber nur mit umfassenden Pflichten: Risikomanagement, technische Dokumentation (Anhang IV), CE-Kennzeichnung, Konformitätsbewertung vor Inverkehrbringen, EU-Datenbankregistrierung, menschliche Aufsicht.',
      law: 'Art. 6–49 + Anhang III · gilt ab Dez 2027',
    },
  },
  r3: {
    id: 'r3', type: 'result', text: '',
    result: {
      level: 3, name: 'Begrenztes Risiko',
      color: 'bg-amber-400', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700',
      desc: 'Erlaubt — Nutzer müssen darüber informiert werden, dass sie mit KI interagieren oder Inhalte KI-generiert sind. Keine weiteren spezifischen Compliance-Anforderungen nach AI Act.',
      law: 'Art. 50 EU AI Act · gilt ab Aug 2026',
    },
  },
  r4: {
    id: 'r4', type: 'result', text: '',
    result: {
      level: 4, name: 'Minimales Risiko',
      color: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700',
      desc: 'Keine spezifischen Pflichten nach dem EU AI Act. Freie Nutzung — allgemeine Rechtsvorschriften (DSGVO, Produkthaftung etc.) gelten weiterhin.',
      law: 'Keine AI-Act-Pflichten',
    },
  },
}

const QUESTION_ORDER: NodeId[] = ['q1', 'q2', 'q3']

export interface RiskClassState {
  answers: Record<string, boolean | null>
  currentNode: NodeId
  done: boolean
  resultId: NodeId | null
}

export const EMPTY_RISK_CLASS: RiskClassState = {
  answers: { q1: null, q2: null, q3: null, start: null, r1: null, r2: null, r3: null, r4: null },
  currentNode: 'q1',
  done: false,
  resultId: null,
}

export default function RiskClassCheck({ value, onChange }: {
  value: RiskClassState
  onChange: (fn: (prev: RiskClassState) => RiskClassState) => void
}) {
  const { answers, currentNode, done, resultId } = value
  const setAnswers     = (fn: (p: Record<string, boolean | null>) => Record<string, boolean | null>) =>
    onChange((p) => ({ ...p, answers: fn(p.answers) }))
  const setCurrentNode = (v: NodeId) => onChange((p) => ({ ...p, currentNode: v }))
  const setDone        = (v: boolean) => onChange((p) => ({ ...p, done: v }))
  const setResultId    = (v: NodeId | null) => onChange((p) => ({ ...p, resultId: v }))

  const answer = (nodeId: NodeId, yes: boolean) => {
    const node = TREE_NODES[nodeId]
    setAnswers((prev) => ({ ...prev, [nodeId]: yes }))
    const next = yes ? node.yes! : node.no!
    const nextNode = TREE_NODES[next]
    if (nextNode.type === 'result') {
      setResultId(next)
      setDone(true)
    } else {
      setCurrentNode(next)
    }
  }

  const reset = () => onChange(() => EMPTY_RISK_CLASS)

  const answeredQuestions = QUESTION_ORDER.filter((id) => answers[id] !== null)
  const result = resultId ? TREE_NODES[resultId].result! : null

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Risikoklassen-Check — Wo fällt mein KI-System rein?</p>
          <p className="text-xs text-slate-500 mt-0.5">Beantworte 1–3 Fragen um die Risikoklasse zu ermitteln</p>
        </div>
        {(answeredQuestions.length > 0 || done) && (
          <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 underline flex-shrink-0">
            Neu starten
          </button>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Progress breadcrumb */}
        <div className="flex items-center gap-2">
          {QUESTION_ORDER.map((id, i) => {
            const answered = answers[id] !== null
            const isCurrent = currentNode === id && !done
            return (
              <div key={id} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  answered ? (answers[id] ? 'bg-green-500 text-white' : 'bg-slate-400 text-white')
                  : isCurrent ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-400'
                }`}>
                  {answered ? (answers[id] ? '✓' : '✗') : i + 1}
                </div>
                {i < QUESTION_ORDER.length - 1 && (
                  <div className={`h-px w-6 ${answered ? 'bg-slate-300' : 'bg-slate-100'}`} />
                )}
              </div>
            )
          })}
          {done && result && (
            <>
              <div className="h-px w-6 bg-slate-300" />
              <div className={`w-6 h-6 rounded-full ${result.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                {result.level}
              </div>
            </>
          )}
        </div>

        {/* Answered questions — compact history */}
        {answeredQuestions.map((id) => {
          const node = TREE_NODES[id]
          const ans = answers[id]
          return (
            <div key={id} className="flex items-start gap-3 py-2 border-b border-slate-50">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${ans ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {ans ? 'Ja' : 'Nein'}
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">{node.text}</p>
            </div>
          )
        })}

        {/* Current question */}
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
                <button onClick={() => answer(currentNode, true)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                  Ja
                </button>
                <button onClick={() => answer(currentNode, false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                  Nein
                </button>
              </div>
            </div>
          )
        })()}

        {/* Result */}
        {done && result && (
          <div className={`rounded-xl border ${result.border} ${result.bg} px-5 py-4 space-y-2`}>
            <div className="flex items-center gap-3">
              <span className={`w-9 h-9 rounded-full ${result.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                {result.level}
              </span>
              <p className={`text-base font-bold ${result.text}`}>{result.name}</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{result.desc}</p>
            <p className={`text-[10px] font-semibold font-mono ${result.text}`}>{result.law}</p>
            <p className="text-[10px] text-slate-400 pt-1">Dieser Check dient der Erstorientierung. Für verbindliche Einordnung: Art. 6 und Anhang III lesen oder Fachanwalt hinzuziehen.</p>
          </div>
        )}
      </div>
    </div>
  )
}
