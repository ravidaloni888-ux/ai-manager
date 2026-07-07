import { useState, useMemo } from 'react'
import { nanoid } from 'nanoid'
import { useAuthStore } from '../store/authStore'
import { useDemoStore } from '../store/demoStore'

// ── Types ─────────────────────────────────────────────────────────────────────

type PromptStatus = 'green' | 'yellow' | 'red'

interface Prompt {
  id: string
  title: string
  category: string
  role: string
  context: string
  task: string
  format: string
  tags: string[]
  status: PromptStatus
  submittedBy: string
  createdAt: string
  usageCount: number
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_PROMPTS: Prompt[] = [
  {
    id: 'p1', title: 'Stellenanzeige erstellen', category: 'HR',
    role: 'Du bist eine erfahrene Personalreferentin mit Fokus auf modernes Recruiting.',
    context: 'Wir suchen eine Fachkraft für unser Team. Die Stelle soll ansprechend und authentisch klingen.',
    task: 'Erstelle eine vollständige Stellenanzeige für die Position [POSITION] im Bereich [BEREICH]. Hebe die Unternehmenskultur hervor.',
    format: 'Struktur: Intro (3 Sätze), Aufgaben (5–7 Bullets), Anforderungen (5 Bullets), Benefits (3 Bullets). Ton: professionell aber menschlich. Kein Denglisch.',
    tags: ['HR', 'Recruiting', 'Texten'], status: 'green', submittedBy: 'Sandra Klein', createdAt: '2025-11-03', usageCount: 34,
  },
  {
    id: 'p2', title: 'Meeting-Protokoll zusammenfassen', category: 'Operations',
    role: 'Du bist ein präziser Business Analyst.',
    context: 'Nach einem internen Meeting liegen Notizen oder ein Transkript vor, das strukturiert werden soll.',
    task: 'Fasse das folgende Meeting-Protokoll zusammen: [PROTOKOLL EINFÜGEN]. Extrahiere alle Entscheidungen, offene Punkte und Verantwortlichkeiten.',
    format: 'Drei Abschnitte: 1) Entscheidungen (Bullets), 2) Offene Punkte mit Verantwortlichen und Deadline, 3) Nächste Schritte. Max. 1 Seite.',
    tags: ['Meetings', 'Zusammenfassung', 'Operations'], status: 'green', submittedBy: 'Marcus Schmidt', createdAt: '2025-10-15', usageCount: 61,
  },
  {
    id: 'p3', title: 'Kundenemail professionell umformulieren', category: 'Kommunikation',
    role: 'Du bist eine erfahrene Kommunikationsexpertin für B2B-Korrespondenz.',
    context: 'Eine intern verfasste E-Mail muss vor dem Versand professionalisiert werden, ohne den Kerninhalt zu verändern.',
    task: 'Formuliere diese E-Mail professionell um: [E-MAIL EINFÜGEN]. Behalte alle inhaltlichen Punkte bei.',
    format: 'Ausgabe: nur die fertige E-Mail, keine Erklärung. Anrede und Grußformel anpassen. Ton: freundlich-professionell.',
    tags: ['E-Mail', 'Kommunikation', 'Texten'], status: 'green', submittedBy: 'Emma Bauer', createdAt: '2025-09-28', usageCount: 89,
  },
  {
    id: 'p4', title: 'Risikobewertung für KI-Use-Case', category: 'Governance',
    role: 'Du bist ein KI-Governance-Experte mit Kenntnissen im EU AI Act.',
    context: 'Ein neuer KI-Use-Case soll vor der Umsetzung auf Risiken bewertet werden.',
    task: 'Bewerte folgenden KI-Use-Case auf Risiken nach dem EU AI Act: [USE CASE BESCHREIBUNG]. Klassifiziere das Risikolevel und liste konkrete Risiken auf.',
    format: 'Risikolevel (Minimal / Begrenzt / Hoch / Inakzeptabel) mit Begründung. Dann 5–7 konkrete Risiken mit Likelihood (1–5) und Impact (1–5). Abschließend 3 Mitigationsmaßnahmen.',
    tags: ['Governance', 'EU AI Act', 'Risk'], status: 'green', submittedBy: 'Dr. Maria Müller', createdAt: '2025-12-01', usageCount: 22,
  },
  {
    id: 'p5', title: 'Einarbeitungsplan für neue Mitarbeitende', category: 'HR',
    role: 'Du bist eine erfahrene Personalreferentin mit Fokus auf Onboarding.',
    context: 'Es geht um das Onboarding einer neuen Fachkraft in unser Unternehmen.',
    task: 'Erstelle einen 4-wöchigen Einarbeitungsplan für eine neue [POSITION] im Bereich [BEREICH].',
    format: 'Als Tabelle: Woche | Thema | Ziel | Ansprechpartner. Max. 1 Seite, einfache Sprache.',
    tags: ['HR', 'Onboarding', 'Planung'], status: 'green', submittedBy: 'Sandra Klein', createdAt: '2025-10-02', usageCount: 18,
  },
  {
    id: 'p6', title: 'Präsentation gliedern und ausarbeiten', category: 'Kommunikation',
    role: 'Du bist ein erfahrener Business-Kommunikationsberater.',
    context: 'Eine Präsentation für [ZIELGRUPPE] muss inhaltlich strukturiert und überzeugend aufgebaut werden.',
    task: 'Erstelle eine Gliederung und Kernaussagen für eine Präsentation zum Thema [THEMA] für [ZIELGRUPPE]. Dauer: [X] Minuten.',
    format: 'Gliederung mit Folienanzahl pro Abschnitt. Für jede Folie: Titel + 2–3 Kernaussagen als Bullets. Am Ende: empfohlener Call-to-Action.',
    tags: ['Präsentation', 'Kommunikation', 'Strategie'], status: 'green', submittedBy: 'Emma Bauer', createdAt: '2025-11-20', usageCount: 44,
  },
  {
    id: 'p7', title: 'SQL-Abfrage erklären und optimieren', category: 'IT / Daten',
    role: 'Du bist ein erfahrener Datenbankexperte.',
    context: 'Eine bestehende SQL-Abfrage soll verständlich gemacht und auf Performance optimiert werden.',
    task: 'Erkläre diese SQL-Abfrage in einfacher Sprache und schlage Optimierungen vor: [SQL EINFÜGEN].',
    format: 'Erst: Erklärung in 3–5 Sätzen. Dann: optimierte Version mit kommentierten Änderungen. Dann: erwartete Performance-Verbesserung.',
    tags: ['IT', 'Daten', 'SQL', 'Optimierung'], status: 'green', submittedBy: 'Alexander Koch', createdAt: '2025-09-10', usageCount: 15,
  },
  {
    id: 'p8', title: 'KI-Schulungsplan für Abteilung erstellen', category: 'Enablement',
    role: 'Du bist ein KI-Enablement-Spezialist mit Erfahrung in der Erwachsenenbildung.',
    context: 'Eine Abteilung soll systematisch im Umgang mit KI-Tools geschult werden.',
    task: 'Erstelle einen 3-monatigen KI-Schulungsplan für die Abteilung [ABTEILUNG] mit [X] Mitarbeitenden. Wissenstand: [NIVEAU].',
    format: 'Monatsübersicht mit Themen, Dauer, Format (Workshop/E-Learning/Selbststudium) und Lernziel. Als Tabelle.',
    tags: ['Enablement', 'Schulung', 'KI'], status: 'yellow', submittedBy: 'Carlos Rodriguez', createdAt: '2026-01-15', usageCount: 3,
  },
  {
    id: 'p9', title: 'Lieferantenvergleich strukturieren', category: 'Operations',
    role: 'Du bist ein erfahrener Einkaufsexperte.',
    context: 'Mehrere Lieferantenangebote liegen vor und sollen objektiv verglichen werden.',
    task: 'Erstelle eine Vergleichsmatrix für folgende Angebote: [ANGEBOTE EINFÜGEN]. Kriterien: Preis, Qualität, Lieferzeit, Service, Nachhaltigkeit.',
    format: 'Tabelle mit gewichteten Kriterien (Preis 30%, Qualität 30%, Lieferzeit 20%, Service 10%, Nachhaltigkeit 10%). Ergebnis: Empfehlung mit Begründung.',
    tags: ['Einkauf', 'Analyse', 'Operations'], status: 'yellow', submittedBy: 'Marcus Schmidt', createdAt: '2026-02-03', usageCount: 5,
  },
  {
    id: 'p10', title: 'Fehler in Python-Code finden', category: 'IT / Daten',
    role: 'Du bist ein Senior Python-Entwickler.',
    context: 'Ein Python-Skript läuft nicht wie erwartet und enthält möglicherweise Bugs.',
    task: 'Analysiere diesen Python-Code auf Fehler und Verbesserungspotenzial: [CODE EINFÜGEN].',
    format: 'Zuerst: Liste aller gefundenen Fehler mit Zeilennummer und Erklärung. Dann: korrigierter Code. Dann: 2–3 optionale Verbesserungen.',
    tags: ['Python', 'Code', 'Debugging'], status: 'red', submittedBy: 'Dr. Yuki Tanaka', createdAt: '2025-07-01', usageCount: 2,
  },
]

const CATEGORIES = ['Alle', ...Array.from(new Set(DEMO_PROMPTS.map((p) => p.category))).sort()]

const STATUS_CONFIG: Record<PromptStatus, { label: string; color: string; dot: string; bg: string }> = {
  green:  { label: 'Freigegeben', color: 'text-green-700',  dot: 'bg-green-500',  bg: 'bg-green-50 border-green-200' },
  yellow: { label: 'In Prüfung',  color: 'text-amber-700',  dot: 'bg-amber-400',  bg: 'bg-amber-50 border-amber-200' },
  red:    { label: 'Veraltet',    color: 'text-red-700',    dot: 'bg-red-500',    bg: 'bg-red-50 border-red-200' },
}

const LS_KEY = 'ai_prompts_v1'

function loadPrompts(): Prompt[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function savePrompts(prompts: Prompt[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(prompts)) } catch {}
}

// ── RCKF Builder ──────────────────────────────────────────────────────────────

function buildFullPrompt(p: Pick<Prompt, 'role' | 'context' | 'task' | 'format'>) {
  return [
    p.role && `**Rolle:** ${p.role}`,
    p.context && `\n**Kontext:** ${p.context}`,
    p.task && `\n**Aufgabe:** ${p.task}`,
    p.format && `\n**Format:** ${p.format}`,
  ].filter(Boolean).join('')
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RCKFBadge({ label, value }: { label: string; value: string }) {
  const colors: Record<string, string> = {
    R: 'bg-blue-100 text-blue-700',
    C: 'bg-violet-100 text-violet-700',
    K: 'bg-amber-100 text-amber-700',
    F: 'bg-green-100 text-green-700',
  }
  return (
    <div className="flex gap-2 text-xs">
      <span className={`font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${colors[label]}`}>{label}</span>
      <span className="text-slate-500 leading-relaxed">{value}</span>
    </div>
  )
}

function PromptCard({
  prompt,
  canManage,
  demoMode,
  onStatusChange,
}: {
  prompt: Prompt
  canManage: boolean
  demoMode: boolean
  onStatusChange: (id: string, s: PromptStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const cfg = STATUS_CONFIG[prompt.status]

  const copy = () => {
    navigator.clipboard.writeText(buildFullPrompt(prompt))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${prompt.status === 'red' ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{prompt.category}</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">{prompt.title}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{prompt.submittedBy} · {prompt.createdAt} · {prompt.usageCount}× genutzt</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {prompt.status === 'green' && (
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? '✓ Kopiert' : 'Kopieren'}
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {prompt.tags.map((t) => (
          <span key={t} className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>

      {/* RCKF expandable */}
      <div className="border-t border-slate-50">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-2 px-5 py-2.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          RCKF-Bausteine anzeigen
        </button>
        {expanded && (
          <div className="px-5 pb-4 space-y-2 border-t border-slate-50 pt-3">
            <RCKFBadge label="R" value={prompt.role} />
            <RCKFBadge label="C" value={prompt.context} />
            <RCKFBadge label="K" value={prompt.task} />
            <RCKFBadge label="F" value={prompt.format} />
          </div>
        )}
      </div>

      {/* Manage actions (logged in, non-demo) */}
      {canManage && !demoMode && (
        <div className="border-t border-slate-100 px-5 py-3 flex gap-2">
          {prompt.status !== 'green'  && <button onClick={() => onStatusChange(prompt.id, 'green')}  className="text-[10px] font-semibold bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded transition-colors">🟢 Freigeben</button>}
          {prompt.status !== 'yellow' && <button onClick={() => onStatusChange(prompt.id, 'yellow')} className="text-[10px] font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 px-2 py-1 rounded transition-colors">🟡 In Prüfung</button>}
          {prompt.status !== 'red'    && <button onClick={() => onStatusChange(prompt.id, 'red')}    className="text-[10px] font-semibold bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded transition-colors">🔴 Sperren</button>}
        </div>
      )}
    </div>
  )
}

// ── Submit Modal ──────────────────────────────────────────────────────────────

const EMPTY_FORM = { title: '', category: '', role: '', context: '', task: '', format: '', tags: '' }

function SubmitModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (p: Omit<Prompt, 'id' | 'status' | 'createdAt' | 'usageCount'>) => void }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const user = useAuthStore((s) => s.user)

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = () => {
    if (!form.title || !form.task) return
    onSubmit({
      title: form.title,
      category: form.category || 'Sonstige',
      role: form.role,
      context: form.context,
      task: form.task,
      format: form.format,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      submittedBy: user?.email ?? 'Anonym',
    })
    onClose()
  }

  const field = (label: string, key: keyof typeof EMPTY_FORM, placeholder: string, hint?: string, large?: boolean) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {hint && <p className="text-[10px] text-slate-400 mb-1">{hint}</p>}
      {large
        ? <textarea rows={3} value={form[key]} onChange={set(key)} placeholder={placeholder} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
        : <input type="text" value={form[key]} onChange={set(key)} placeholder={placeholder} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
      }
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Prompt einreichen</h2>
          <p className="text-xs text-slate-500 mt-0.5">Wird zunächst als 🟡 In Prüfung gespeichert. Die KI-Beauftragte prüft innerhalb von 5 Werktagen.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {field('Titel *', 'title', 'z.B. Stellenanzeige erstellen')}
          {field('Kategorie', 'category', 'z.B. HR, Operations, IT / Daten')}
          {field('R – Rolle', 'role', 'Wer soll die KI sein?', 'z.B. „Du bist eine erfahrene Personalreferentin"', true)}
          {field('C – Kontext', 'context', 'Welche Hintergründe braucht sie?', 'z.B. „Es geht um das Onboarding neuer Azubis"', true)}
          {field('K – Konkrete Aufgabe *', 'task', 'Was genau soll erledigt werden?', 'z.B. „Erstelle einen 4-wöchigen Einarbeitungsplan für [POSITION]"', true)}
          {field('F – Format', 'format', 'Wie soll das Ergebnis aussehen?', 'z.B. „Als Tabelle, max. 1 Seite, einfache Sprache"', true)}
          {field('Tags (Komma-getrennt)', 'tags', 'z.B. HR, Onboarding, Planung')}

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            🔒 <strong>Datenschutz:</strong> Keine personenbezogenen Daten, Kundendaten oder Geschäftsgeheimnisse in Prompts einfügen.
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">Abbrechen</button>
          <button onClick={handleSubmit} disabled={!form.title || !form.task} className="text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors">Einreichen</button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const RCKF_INFO = [
  { key: 'R', label: 'Rolle', q: 'Wer soll die KI sein?', ex: '„Du bist erfahrene Personalreferentin"', color: 'bg-blue-100 text-blue-700' },
  { key: 'C', label: 'Kontext', q: 'Welche Hintergründe braucht sie?', ex: '„Es geht um Onboarding für neue Azubis"', color: 'bg-violet-100 text-violet-700' },
  { key: 'K', label: 'Konkrete Aufgabe', q: 'Was genau soll erledigt werden?', ex: '„Erstelle einen 4-wöchigen Einarbeitungsplan"', color: 'bg-amber-100 text-amber-700' },
  { key: 'F', label: 'Format', q: 'Wie soll das Ergebnis aussehen?', ex: '„Als Tabelle, max. 1 Seite, einfache Sprache"', color: 'bg-green-100 text-green-700' },
]

export default function PromptLibraryPage() {
  const user = useAuthStore((s) => s.user)
  const demoMode = useDemoStore((s) => s.demoMode)

  const [userPrompts, setUserPrompts] = useState<Prompt[]>(() => demoMode ? [] : loadPrompts())
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Alle')
  const [statusFilter, setStatusFilter] = useState<PromptStatus | 'all'>('all')
  const [showRCKF, setShowRCKF] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)

  const allPrompts = [...DEMO_PROMPTS, ...userPrompts]

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allPrompts.filter((p) => {
      if (category !== 'Alle' && p.category !== category) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (q && !p.title.toLowerCase().includes(q) && !p.tags.join(' ').toLowerCase().includes(q) && !p.task.toLowerCase().includes(q)) return false
      return true
    })
  }, [allPrompts, category, statusFilter, search])

  const handleSubmit = (data: Omit<Prompt, 'id' | 'status' | 'createdAt' | 'usageCount'>) => {
    const newPrompt: Prompt = {
      ...data,
      id: nanoid(),
      status: 'yellow',
      createdAt: new Date().toISOString().slice(0, 10),
      usageCount: 0,
    }
    const next = [...userPrompts, newPrompt]
    setUserPrompts(next)
    if (!demoMode) savePrompts(next)
  }

  const handleStatusChange = (id: string, status: PromptStatus) => {
    const update = (list: Prompt[]) => list.map((p) => p.id === id ? { ...p, status } : p)
    setUserPrompts((prev) => {
      const next = update(prev)
      if (!demoMode) savePrompts(next)
      return next
    })
  }

  const greenCount  = allPrompts.filter((p) => p.status === 'green').length
  const yellowCount = allPrompts.filter((p) => p.status === 'yellow').length
  const redCount    = allPrompts.filter((p) => p.status === 'red').length

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Prompt-Bibliothek</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bewährte KI-Anweisungen zum Wiederverwenden — geprüft und freigegeben durch den KI-Beauftragten.
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowSubmit(true)}
            className="flex-shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Prompt einreichen
          </button>
        )}
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { status: 'green' as const, count: greenCount, label: '🟢 Freigegeben' },
          { status: 'yellow' as const, count: yellowCount, label: '🟡 In Prüfung' },
          { status: 'red' as const, count: redCount, label: '🔴 Veraltet' },
        ].map(({ status, count, label }) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`bg-white rounded-xl p-4 text-left border-2 transition-colors shadow-sm ${
              statusFilter === status ? 'border-blue-400' : 'border-transparent hover:border-slate-200'
            }`}
          >
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{count}</p>
          </button>
        ))}
      </div>

      {/* RCKF Info */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setShowRCKF((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-base">🧩</span>
            <p className="text-sm font-semibold text-slate-700">Das RCKF-Schema — so werden gute Prompts gebaut</p>
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${showRCKF ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showRCKF && (
          <div className="border-t border-slate-100 px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RCKF_INFO.map(({ key, label, q, ex, color }) => (
                <div key={key} className="flex gap-3 p-3 rounded-lg bg-slate-50">
                  <span className={`font-bold text-sm px-2 py-1 rounded flex-shrink-0 h-fit ${color}`}>{key}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{q}</p>
                    <p className="text-[10px] text-slate-400 mt-1 italic">{ex}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-700">
              🔒 <strong>Datenschutz:</strong> Keine personenbezogenen Daten, Kundendaten oder Geschäftsgeheimnisse in Prompts einfügen. Nur freigegebene KI-Tools gemäß Unternehmensrichtlinie nutzen.
            </div>
          </div>
        )}
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Prompts durchsuchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                category === cat ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {search && (
        <p className="text-xs text-slate-400">{filtered.length} Ergebnis{filtered.length !== 1 ? 'se' : ''}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl p-8 text-center">
            <p className="text-slate-400 text-sm">Keine Prompts gefunden.</p>
          </div>
        ) : (
          filtered.map((p) => (
            <PromptCard
              key={p.id}
              prompt={p}
              canManage={!!user}
              demoMode={demoMode}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* Process info */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Prozess: Einreichen → Prüfen → Freigeben</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {[
            { num: '1', label: 'Einreichen', desc: 'Prompt bei der KI-Beauftragten einreichen — kein direktes Teilen untereinander.' },
            { num: '2', label: 'Prüfen', desc: 'Prüfung anhand der Aufnahmekriterien. Dauer: max. 5 Werktage.' },
            { num: '3', label: 'Freigeben', desc: 'Status Grün = nutzbar. Abgelehnte Prompts erhalten Feedback.' },
            { num: '4', label: 'Nutzen & pflegen', desc: 'Alle 6 Monate Überprüfung. Kaum genutzte Prompts werden auf Gelb gesetzt.' },
          ].map(({ num, label, desc }) => (
            <div key={num} className="flex-1 flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{num}</span>
              <div>
                <p className="text-xs font-semibold text-slate-700">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} onSubmit={handleSubmit} />}
    </div>
  )
}
