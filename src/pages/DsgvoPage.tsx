import { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

type Stufe = 1 | 2 | 3 | null

interface Article {
  id: string
  tag: string
  title: string
  summary: string
  details: string
  example?: string
  warning?: string
}

// ── Data ───────────────────────────────────────────────────────────────────

const ARTICLES: Article[] = [
  {
    id: 'art3',
    tag: 'Art. 3',
    title: 'Marktortprinzip — DSGVO gilt weltweit',
    summary: 'Die DSGVO gilt für alle Unternehmen, die Waren oder Dienste aktiv an EU-Bürger:innen richten — unabhängig vom Unternehmenssitz.',
    details: 'Auch US-amerikanische oder asiatische KI-Anbieter fallen unter die DSGVO, wenn sie ihren Dienst gezielt auf dem EU-Markt anbieten. Das Marktortprinzip bedeutet: Der Sitz des Unternehmens ist irrelevant, entscheidend ist, ob die Verarbeitung auf Personen in der EU abzielt.',
    example: 'OpenAI sitzt in den USA — DSGVO gilt trotzdem, weil OpenAI seinen Dienst gezielt auf dem EU-Markt anbietet.',
  },
  {
    id: 'art6',
    tag: 'Art. 6 + §26 BDSG',
    title: 'Rechtsgrundlage für Mitarbeiterdaten',
    summary: 'Jede Datenverarbeitung braucht eine Rechtsgrundlage. Für Mitarbeiterdaten gilt §26 BDSG: Verarbeitung nur wenn für das Arbeitsverhältnis erforderlich — nicht nur nützlich.',
    details: 'Drei relevante Grundlagen: Art. 6 Abs. 1 lit. b (Vertragserfüllung) — Projektzuweisung ist Teil des Arbeitsverhältnisses. Art. 6 lit. c (Rechtliche Verpflichtung) — z.B. Dokumentation nach ArbZG. §26 BDSG (Beschäftigtendaten) — Der entscheidende Maßstab: "erforderlich", nicht "nützlich".',
    warning: 'Achtung: "Das System könnte nützlich sein" reicht nicht. Es muss für die Durchführung des Beschäftigungsverhältnisses tatsächlich erforderlich sein.',
  },
  {
    id: 'art22',
    tag: 'Art. 22',
    title: 'Automatisierte Entscheidungen — Mensch muss tatsächlich entscheiden',
    summary: '„Kein Mensch darf einer ausschließlich automatisierten Entscheidung unterworfen werden, die ihm gegenüber rechtliche Wirkung entfaltet oder ihn erheblich beeinträchtigt."',
    details: 'Das KI-System darf empfehlen — aber der Mensch muss die Entscheidung tatsächlich treffen, nicht nur formal "nicken". EuGH C-634/21 (SCHUFA-Urteil): Auch wenn formal ein Mensch entscheidet, greift Art. 22, wenn ein Score die Entscheidung maßgeblich vorprägt.',
    warning: 'Human-in-the-Loop reicht nicht, wenn der Mensch die Entscheidung des Systems nur "pro forma" übernimmt. Der Mensch muss maßgeblich entscheiden.',
    example: 'KI schlägt Projektzuweisung vor — der zuständige Manager muss die Eignung tatsächlich beurteilen, nicht nur bestätigen.',
  },
  {
    id: 'art28',
    tag: 'Art. 28',
    title: 'Kein AVV = Rechtswidrige Verarbeitung',
    summary: 'Wenn ein KI-System auf Servern eines externen Anbieters läuft und dabei personenbezogene Daten verarbeitet, ist ohne AVV die gesamte Verarbeitung rechtswidrig.',
    details: 'Auch bei namhaften Anbietern (Microsoft, Google, OpenAI) und auch wenn der Anbieter die Daten "nur speichert". Ein AVV verschiebt keine regulatorische Verantwortung — er ist deren Voraussetzung. Der Betreiber bleibt immer verantwortlich.',
    warning: '"Wir nutzen einen bekannten Cloud-Dienst — der Anbieter ist verantwortlich." — Falsch. Der Betreiber ist für die Verarbeitung verantwortlich.',
    example: 'Externer Anbieter + AVV vorhanden = Rechtmäßig. Externer Anbieter + kein AVV = Rechtswidrig. Namhafter Anbieter + kein AVV = Trotzdem rechtswidrig.',
  },
  {
    id: 'art35',
    tag: 'Art. 35',
    title: 'DSFA — Erst prüfen, dann starten',
    summary: 'Datenschutz-Folgenabschätzung ist Pflicht, wenn die Verarbeitung voraussichtlich ein hohes Risiko für die Rechte und Freiheiten natürlicher Personen hat.',
    details: 'Die DSFA muss VOR dem Einsatz erfolgen — eine nachträgliche DSFA erfüllt ihren Zweck nicht. Auslöser: Mitarbeiterdaten werden systematisch verarbeitet, KI-gestütztes Profiling von Personen findet statt, oder das System wird neu eingesetzt (nicht nur geringfügig angepasst).',
    example: 'Mögliche Ansatzpunkte: Mitarbeiterdaten-Verarbeitung · KI-Profiling · Neuer Systemeinsatz.',
  },
  {
    id: 'par87',
    tag: '§87 BetrVG',
    title: 'Mitbestimmung bei KI in der Personalplanung',
    summary: 'KI-Systeme, die Verhalten oder Leistung von Mitarbeitenden überwachen können, sind mitbestimmungspflichtig — unabhängig von der DSGVO.',
    details: 'Wenn ein Betriebsrat vorhanden ist: "Einführung und Anwendung von technischen Einrichtungen, die dazu bestimmt sind, das Verhalten oder die Leistung der Arbeitnehmer zu überwachen" — Zustimmungspflicht vor Einsatz. Das gilt parallel zur DSGVO als eigenständiges Arbeitsrecht.',
    warning: 'DSGVO-Konformität allein reicht nicht. Selbst wenn die DSGVO-Anforderungen erfüllt sind, braucht es die Zustimmung des Betriebsrats.',
  },
]

const DSFA_TRIGGERS = [
  { id: 'employees', label: 'Mitarbeiterdaten werden systematisch verarbeitet', risk: true },
  { id: 'profiling', label: 'KI-gestütztes Profiling von Personen findet statt', risk: true },
  { id: 'new', label: 'Das System wird neu eingesetzt (kein geringfügiges Update)', risk: true },
  { id: 'decisions', label: 'Das System trifft oder beeinflusst erhebliche Entscheidungen über Personen', risk: true },
  { id: 'sensitive', label: 'Es werden besondere Kategorien (Gesundheit, Herkunft etc.) verarbeitet', risk: true },
]

const DREISTUFENMODELL = [
  {
    stufe: 1 as Stufe,
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    title: 'KI-Beauftragter entscheidet selbst',
    merkmal: 'Reversibel · klare Quellen · kein Personenschaden',
    tasks: [
      { title: 'Risikoklasse einordnen', desc: 'Offizielle Ressourcen (Bundesnetzagentur, EU-Checklisten) nutzen.' },
      { title: 'AVV-Pflicht prüfen', desc: 'Externe Verarbeitung + personenbezogene Daten = AVV nötig. Einordnung ist klar und selbst vorzunehmen.' },
      { title: 'Art. 50 EU AI Act prüfen', desc: 'Kennzeichnungspflicht für Chatbots — klar geregelt, keine juristische Grauzone.' },
      { title: 'KI-Systeme inventarisieren', desc: 'Systeme erfassen, klassifizieren und dokumentieren — Kernaufgabe des KI-Beauftragten.' },
    ],
  },
  {
    stufe: 2 as Stufe,
    color: 'bg-amber-400',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    title: 'KI-Beauftragter flaggt, DSB/Anwalt entscheidet',
    merkmal: 'Rechtliche Grauzone · erhebliche Konsequenzen',
    tasks: [
      { title: 'Rollenklärung Anbieter/Betreiber', desc: 'Bei Eigenentwicklung oder Anpassung — wer ist rechtlich verantwortlich?' },
      { title: 'Hochrisiko-Grenzfall', desc: 'Einordnung unklar — Anhang-III-Tatbestand möglicherweise erfüllt.' },
      { title: 'Urheberrecht KI-Inhalte', desc: 'Bei kommerzieller Nutzung KI-generierter Inhalte.' },
      { title: 'AVV-Inhalte verhandeln', desc: 'Ob ein AVV nötig ist: Stufe 1. Was konkret darin steht: Stufe 2.' },
    ],
  },
  {
    stufe: 3 as Stufe,
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Immer DSB/Anwalt — ohne Ausnahme',
    merkmal: 'Irreversibel · Personenbezogene Konsequenz · Unklare Verantwortung',
    tasks: [
      { title: 'Art. 22 — Automatisierte Einzelentscheidungen', desc: 'Rechtliche Wirkung · erhebliche Beeinträchtigung · kein Spielraum für Selbstentscheidung.' },
      { title: 'Drittlandtransfer ohne Rechtsgrundlage', desc: 'Transfer personenbezogener Daten in Drittstaaten ohne gültige Grundlage.' },
      { title: 'KI im HR-Kontext', desc: 'Bewerbungsscreening · Kündigung · Leistungsbewertung.' },
      { title: 'Behördliche Anfragen', desc: 'Von Bundesnetzagentur oder Datenschutzaufsicht — nicht selbst beantworten.' },
    ],
  },
]

const DSGVO_GRUNDSAETZE = [
  { art: 'Art. 5 lit. a', name: 'Rechtmäßigkeit, Verarbeitung nach Treu und Glauben, Transparenz', short: 'Rechtmäßigkeit', desc: 'Es muss eine Rechtsgrundlage geben (Art. 6). Die Verarbeitung darf die betroffene Person nicht täuschen oder überraschen.' },
  { art: 'Art. 5 lit. b', name: 'Zweckbindung', short: 'Zweckbindung', desc: 'Daten dürfen nur für den festgelegten, eindeutigen und legitimen Zweck erhoben und verarbeitet werden. Keine "Vorratsdatenhaltung".' },
  { art: 'Art. 5 lit. c', name: 'Datenminimierung', short: 'Datenminimierung', desc: 'Nur die Daten verarbeiten, die für den Zweck tatsächlich erforderlich sind — nicht alle, die nützlich sein könnten.' },
  { art: 'Art. 5 lit. d', name: 'Richtigkeit', short: 'Richtigkeit', desc: 'Daten müssen sachlich richtig und aktuell sein. Unrichtige Daten sind zu berichtigen oder zu löschen (→ Betroffenenrechte Art. 16).' },
  { art: 'Art. 5 lit. e', name: 'Speicherbegrenzung', short: 'Speicherbegrenzung', desc: 'Daten dürfen nur so lange gespeichert werden, wie es für den Zweck erforderlich ist. Danach: Löschen oder Anonymisieren.' },
  { art: 'Art. 5 lit. f', name: 'Integrität und Vertraulichkeit', short: 'Integrität', desc: 'Angemessene technische und organisatorische Maßnahmen (TOMs) zum Schutz vor unbefugtem Zugriff, Verlust oder Zerstörung (→ Art. 32).' },
  { art: 'Art. 5 Abs. 2', name: 'Rechenschaftspflicht', short: 'Rechenschaft', desc: 'Der Verantwortliche muss die Einhaltung aller Grundsätze nachweisen können — nicht nur einhalten, sondern dokumentieren.', highlight: true },
]

const BIAS_TYPES = [
  { type: 'Historical Bias', icon: '📜', desc: 'Die Trainingsdaten spiegeln vergangene Diskriminierung wider. Das Modell lernt und reproduziert diese Muster. Beispiel: Einstellungsdaten, bei denen Frauen historisch unterrepräsentiert waren, führen zu KI-Systemen, die Männer bevorzugen.', color: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-700' },
  { type: 'Representation Bias', icon: '📊', desc: 'Bestimmte Gruppen sind in den Trainingsdaten unter- oder überrepräsentiert. Das Modell funktioniert für diese Gruppen schlechter. Beispiel: Gesichtserkennung, die bei dunklen Hauttönen mehr Fehler macht, weil Trainingsdaten überproportional helle Hauttöne enthalten.', color: 'border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  { type: 'Measurement Bias', icon: '📏', desc: 'Die gewählten Messgrößen oder Labels selbst sind verzerrt. Beispiel: "Kreditwürdigkeit" gemessen an historischen Zahlungsverhalten, das selbst durch ungleichen Zugang zu Finanzprodukten geprägt ist.', color: 'border-violet-200 bg-violet-50', badge: 'bg-violet-100 text-violet-700' },
]

// ── Sub-components ─────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: Article }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="flex-shrink-0 mt-0.5 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded whitespace-nowrap">
          {article.tag}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{article.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{article.summary}</p>
        </div>
        <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">{article.details}</p>
          {article.example && (
            <div className="bg-blue-50 border-l-4 border-blue-400 px-4 py-3 rounded-r-lg">
              <p className="text-xs text-blue-700 leading-relaxed"><span className="font-semibold">Beispiel:</span> {article.example}</p>
            </div>
          )}
          {article.warning && (
            <div className="bg-amber-50 border-l-4 border-amber-400 px-4 py-3 rounded-r-lg">
              <p className="text-xs text-amber-700 leading-relaxed"><span className="font-semibold">Achtung:</span> {article.warning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DsfaChecker() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  const triggersActive = DSFA_TRIGGERS.filter((t) => checked[t.id]).length
  const required = triggersActive >= 1

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">DSFA-Trigger-Check (Art. 35)</p>
            <p className="text-xs text-slate-500">Prüfe ob eine Datenschutz-Folgenabschätzung erforderlich ist</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        {DSFA_TRIGGERS.map((trigger) => (
          <label key={trigger.id} className="flex items-start gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
              checked[trigger.id] ? 'bg-purple-600 border-purple-600' : 'border-slate-300 group-hover:border-purple-400'
            }`} onClick={() => toggle(trigger.id)}>
              {checked[trigger.id] && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <span className="text-sm text-slate-700 leading-relaxed" onClick={() => toggle(trigger.id)}>{trigger.label}</span>
          </label>
        ))}
      </div>
      {triggersActive > 0 && (
        <div className={`mx-5 mb-5 px-4 py-3 rounded-lg ${required ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <p className={`text-sm font-semibold ${required ? 'text-red-700' : 'text-green-700'}`}>
            {required ? '⚠ DSFA erforderlich' : '✓ DSFA wahrscheinlich nicht erforderlich'}
          </p>
          <p className={`text-xs mt-1 leading-relaxed ${required ? 'text-red-600' : 'text-green-600'}`}>
            {required
              ? `${triggersActive} Auslöser aktiv. Die DSFA muss VOR dem Systemeinsatz durchgeführt werden. Einbeziehung des DSB empfohlen (Dreistufenmodell Stufe 2).`
              : 'Kein Auslöser aktiv. Beachte: Eine DSFA kann auch bei nicht aufgelisteten Szenarien erforderlich sein.'}
          </p>
        </div>
      )}
    </div>
  )
}

function AvvChecker() {
  const [external, setExternal] = useState<boolean | null>(null)
  const [personalData, setPersonalData] = useState<boolean | null>(null)
  const [avvExists, setAvvExists] = useState<boolean | null>(null)

  const showAvvQuestion = external === true && personalData === true
  const result = showAvvQuestion && avvExists !== null
    ? avvExists
      ? { ok: true, text: 'Rechtmäßig. AVV vorhanden — Voraussetzung für die Verarbeitung ist erfüllt.' }
      : { ok: false, text: 'Rechtswidrig. Ohne AVV ist die gesamte Verarbeitung rechtswidrig — auch bei namhaften Anbietern.' }
    : external === false || personalData === false
      ? { ok: true, text: external === false ? 'Kein externer Anbieter — kein AVV erforderlich.' : 'Keine personenbezogenen Daten — kein AVV erforderlich.' }
      : null

  const reset = () => { setExternal(null); setPersonalData(null); setAvvExists(null) }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">AVV-Pflicht-Check (Art. 28)</p>
            <p className="text-xs text-slate-500">Prüfe ob ein Auftragsverarbeitungsvertrag erforderlich ist</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        {/* Q1 */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Läuft das KI-System auf Servern eines externen Anbieters?</p>
          <div className="flex gap-2">
            {([true, false] as const).map((v) => (
              <button key={String(v)} onClick={() => { setExternal(v); setPersonalData(null); setAvvExists(null) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${external === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                {v ? 'Ja' : 'Nein'}
              </button>
            ))}
          </div>
        </div>

        {/* Q2 */}
        {external === true && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Werden dabei personenbezogene Daten verarbeitet?</p>
            <div className="flex gap-2">
              {([true, false] as const).map((v) => (
                <button key={String(v)} onClick={() => { setPersonalData(v); setAvvExists(null) }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${personalData === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                  {v ? 'Ja' : 'Nein'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q3 */}
        {showAvvQuestion && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Ist ein AVV mit dem Anbieter vorhanden?</p>
            <div className="flex gap-2">
              {([true, false] as const).map((v) => (
                <button key={String(v)} onClick={() => setAvvExists(v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${avvExists === v ? 'bg-indind-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                  {v ? 'Ja' : 'Nein'}
                </button>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className={`px-4 py-3 rounded-lg ${result.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm font-semibold ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
              {result.ok ? '✓' : '✗'} {result.text}
            </p>
            {!result.ok && (
              <p className="text-xs text-red-600 mt-1">→ AVV umgehend mit dem Anbieter abschließen oder System offline nehmen bis AVV vorliegt.</p>
            )}
            <button onClick={reset} className="mt-2 text-xs text-slate-500 underline hover:text-slate-700">Neu prüfen</button>
          </div>
        )}
      </div>
    </div>
  )
}

const ART22_CHECKS = [
  'Der Mensch erhält alle relevanten Informationen — nicht nur das KI-Ergebnis',
  'Der Mensch kann die Empfehlung der KI tatsächlich überstimmen (kein sozialer/technischer Druck)',
  'Die Entscheidung des Menschen wird dokumentiert — nicht nur das KI-Ergebnis',
  'Es gibt Fälle, in denen Menschen tatsächlich abweichend von der KI entschieden haben',
  'Die Zeit für die menschliche Prüfung ist ausreichend — kein "Fließband-Nicken"',
]

function Art22Checker() {
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  const toggle = (i: number) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))
  const passed = ART22_CHECKS.filter((_, i) => checked[i]).length
  const all = ART22_CHECKS.length

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">Art. 22 — Human-in-the-Loop-Qualität</p>
              <p className="text-xs text-slate-500">EuGH C-634/21: Formale Kontrolle reicht nicht — der Mensch muss tatsächlich entscheiden</p>
            </div>
          </div>
          {passed > 0 && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
              passed === all ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {passed}/{all}
            </span>
          )}
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Prüfe ob dein Human-in-the-Loop-Prozess der Art. 22-Anforderung genügt:
        </p>
        <div className="space-y-1">
          {ART22_CHECKS.map((check, i) => (
            <label key={i} onClick={() => toggle(i)}
              className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0 cursor-pointer group hover:bg-slate-50 -mx-5 px-5 rounded transition-colors">
              <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                checked[i] ? 'bg-rose-600 border-rose-600' : 'border-slate-300 group-hover:border-rose-400'
              }`}>
                {checked[i] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <p className={`text-xs leading-relaxed transition-colors ${checked[i] ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {check}
              </p>
            </label>
          ))}
        </div>
        {passed === all && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-green-700">✓ Alle Punkte erfüllt — Human-in-the-Loop-Prozess sieht gut aus</p>
          </div>
        )}
        {passed > 0 && passed < all && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-amber-700">⚠ {all - passed} Punkt{all - passed > 1 ? 'e' : ''} noch offen — Prozess überprüfen</p>
          </div>
        )}
        <p className="text-[10px] text-slate-400 mt-4">Diese Checkliste dient der Orientierung. Bei tatsächlichen Art. 22-Sachverhalten: Dreistufenmodell Stufe 3 → DSB/Anwalt.</p>
      </div>
    </div>
  )
}

function DreistufenmodellSection() {
  const [activeStufe, setActiveStufe] = useState<Stufe>(null)

  return (
    <div className="space-y-4">
      {/* Overview table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Dreistufenmodell — Wer entscheidet was?</p>
          <p className="text-xs text-slate-500 mt-0.5">Klicke auf eine Stufe für Details</p>
        </div>
        <div className="divide-y divide-slate-50">
          {DREISTUFENMODELL.map((s) => (
            <button key={s.stufe} onClick={() => setActiveStufe(activeStufe === s.stufe ? null : s.stufe)}
              className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left ${activeStufe === s.stufe ? 'bg-slate-50' : ''}`}>
              <span className={`w-7 h-7 rounded-full ${s.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {s.stufe}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.merkmal}</p>
              </div>
              <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${activeStufe === s.stufe ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {activeStufe !== null && (() => {
        const s = DREISTUFENMODELL.find((x) => x.stufe === activeStufe)!
        return (
          <div className={`rounded-xl border ${s.borderColor} ${s.bgColor} overflow-hidden`}>
            <div className="px-5 py-4 border-b border-slate-100/50">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full ${s.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{s.stufe}</span>
                <p className={`text-sm font-semibold ${s.textColor}`}>{s.title}</p>
              </div>
            </div>
            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {s.tasks.map((task) => (
                <div key={task.title} className="bg-white rounded-lg px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold text-slate-700 mb-1">{task.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{task.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DsgvoPage() {
  const [activeTab, setActiveTab] = useState<'articles' | 'tools' | 'dreistufen'>('articles')

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'articles', label: 'Artikel-Referenz' },
    { id: 'tools', label: 'Compliance-Checks' },
    { id: 'dreistufen', label: 'Dreistufenmodell' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">DSGVO & Datenschutz</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Rechtliche Grundlagen für den KI-Einsatz — Artikel-Referenz, Compliance-Checks und Entscheidungsmodell
        </p>
      </div>

      {/* Key metrics bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Relevante Artikel', value: '6', sub: 'Art. 3 · 6 · 22 · 28 · 35 + §87 BetrVG' },
          { label: 'Dreistufenmodell', value: '3', sub: '3 Stufen zur Entscheidungsverantwortung' },
          { label: 'Kerngrundsatz', value: 'AVV', sub: 'Kein AVV = rechtswidrige Verarbeitung' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-2xl font-bold text-slate-800">{m.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{m.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Articles */}
      {activeTab === 'articles' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">DSGVO-Struktur:</span> Grundsätze (Art. 1–7) → Rechte (Art. 12–23) → Pflichten (Art. 24–43) → Sanktionen (Art. 77–84). Wer die Struktur kennt, findet jeden Artikel.
            </p>
          </div>

          {/* 7 Grundsätze Art. 5 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Art. 5 — Die 7 Datenschutz-Grundsätze</p>
              <p className="text-xs text-slate-500 mt-0.5">Das Fundament der DSGVO — jede Verarbeitung personenbezogener Daten muss alle 7 Grundsätze einhalten</p>
            </div>
            <div className="divide-y divide-slate-50">
              {DSGVO_GRUNDSAETZE.map((g, i) => (
                <div key={g.art} className={`flex items-start gap-4 px-5 py-3 ${g.highlight ? 'bg-violet-50' : ''}`}>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${g.highlight ? 'bg-violet-600' : 'bg-blue-500'}`}>{i + 1}</span>
                    <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap">{g.art}</span>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold mb-0.5 ${g.highlight ? 'text-violet-700' : 'text-slate-700'}`}>{g.short}</p>
                    <p className="text-[10px] text-slate-400 mb-0.5 font-medium">{g.name}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {ARTICLES.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}

          {/* Bias-Typen */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">KI-Bias — 3 Typen, die die DSGVO berühren</p>
              <p className="text-xs text-slate-500 mt-0.5">Verzerrungen in KI-Systemen sind nicht nur ein technisches Problem — sie verstoßen oft gegen Art. 5 lit. d (Richtigkeit) und Art. 22 DSGVO</p>
            </div>
            <div className="divide-y divide-slate-100">
              {BIAS_TYPES.map((b) => (
                <div key={b.type} className={`px-5 py-4 border-l-4 ${b.color}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{b.icon}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${b.badge}`}>{b.type}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tools */}
      {activeTab === 'tools' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Interaktive Checks für häufige Compliance-Fragen — kein Ersatz für rechtliche Beratung.</p>
          <DsfaChecker />
          <AvvChecker />

          <Art22Checker />
        </div>
      )}

      {/* Tab: Dreistufenmodell */}
      {activeTab === 'dreistufen' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Das <span className="font-semibold">Dreistufenmodell</span> beantwortet: Wer entscheidet was — und wann ist ein DSB oder Anwalt nötig? Der KI-Beauftragte ist nicht Alleinentscheider. Stufe 1 = selbst entscheiden, Stufe 2 = flaggen, Stufe 3 = immer eskalieren.
            </p>
          </div>
          <DreistufenmodellSection />
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-600">Hinweis:</span> Alle Inhalte dienen der Orientierung und ersetzen keine Rechtsberatung. Bei konkreten Rechtsfragen: Datenschutzbeauftragter (DSB) oder Fachanwalt für Datenschutzrecht — gemäß Dreistufenmodell Stufe 2/3.
        </p>
      </div>
    </div>
  )
}
