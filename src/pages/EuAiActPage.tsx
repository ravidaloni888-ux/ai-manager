import { useState } from 'react'

// ── Data ───────────────────────────────────────────────────────────────────

const TIMELINE = [
  { date: '1 Aug 2024', label: 'AI Act tritt in Kraft', highlight: false },
  { date: '2 Feb 2025', label: 'Verbote (Art. 5) + Kompetenzpflicht (Art. 4) — gilt heute', highlight: true },
  { date: '2 Aug 2025', label: 'GPAI-Modelle (Kap. V)', highlight: false },
  { date: '16/29 Jun 2026', label: 'Digital Omnibus: EP-Abstimmung (423 Stimmen) + Ratsbeschluss — nur noch Amtsblatt ausstehend (vor 2.8.2026)', highlight: true },
  { date: '2 Dec 2027', label: 'Hochrisiko-KI (Anhang III) — verschoben durch Digital Omnibus', highlight: false },
  { date: '2 Aug 2028', label: 'Vollständige Anwendung + produktintegrierte KI (Anhang I)', highlight: true },
]

const RISK_CLASSES = [
  {
    level: 1,
    name: 'Inakzeptables Risiko',
    color: 'bg-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    summary: 'Verbotene Praktiken — vollständig verboten seit 2. Feb 2025',
    duties: 'Einsatz und Inverkehrbringen sind verboten. Verstöße: Bußgelder bis zu 35 Mio. € oder 7 % des weltweiten Jahresumsatzes.',
    examples: [
      'Unterschwellige Manipulation (KI beeinflusst Verhalten unbemerkt)',
      'Social Scoring durch Behörden',
      'Biometrische Echtzeit-Fernidentifizierung im öffentlichen Raum (mit engen Ausnahmen)',
      'Prädiktive Polizeiarbeit allein auf Basis persönlicher Merkmale',
      'Emotionserkennung am Arbeitsplatz und in Bildungseinrichtungen',
    ],
  },
  {
    level: 2,
    name: 'Hohes Risiko',
    color: 'bg-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
    summary: 'Strenge Anforderungen für sensible Anwendungsbereiche (Art. 6–49)',
    duties: 'Risikomanagement, Datenqualität, technische Dokumentation, Transparenz, menschliche Aufsicht, Genauigkeit & Robustheit, Konformitätsbewertung vor Inverkehrbringen.',
    examples: [
      'KI in Medizinprodukten',
      'Biometrische Identifizierungssysteme',
      'Kritische Infrastruktur',
      'Bildung & Berufsausbildung',
      'Beschäftigung & Personalmanagement',
      'Zugang zu wesentlichen Dienstleistungen',
      'Strafverfolgung, Migration & Asyl, Justiz',
    ],
  },
  {
    level: 3,
    name: 'Begrenztes Risiko',
    color: 'bg-amber-400',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    summary: 'Transparenzpflichten für bestimmte KI-Systeme (Art. 50–51)',
    duties: 'Nutzer müssen darüber informiert werden, dass sie mit KI interagieren oder Inhalte KI-generiert sind. Keine weiteren spezifischen Compliance-Anforderungen.',
    examples: [
      'Chatbots (müssen sich als KI zu erkennen geben)',
      'KI-generierte Inhalte / Deepfakes',
      'Emotionserkennung (sofern nicht verboten)',
    ],
  },
  {
    level: 4,
    name: 'Minimales Risiko',
    color: 'bg-green-500',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
    summary: 'Freie Nutzung — keine spezifischen KI-Act-Anforderungen',
    duties: 'Keine spezifischen Pflichten nach dem KI-Act. Allgemeine Rechtsvorschriften gelten weiterhin.',
    examples: [
      'Spam-Filter',
      'KI in Videospielen',
      'Inhaltsempfehlungssysteme',
      'Einfache Automatisierungstools',
    ],
  },
]

const ACTOR_ROLES = [
  {
    role: 'Anbieter',
    art: 'Art. 3 Nr. 3',
    definition: 'Entwickelt KI und bringt sie in Verkehr',
    example: 'Das Softwarehaus, das das Basis-System gebaut hat',
    duties: 'Vollständige Art. 16-Pflichten bei Hochrisiko-KI: Dokumentation, Konformitätsbewertung, CE-Kennzeichnung, Registrierung, Marktüberwachung nach Inverkehrbringen.',
  },
  {
    role: 'Betreiber',
    art: 'Art. 3 Nr. 4',
    definition: 'Setzt ein fremdes KI-System in eigener Verantwortung ein',
    example: 'Dr. Seika — solange das System unverändert bleibt. Private, nicht berufliche Nutzung ist ausdrücklich ausgenommen.',
    duties: 'Art. 26-Pflichten: zweckgemäßen Einsatz sicherstellen, zuständige Personen benennen und schulen (Art. 4), menschliche Aufsicht gewährleisten (Art. 14), Inputdaten überwachen, Vorfälle an den Anbieter melden.',
  },
  {
    role: 'Importeur',
    art: 'Art. 3 Nr. 6',
    definition: 'Bringt KI aus einem Drittstaat in die EU',
    example: 'EU-Tochter ("Bevollmächtigter") eines US- oder chinesischen Unternehmens',
    duties: 'Prüfen ob der Anbieter die Art. 16-Pflichten erfüllt hat, bevor die KI auf dem EU-Markt platziert wird.',
  },
  {
    role: 'Händler',
    art: 'Art. 3 Nr. 7',
    definition: 'Stellt KI in der Lieferkette bereit, ohne Veränderung',
    example: 'Reseller, der Softwarelizenzen weiterverkauft (nicht in der EU ansässig)',
    duties: 'CE-Kennzeichnung und Dokumentation prüfen; nicht in Verkehr bringen, wenn Anforderungen nicht erfüllt sind.',
  },
]

const ART25_TRIGGERS = [
  {
    id: 'modification',
    title: 'Erhebliche Veränderung',
    desc: 'Ein Hochrisiko-KI-System wird erheblich verändert (z. B. mit eigenen Daten nachtrainiert) — Art. 25 Abs. 1 lit. b',
  },
  {
    id: 'purpose',
    title: 'Zweckänderung',
    desc: 'Ein System wird für einen wesentlich anderen Zweck eingesetzt als vom Anbieter vorgesehen',
  },
  {
    id: 'own_brand',
    title: 'Eigenvermarktung',
    desc: 'Ein System wird unter eigenem Namen oder eigener Marke vermarktet — eindeutig, kein Graubereich',
  },
]

const COPYRIGHT_RULES = [
  {
    scenario: 'Rein KI-generiert',
    protection: 'Kein Schutz',
    color: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
    detail: 'Kein menschlicher Gestaltungsanteil → kein Urheberrechtsschutz nach §2 UrhG. Nur "persönliche geistige Schöpfungen" sind geschützt.',
  },
  {
    scenario: 'Mensch + KI',
    protection: 'Abhängig vom menschlichen Anteil',
    color: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    detail: 'Prompt, Auswahl, Bearbeitung → Je höher der menschliche Anteil, desto eher besteht Urheberrechtsschutz.',
  },
  {
    scenario: 'KI als Werkzeug',
    protection: 'Voller Schutz',
    color: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
    detail: 'KI nur als Werkzeug eingesetzt, Mensch schafft das Werk → geschützt wie eine herkömmliche Schöpfung.',
  },
]

const LIABILITY_TABLE = [
  { situation: 'KI-Fehler durch Designmangel', liable: 'Anbieter' },
  { situation: 'Fehleinsatz durch Betreiber', liable: 'Betreiber' },
  { situation: 'Projektleiter prüft KI-Output nicht', liable: 'Projektleiter + Büro' },
  { situation: 'Alle drei zusammen', liable: 'Gesamtschuldnerschaft' },
]

// ── Decision Tree ──────────────────────────────────────────────────────────

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

const TREE_NODES: Record<NodeId, TreeNode> = {
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

function RiskDecisionTree() {
  const [answers, setAnswers] = useState<Record<NodeId, boolean | null>>({ q1: null, q2: null, q3: null, start: null, r1: null, r2: null, r3: null, r4: null })
  const [currentNode, setCurrentNode] = useState<NodeId>('q1')
  const [done, setDone] = useState(false)
  const [resultId, setResultId] = useState<NodeId | null>(null)

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

  const reset = () => {
    setAnswers({ q1: null, q2: null, q3: null, start: null, r1: null, r2: null, r3: null, r4: null })
    setCurrentNode('q1')
    setDone(false)
    setResultId(null)
  }

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

// ── Components ─────────────────────────────────────────────────────────────

function RiskClassCard({ rc, expanded, onToggle }: {
  rc: typeof RISK_CLASSES[0]
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className={`rounded-xl border ${rc.border} overflow-hidden`}>
      <button onClick={onToggle} className={`w-full flex items-center gap-4 px-5 py-4 ${rc.bg} hover:opacity-90 transition-opacity text-left`}>
        <span className={`w-8 h-8 rounded-full ${rc.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {rc.level}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-bold ${rc.text}`}>{rc.name}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rc.badge}`}>{rc.level === 1 ? 'VERBOTEN' : rc.level === 2 ? 'STRENG' : rc.level === 3 ? 'TRANSPARENZ' : 'FREI'}</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">{rc.summary}</p>
        </div>
        <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && (
        <div className="px-5 py-4 bg-white space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Pflichten</p>
            <p className="text-xs text-slate-600 leading-relaxed">{rc.duties}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Beispiele</p>
            <ul className="space-y-1">
              {rc.examples.map((e) => (
                <li key={e} className="flex items-start gap-2">
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${rc.color}`} />
                  <span className="text-xs text-slate-600">{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function Art25Checker() {
  const [triggered, setTriggered] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setTriggered((p) => ({ ...p, [id]: !p[id] }))
  const activeCount = ART25_TRIGGERS.filter((t) => triggered[t.id]).length
  const isProvider = activeCount > 0

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-800">Art. 25 — Rollenübergang-Check</p>
        <p className="text-xs text-slate-500 mt-0.5">Wann wird ein Betreiber zum Anbieter (mit allen Art. 16-Pflichten)?</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        {ART25_TRIGGERS.map((t) => (
          <label key={t.id} onClick={() => toggle(t.id)} className="flex items-start gap-3 cursor-pointer group hover:bg-slate-50 -mx-5 px-5 py-2 rounded transition-colors">
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${triggered[t.id] ? 'bg-orange-500 border-orange-500' : 'border-slate-300 group-hover:border-orange-400'}`}>
              {triggered[t.id] && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">{t.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
            </div>
          </label>
        ))}
      </div>
      {activeCount > 0 && (
        <div className="mx-5 mb-5 px-4 py-3 rounded-lg bg-orange-50 border border-orange-200">
          <p className="text-sm font-semibold text-orange-700">⚠ Rollenübergang — Sie sind jetzt Anbieter</p>
          <p className="text-xs text-orange-600 mt-1">Alle Art. 16-Anbieterpflichten gelten. Dazu gehören Dokumentation, Konformitätsbewertung, CE-Kennzeichnung und Registrierung in der EU-Datenbank. Fachanwalt hinzuziehen (Dreistufenmodell Stufe 3).</p>
        </div>
      )}
      {activeCount === 0 && (
        <div className="mx-5 mb-5 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500">Wählen Sie oben einen Auslöser aus, um zu prüfen ob ein Rollenübergang vorliegt.</p>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EuAiActPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'copyright' | 'liability'>('overview')
  const [expandedRisk, setExpandedRisk] = useState<number | null>(null)

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'overview', label: 'Risikoklassen & Zeitplan' },
    { id: 'roles', label: 'Akteursrollen' },
    { id: 'copyright', label: 'Urheberrecht' },
    { id: 'liability', label: 'Haftung' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">EU AI Act</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Risikobasiertes Produktrecht für KI-Systeme — Struktur, Akteursrollen, Urheberrecht und Haftung
        </p>
      </div>

      {/* Key facts */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: '4', label: '4 Risikoklassen', sub: 'Verboten · Hochrisiko · Begrenztes Risiko · Minimal' },
          { value: 'Feb 25', label: 'Bereits in Kraft', sub: 'Art. 5 (Verbote) + Art. 4 (KI-Kompetenz)' },
          { value: '≠', label: 'AI Act ≠ DSGVO', sub: 'Gilt unabhängig von der Verarbeitung personenbezogener Daten' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-2xl font-bold text-slate-800">{m.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{m.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Important banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3">
        <p className="text-xs text-red-700 leading-relaxed">
          <span className="font-semibold">Wichtig:</span> Viele Betreiber glauben, der AI Act gelte noch nicht. Art. 5 und Art. 4 gelten seit Februar 2025 — vollständig und ohne Übergangsfrist. Ein System, das keine personenbezogenen Daten verarbeitet, fällt trotzdem unter den AI Act.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Decision Tree */}
          <RiskDecisionTree />

          {/* Structure */}
          <div className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-sm font-semibold text-slate-800 mb-3">KI-Act-Logik: Verboten → Hochrisiko → Transparenz → GPAI → Sanktionen</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 pr-4 font-semibold text-slate-600 whitespace-nowrap">Kapitel</th>
                    <th className="text-left py-2 font-semibold text-slate-600">Inhalt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { ch: 'Art. 5', c: 'Verbotene Praktiken' },
                    { ch: 'Art. 6–49', c: 'Hochrisiko-KI — das Herzstück' },
                    { ch: 'Art. 50–51', c: 'Transparenzpflichten' },
                    { ch: 'Art. 52–56', c: 'GPAI-Modelle / Foundation Models' },
                    { ch: 'Art. 99–101', c: 'Sanktionen bis zu 35 Mio. € oder 7 % Umsatz' },
                  ].map((r) => (
                    <tr key={r.ch}>
                      <td className="py-2 pr-4 font-mono text-slate-500 whitespace-nowrap">{r.ch}</td>
                      <td className="py-2 text-slate-600">{r.c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Zeitplan — was gilt wann?</p>
            </div>
            <div className="divide-y divide-slate-50">
              {TIMELINE.map((item) => (
                <div key={item.date} className={`flex items-start gap-4 px-5 py-3 ${item.highlight ? 'bg-blue-50' : ''}`}>
                  <span className="text-xs font-mono text-slate-500 whitespace-nowrap mt-0.5 min-w-[90px]">{item.date}</span>
                  <p className={`text-xs leading-relaxed ${item.highlight ? 'font-semibold text-blue-700' : 'text-slate-600'}`}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk classes — simple overview grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                num: '1', name: 'Inakzeptables Risiko', color: 'bg-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700',
                plain: '1. Verboten. Diese KI-Systeme sind grundsätzlich nicht erlaubt.',
                law: 'Art. 5 · gilt ab Feb 2025',
                penalty: 'Bis zu 35 Mio. € oder 7 % Umsatz',
                examples: ['Social Scoring', 'Unterschwellige Manipulation', 'Biometrische Echtzeit-ID im öffentlichen Raum'],
              },
              {
                num: '2', name: 'Hohes Risiko', color: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700',
                plain: '2. Erlaubt — aber nur mit strenger Dokumentation, Aufsicht und Konformitätsprüfung vor dem Einsatz.',
                law: 'Art. 6–49 + Anhang III · Dez 2027',
                penalty: 'Kein Marktzugang ohne Konformität',
                examples: ['KI im HR & Recruiting', 'Kreditscoring', 'KI in Bildung', 'Medizinische KI'],
              },
              {
                num: '3', name: 'Begrenztes Risiko', color: 'bg-amber-400', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
                plain: '3. Erlaubt — aber Nutzer müssen darauf hingewiesen werden, dass sie mit KI interagieren.',
                law: 'Art. 50 · gilt ab Aug 2026',
                penalty: 'Bußgeld bei fehlender Kennzeichnung',
                examples: ['Chatbots', 'KI-generierte Bilder/Texte', 'Deepfakes'],
              },
              {
                num: '4', name: 'Minimales Risiko', color: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700',
                plain: '4. Frei nutzbar. Keine spezifischen KI-Act-Anforderungen.',
                law: 'Keine spezifischen Pflichten',
                penalty: 'Keine nach dem KI-Act',
                examples: ['Spam-Filter', 'Empfehlungssysteme', 'KI in Spielen'],
              },
            ].map((rc) => (
              <div key={rc.num} className={`rounded-xl border ${rc.border} ${rc.bg} p-4 flex flex-col gap-2`}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full ${rc.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{rc.num}</span>
                  <p className={`text-sm font-bold ${rc.text}`}>{rc.name}</p>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{rc.plain}</p>
                <p className="text-[10px] text-slate-500 font-mono">{rc.law}</p>
                <ul className="space-y-0.5 mt-1">
                  {rc.examples.map((e) => (
                    <li key={e} className="flex items-center gap-1.5">
                      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${rc.color}`} />
                      <span className="text-[11px] text-slate-600">{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Risk classes — detail cards */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Detailansicht — zum Aufklappen</p>
            {RISK_CLASSES.map((rc) => (
              <RiskClassCard
                key={rc.level}
                rc={rc}
                expanded={expandedRisk === rc.level}
                onToggle={() => setExpandedRisk(expandedRisk === rc.level ? null : rc.level)}
              />
            ))}
          </div>

          {/* Key question */}
          <div className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-sm font-semibold text-slate-800 mb-2">Vier Risikoklassen</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">"Haben wir es mit einem Hochrisiko-KI-System zu tun?"</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Art. 6 und Anhang III lesen. Das ist die entscheidende Sollbruchstelle im KI-Management — bei Systemen mit begrenztem Risiko sind die Pflichten überschaubar (Art. 4 + Art. 50). Bei Hochrisiko-Systemen ist der Compliance-Aufwand erheblich — CE-Kennzeichnung, Dokumentation, Konformitätsbewertung.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Roles */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">Merksatz:</span> Die Rolle bestimmt die Pflichten — nicht das System. Dasselbe KI-System erzeugt für Betreiber und Anbieter unterschiedliche Pflichtenkataloge.
            </p>
          </div>

          {ACTOR_ROLES.map((r) => (
            <div key={r.role} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded">{r.art}</span>
                <p className="text-sm font-semibold text-slate-800">{r.role}</p>
              </div>
              <div className="px-5 py-4 space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-700">Definition:</span> {r.definition}</p>
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-700">Beispiel:</span> {r.example}</p>
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-700">Pflichten:</span> {r.duties}</p>
              </div>
            </div>
          ))}

          <Art25Checker />
        </div>
      )}

      {/* Tab: Copyright */}
      {activeTab === 'copyright' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">§44b UrhG — Darf KI mit urheberrechtlich geschütztem Material trainiert werden?</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                §44b UrhG erlaubt Text and Data Mining (TDM) "um daraus Informationen insbesondere über Muster, Trends und Korrelationen zu gewinnen" — es sei denn, die Rechteinhaber haben einen Nutzungsvorbehalt (Opt-Out) ausgesprochen.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-400 px-4 py-3 rounded-r-lg">
                <p className="text-xs text-amber-700 leading-relaxed"><span className="font-semibold">Opt-Out muss maschinenlesbar sein:</span> robots.txt, TDM Reservation Protocol oder IPTC/XMP-Metadaten. Eine Erklärung in AGB oder im Impressum reicht nicht (OLG Hamburg, Dez. 2025).</p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-400 px-4 py-3 rounded-r-lg">
                <p className="text-xs text-red-700 leading-relaxed"><span className="font-semibold">LG München I, Nov. 2025:</span> Dauerhafte Einbettung vollständiger Werke in Modellparameter = Vervielfältigung — geht über die TDM-Ausnahme hinaus.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Wem gehört, was die KI schreibt? (§2 UrhG)</p>
              <p className="text-xs text-slate-500 mt-0.5">Nach deutschem Urheberrecht schützt §2 UrhG nur "persönliche geistige Schöpfungen"</p>
            </div>
            <div className="divide-y divide-slate-50">
              {COPYRIGHT_RULES.map((r) => (
                <div key={r.scenario} className="px-5 py-4 flex items-start gap-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${r.badge}`}>{r.protection}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-0.5">{r.scenario}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Liability */}
      {activeTab === 'liability' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Produkthaftung für KI (ProdHaftG / EU-Richtlinie 2024/2853)</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Das Produkthaftungsgesetz (ProdHaftG, 1989) macht Hersteller für fehlerhafte <strong>Produkte</strong> haftbar — ohne Verschuldensnachweis. Das Problem: Das ProdHaftG wurde für physische Produkte entwickelt. Software — und erst recht lernende Software — passt nicht gut in diesen Rahmen.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Neue EU-Produkthaftungsrichtlinie 2024/2853</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Erfasst Software (einschließlich KI-Systeme) ausdrücklich als "Produkt". Umsetzungsfrist: <strong>9. Dezember 2026</strong>.</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Kontinuierliches Lernen</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Hersteller haften auch für Fehler, die aus <strong>kontinuierlichem Lernen</strong> nach Inverkehrbringen entstehen.</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">KI-Haftungsrichtlinie — zurückgezogen</p>
                <p className="text-xs text-amber-600 leading-relaxed">Die EU-Kommission hat 2022 einen Entwurf für eine KI-Haftungsrichtlinie vorgelegt (Kernidee: Beweislastumkehr). Sie wurde im <strong>Februar 2025</strong> offiziell zurückgezogen. Eine spezifische KI-Haftungsregelung auf EU-Ebene gibt es derzeit nicht.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Wer haftet heute?</p>
            </div>
            <div className="divide-y divide-slate-50">
              {LIABILITY_TABLE.map((row) => (
                <div key={row.situation} className="flex items-start gap-4 px-5 py-3">
                  <p className="flex-1 text-xs text-slate-600">{row.situation}</p>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">{row.liable}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-600">Hinweis:</span> Haftungsfragen sind Dreistufenmodell Stufe 3 — immer einen Fachanwalt hinzuziehen. Diese Übersicht dient der Orientierung und stellt keine Rechtsberatung dar.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
