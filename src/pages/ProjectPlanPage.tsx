import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useUseCasesStore } from '../store/useCasesStore'

// ── Types ──────────────────────────────────────────────────────────────────

type RiskLevel = 'high' | 'limited' | 'minimal' | null
type Step = 'form' | 'questions' | 'plan'

interface FormData {
  name: string
  description: string
}

interface Answers {
  riskLevel: RiskLevel
  personalData: boolean | null
  hrContext: boolean | null
  externalProvider: boolean | null
  worksCouncil: boolean | null
  commercialOutput: boolean | null
}

interface TodoItem {
  id: string
  text: string
  law?: string
  priority?: 'high' | 'medium'
  done: boolean
}

interface Phase {
  id: string
  title: string
  subtitle: string
  color: string
  bg: string
  border: string
  text: string
  items: TodoItem[]
}

// ── Plan Generator ─────────────────────────────────────────────────────────

function generatePlan(form: FormData, answers: Answers): Phase[] {
  const { riskLevel, personalData, hrContext, externalProvider, worksCouncil, commercialOutput } = answers
  const isHighRisk = riskLevel === 'high'
  const isLimited = riskLevel === 'limited'

  const phase1: TodoItem[] = [
    { id: 'p1_risk', text: `Risikoklasse nach EU AI Act formal einordnen (Art. 6 + Anhang III)`, law: 'EU AI Act Art. 6', priority: 'high' as const, done: false },
    { id: 'p1_role', text: 'Rolle klären: Sind wir Anbieter oder Betreiber? (Art. 3 Nr. 3/4 EU AI Act)', law: 'Art. 3 EU AI Act', priority: 'high' as const, done: false },
    ...(personalData ? [
      { id: 'p1_rechtsgrundlage', text: 'Rechtsgrundlage für Datenverarbeitung prüfen (Art. 6 DSGVO / §26 BDSG)', law: 'Art. 6 DSGVO', priority: 'high' as const, done: false },
      { id: 'p1_dsfa', text: 'DSFA-Pflicht prüfen (Art. 35 DSGVO) — bei systematischer Verarbeitung oder Profiling', law: 'Art. 35 DSGVO', priority: 'high' as const, done: false },
    ] : []),
    ...(isHighRisk ? [
      { id: 'p1_fria', text: 'FRIA (Grundrechte-Folgenabschätzung Art. 27) prüfen und ggf. anstoßen', law: 'Art. 27 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p1_konformitaet', text: 'Konformitätsbewertung vorbereiten (Anhang VI / Art. 43)', law: 'Art. 43 EU AI Act', priority: 'high' as const, done: false },
    ] : []),
    ...(isLimited ? [
      { id: 'p1_art50', text: 'Transparenzpflicht nach Art. 50 prüfen — KI muss sich als KI kennzeichnen', law: 'Art. 50 EU AI Act', priority: 'high' as const, done: false },
    ] : []),
    ...(hrContext ? [
      { id: 'p1_art22', text: 'Art. 22 DSGVO prüfen — automatisierte Entscheidung mit erheblicher Wirkung?', law: 'Art. 22 DSGVO', priority: 'high' as const, done: false },
      { id: 'p1_betrvg', text: '§87 BetrVG: Mitbestimmungspflicht klären — Betriebsrat vor Einführung einbinden', law: '§87 BetrVG', priority: 'high' as const, done: false },
    ] : []),
    ...(worksCouncil && !hrContext ? [
      { id: 'p1_betrvg_gen', text: 'Betriebsrat informieren — prüfen ob Mitbestimmungsrecht besteht (§87 BetrVG)', law: '§87 BetrVG', done: false },
    ] : []),
    { id: 'p1_dreistufen', text: 'Offene Rechtsfragen identifizieren und nach Dreistufenmodell eskalieren (DSB/Anwalt)', done: false },
  ]

  const phase2: TodoItem[] = [
    ...(externalProvider ? [
      { id: 'p2_avv', text: 'AVV mit KI-Anbieter abschließen (Art. 28 DSGVO) — falls personenbezogene Daten verarbeitet werden', law: 'Art. 28 DSGVO', priority: 'high' as const, done: false },
      { id: 'p2_vertrag', text: 'Vertrag auf KI-Act-Klauseln prüfen: Anbieter-Pflichten, Haftung, technische Dokumentation', done: false },
      { id: 'p2_drittland', text: 'Drittlandtransfer prüfen — Serverstandort klären, ggf. SCCs oder DPF nötig', law: 'Art. 46 DSGVO', done: false },
    ] : []),
    ...(isHighRisk ? [
      { id: 'p2_doku', text: 'Technische Dokumentation nach Anhang IV erstellen (bei Hochrisiko-KI Pflicht)', law: 'Anhang IV EU AI Act', priority: 'high' as const, done: false },
      { id: 'p2_logs', text: 'Logging-Infrastruktur einrichten — automatische Protokollierung gemäß Art. 12', law: 'Art. 12 EU AI Act', done: false },
      { id: 'p2_aufsicht', text: 'Menschliche Aufsicht konzipieren — wer überwacht, wie oft, wie wird eingegriffen? (Art. 14)', law: 'Art. 14 EU AI Act', priority: 'high' as const, done: false },
    ] : []),
    { id: 'p2_schulung', text: `Schulung für alle Nutzer planen — KI-Kompetenz nach Art. 4 EU AI Act nachweisen`, law: 'Art. 4 EU AI Act', priority: 'high' as const, done: false },
    { id: 'p2_zustaendig', text: 'Zuständige Person für KI-Aufsicht benennen und schulen (Art. 26 Abs. 2)', law: 'Art. 26 EU AI Act', done: false },
    { id: 'p2_register', text: 'KI-System ins interne KI-Register aufnehmen', done: false },
    ...(personalData ? [
      { id: 'p2_verzeichnis', text: 'Verzeichnis der Verarbeitungstätigkeiten (VVT) aktualisieren (Art. 30 DSGVO)', law: 'Art. 30 DSGVO', done: false },
    ] : []),
  ]

  const phase3: TodoItem[] = [
    { id: 'p3_scope', text: 'Pilotscope definieren — welche Nutzer, welche Daten, welche Zeitraum', done: false },
    { id: 'p3_monitoring', text: 'Monitoring-Prozess aufsetzen: Wer prüft Outputs wie häufig?', priority: 'medium' as const, done: false },
    ...(isHighRisk ? [
      { id: 'p3_inputdaten', text: 'Inputdaten auf Relevanz und Repräsentativität prüfen (Art. 26 Abs. 4)', law: 'Art. 26 EU AI Act', done: false },
      { id: 'p3_bias', text: 'Bias-Prüfung: Werden Gruppen systematisch benachteiligt? (Historical / Representation / Measurement Bias)', priority: 'high' as const, done: false },
    ] : []),
    { id: 'p3_feedback', text: 'Feedback-Kanal für Nutzer einrichten — Meldung von Fehlern und Auffälligkeiten', done: false },
    { id: 'p3_vorfall', text: 'Vorfallsprotokoll anlegen — was wird wie dokumentiert bei schwerwiegenden Fehlern?', done: false },
    ...(commercialOutput ? [
      { id: 'p3_urhg', text: 'Urheberrecht klären: KI-generierte Inhalte kennzeichnen, Schutzfähigkeit prüfen (§2 UrhG, §44b UrhG)', law: '§44b UrhG', done: false },
    ] : []),
  ]

  const phase4: TodoItem[] = [
    { id: 'p4_schulung_abschluss', text: 'Schulungen abschließen und Teilnahme für Art. 4-Nachweis dokumentieren', law: 'Art. 4 EU AI Act', priority: 'high' as const, done: false },
    ...(isHighRisk ? [
      { id: 'p4_ce', text: 'CE-Kennzeichnung sicherstellen (bei Hochrisiko-KI Pflicht vor Inverkehrbringen)', law: 'Art. 48 EU AI Act', priority: 'high' as const, done: false },
      { id: 'p4_eu_db', text: 'Registrierung in der EU-Datenbank für Hochrisiko-KI (Art. 49)', law: 'Art. 49 EU AI Act', done: false },
    ] : []),
    { id: 'p4_logs_check', text: 'Logs regelmäßig prüfen — mind. alle 3 Monate', done: false },
    { id: 'p4_reporting', text: 'Reporting-Rhythmus mit Geschäftsführung festlegen (Quartalsreport KI-Governance)', done: false },
    { id: 'p4_update', text: 'Prozess für KI-System-Updates definieren — wann ist eine Neuprüfung nötig?', done: false },
    ...(worksCouncil ? [
      { id: 'p4_br_update', text: 'Betriebsrat über Rollout informieren — laufende Mitbestimmung sicherstellen', law: '§87 BetrVG', done: false },
    ] : []),
    { id: 'p4_review', text: `Jahresreview einplanen: Use Case "${form.name}" — noch aktuell, noch konform?`, done: false },
  ]

  return [
    {
      id: 'phase1',
      title: 'Phase 1 — Rechtliche & Compliance-Prüfung',
      subtitle: 'Vor dem Start: Einordnung, Pflichten klären, Eskalationen anstoßen',
      color: 'bg-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700',
      items: phase1,
    },
    {
      id: 'phase2',
      title: 'Phase 2 — Technische & Organisatorische Vorbereitung',
      subtitle: 'Verträge, Dokumentation, Schulungen, Register — bevor der Pilot startet',
      color: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
      items: phase2,
    },
    {
      id: 'phase3',
      title: 'Phase 3 — Pilotbetrieb',
      subtitle: 'Kontrollierter Einsatz mit Monitoring, Feedback und Fehlerdokumentation',
      color: 'bg-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700',
      items: phase3,
    },
    {
      id: 'phase4',
      title: 'Phase 4 — Rollout & laufender Betrieb',
      subtitle: 'Vollbetrieb, Nachweise sichern, Governance im Regelbetrieb verankern',
      color: 'bg-green-600', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700',
      items: phase4,
    },
  ]
}

// ── Components ─────────────────────────────────────────────────────────────

function QuestionCard({
  question, sub, yes, no, onAnswer,
}: {
  question: string; sub?: string; yes: string; no: string; onAnswer: (val: boolean) => void
}) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-800 leading-snug">{question}</p>
        {sub && <p className="text-xs text-blue-600 mt-1">{sub}</p>}
      </div>
      <div className="flex gap-3">
        <button onClick={() => onAnswer(true)}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors">
          {yes}
        </button>
        <button onClick={() => onAnswer(false)}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
          {no}
        </button>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

function euAiActRiskToLevel(risk?: string): RiskLevel {
  if (risk === 'High Risk' || risk === 'Unacceptable Risk') return 'high'
  if (risk === 'Limited Risk') return 'limited'
  if (risk === 'Minimal Risk') return 'minimal'
  return null
}

export default function ProjectPlanPage() {
  const [searchParams] = useSearchParams()
  const { useCases } = useUseCasesStore()
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState<FormData>({ name: '', description: '' })
  const [answers, setAnswers] = useState<Answers>({
    riskLevel: null,
    personalData: null,
    hrContext: null,
    externalProvider: null,
    worksCouncil: null,
    commercialOutput: null,
  })
  const [qIndex, setQIndex] = useState(0)
  const [plan, setPlan] = useState<Phase[] | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  // Pre-fill from URL param ?ucid=<id>
  useEffect(() => {
    const ucid = searchParams.get('ucid')
    if (!ucid) return
    const uc = useCases.find((u) => u.id === ucid)
    if (!uc) return
    setForm({ name: uc.title, description: uc.businessProblem ?? '' })
    setAnswers((prev) => ({
      ...prev,
      riskLevel: euAiActRiskToLevel(uc.euAiActRisk),
      personalData: uc.compliancePersonalData ?? null,
    }))
    setStep('questions')
  }, [searchParams, useCases])

  const totalItems = plan?.reduce((sum, p) => sum + p.items.length, 0) ?? 0
  const doneCount = Object.values(checked).filter(Boolean).length
  const progress = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0

  const toggleItem = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))

  const startQuestions = () => {
    if (!form.name.trim()) return
    setQIndex(0)
    setStep('questions')
  }

  const answerRisk = (level: RiskLevel) => {
    setAnswers((a) => ({ ...a, riskLevel: level }))
    setQIndex(1)
  }

  const answerBool = (key: keyof Answers, val: boolean) => {
    const next = { ...answers, [key]: val }
    setAnswers(next)
    if (qIndex < 5) {
      setQIndex(qIndex + 1)
    } else {
      const generated = generatePlan(form, next)
      setPlan(generated)
      setChecked({})
      setStep('plan')
    }
  }

  const reset = () => {
    setStep('form')
    setForm({ name: '', description: '' })
    setAnswers({ riskLevel: null, personalData: null, hrContext: null, externalProvider: null, worksCouncil: null, commercialOutput: null })
    setQIndex(0)
    setPlan(null)
    setChecked({})
  }

  const goBack = () => {
    if (step === 'plan') {
      setStep('questions')
      setQIndex(5)
    } else if (step === 'questions') {
      if (qIndex === 0) {
        setStep('form')
      } else {
        setQIndex(qIndex - 1)
      }
    }
  }

  const boolQuestions: { key: keyof Answers; q: string; sub?: string; yes: string; no: string }[] = [
    {
      key: 'personalData',
      q: 'Werden personenbezogene Daten verarbeitet?',
      sub: 'Namen, E-Mails, Mitarbeiterdaten, Kundenprofile, IP-Adressen — alles was einer Person zugeordnet werden kann.',
      yes: 'Ja, personenbezogene Daten', no: 'Nein, nur anonyme Daten',
    },
    {
      key: 'hrContext',
      q: 'Wird das System im HR-Kontext eingesetzt?',
      sub: 'Bewerbungsscreening, Leistungsbewertung, Kündigung, Monitoring von Mitarbeitenden.',
      yes: 'Ja, HR-Kontext', no: 'Nein',
    },
    {
      key: 'externalProvider',
      q: 'Kommt das KI-System von einem externen Anbieter?',
      sub: 'Cloud-Dienste (OpenAI, Microsoft Copilot, Google etc.) oder zugekaufte Software mit KI-Komponente.',
      yes: 'Ja, externer Anbieter', no: 'Nein, Eigenentwicklung',
    },
    {
      key: 'worksCouncil',
      q: 'Gibt es einen Betriebsrat im Unternehmen?',
      sub: '§87 BetrVG: Mitbestimmungspflicht bei technischen Überwachungseinrichtungen.',
      yes: 'Ja, Betriebsrat vorhanden', no: 'Nein',
    },
    {
      key: 'commercialOutput',
      q: 'Werden KI-generierte Inhalte kommerziell genutzt oder veröffentlicht?',
      sub: 'Texte, Bilder, Code oder andere Outputs die in Produkte oder Publikationen einfließen.',
      yes: 'Ja, Inhalte werden genutzt / veröffentlicht', no: 'Nein, nur interne Nutzung',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projektplan-Generator</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Use Case eingeben → Fragen beantworten → maßgeschneiderter Compliance-Projektplan
          </p>
        </div>
        {step !== 'form' && (
          <button onClick={reset}
            className="text-xs border border-slate-200 text-slate-500 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
            Neu starten
          </button>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-3">
        {(['form', 'questions', 'plan'] as Step[]).map((s, i) => {
          const isCompleted = (step === 'questions' && s === 'form') || (step === 'plan' && s !== 'plan')
          const isClickable = isCompleted || (step === 'plan' && s === 'questions')
          return (
            <div key={s} className="flex items-center gap-3">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (s === 'form') { setStep('form') }
                  else if (s === 'questions') { setStep('questions'); setQIndex(5) }
                }}
                className={`flex items-center gap-2 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s ? 'bg-blue-600 text-white' :
                  isCompleted ? 'bg-green-500 text-white' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {isCompleted && (s as string) !== 'plan' ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === s ? 'text-slate-800' : isCompleted ? 'text-green-600 underline-offset-2' : 'text-slate-400'}`}>
                  {s === 'form' ? 'Use Case' : s === 'questions' ? 'Fragen' : 'Projektplan'}
                </span>
              </button>
              {i < 2 && <div className={`h-px w-8 ${isCompleted ? 'bg-green-400' : 'bg-slate-200'}`} />}
            </div>
          )
        })}
      </div>

      {/* Step 1: Form */}
      {step === 'form' && (
        <div className="bg-white rounded-xl shadow-sm px-6 py-6 space-y-5 max-w-xl">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Use Case Name *</label>
            <input
              type="text"
              placeholder="z.B. KI-gestütztes Bewerbungsscreening"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Kurzbeschreibung <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
            <textarea
              placeholder="Was soll das System tun? Wer nutzt es? Welche Entscheidungen trifft es?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            onClick={startQuestions}
            disabled={!form.name.trim()}
            className="w-full py-3 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Weiter → Fragen beantworten
          </button>
        </div>
      )}

      {/* Step 2: Questions */}
      {step === 'questions' && (
        <div className="space-y-4 max-w-xl">
          <div className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-xs text-slate-500">Use Case</p>
            <p className="text-sm font-semibold text-slate-800">{form.name}</p>
          </div>

          {/* Progress dots + back */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                  i < qIndex ? 'bg-green-500' : i === qIndex ? 'bg-blue-600' : 'bg-slate-200'
                }`} />
              ))}
              <span className="text-xs text-slate-400 ml-1">Frage {qIndex + 1} von 6</span>
            </div>
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Zurück
            </button>
          </div>

          {qIndex === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Welche Risikoklasse hat das KI-System?</p>
                <p className="text-xs text-blue-600 mt-1">Falls noch unklar: EU AI Act Risikoklassen-Check verwenden.</p>
              </div>
              <div className="space-y-2">
                {[
                  { level: 'high' as RiskLevel, label: 'Hohes Risiko', sub: 'Anhang III — HR, Kredit, Medizin, Bildung, Strafverfolgung etc.', color: 'border-orange-300 bg-orange-50 hover:bg-orange-100' },
                  { level: 'limited' as RiskLevel, label: 'Begrenztes Risiko', sub: 'Chatbots, KI-generierte Inhalte — Art. 50 Transparenzpflicht', color: 'border-amber-300 bg-amber-50 hover:bg-amber-100' },
                  { level: 'minimal' as RiskLevel, label: 'Minimales Risiko', sub: 'Spam-Filter, Empfehlungssysteme, interne Tools ohne Personenbezug', color: 'border-green-300 bg-green-50 hover:bg-green-100' },
                ].map((opt) => (
                  <button key={opt.level} onClick={() => answerRisk(opt.level)}
                    className={`w-full flex items-start gap-3 px-4 py-3 border rounded-lg text-left transition-colors ${opt.color}`}>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {qIndex > 0 && qIndex <= 5 && (() => {
            const q = boolQuestions[qIndex - 1]
            return (
              <QuestionCard
                question={q.q}
                sub={q.sub}
                yes={q.yes}
                no={q.no}
                onAnswer={(val) => answerBool(q.key, val)}
              />
            )
          })()}
        </div>
      )}

      {/* Step 3: Plan */}
      {step === 'plan' && plan && (
        <div className="space-y-6">
          {/* Summary header */}
          <div className="bg-white rounded-xl shadow-sm px-5 py-4 flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Fragen bearbeiten
                </button>
              </div>
              <p className="text-xs text-slate-500">Projektplan für</p>
              <p className="text-base font-bold text-slate-800">{form.name}</p>
              {form.description && <p className="text-xs text-slate-500 mt-0.5">{form.description}</p>}
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-800">{doneCount}/{totalItems}</p>
                <p className="text-xs text-slate-500">Aufgaben erledigt</p>
              </div>
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#16a34a" strokeWidth="3"
                    strokeDasharray={`${progress * 0.942} 94.2`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: answers.riskLevel === 'high' ? 'Hohes Risiko' : answers.riskLevel === 'limited' ? 'Begrenztes Risiko' : 'Minimales Risiko', color: answers.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' : answers.riskLevel === 'limited' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700' },
              ...(answers.personalData ? [{ label: 'Personenbezogene Daten', color: 'bg-violet-100 text-violet-700' }] : []),
              ...(answers.hrContext ? [{ label: 'HR-Kontext', color: 'bg-red-100 text-red-700' }] : []),
              ...(answers.externalProvider ? [{ label: 'Externer Anbieter', color: 'bg-blue-100 text-blue-700' }] : []),
              ...(answers.worksCouncil ? [{ label: 'Betriebsrat', color: 'bg-slate-100 text-slate-700' }] : []),
              ...(answers.commercialOutput ? [{ label: 'Kommerzielle Outputs', color: 'bg-cyan-100 text-cyan-700' }] : []),
            ].map((tag) => (
              <span key={tag.label} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tag.color}`}>{tag.label}</span>
            ))}
          </div>

          {/* Phases */}
          {plan.map((phase, phaseIdx) => {
            const phaseDone = phase.items.filter((item) => checked[item.id]).length
            return (
              <div key={phase.id} className={`rounded-xl border ${phase.border} overflow-hidden`}>
                <div className={`px-5 py-4 ${phase.bg} flex items-center gap-4`}>
                  <span className={`w-9 h-9 rounded-full ${phase.color} text-white text-sm font-bold flex items-center justify-center flex-shrink-0`}>
                    {phaseIdx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${phase.text}`}>{phase.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{phase.subtitle}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-white/60 ${phase.text} flex-shrink-0`}>
                    {phaseDone}/{phase.items.length}
                  </span>
                </div>
                <div className="bg-white divide-y divide-slate-50">
                  {phase.items.map((item) => (
                    <label key={item.id} onClick={() => toggleItem(item.id)}
                      className="flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50 transition-colors group">
                      <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        checked[item.id] ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-green-400'
                      }`}>
                        {checked[item.id] && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-relaxed ${checked[item.id] ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {item.text}
                          {item.priority === 'high' && !checked[item.id] && (
                            <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 no-underline" style={{ textDecoration: 'none' }}>PRIO</span>
                          )}
                        </p>
                        {item.law && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.law}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-600">Hinweis:</span> Dieser Plan dient der Orientierung und ersetzt keine Rechtsberatung. Offene Rechtsfragen nach dem Dreistufenmodell eskalieren — DSB oder Fachanwalt einschalten.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
