import { useState, useRef, useEffect } from 'react'
import { useDemoStore } from '../store/demoStore'

// ── Types ─────────────────────────────────────────────────────────────────────

type AnimalKey = 'hippo' | 'rhino' | 'wolf' | 'zebra' | 'seagull' | 'cobra' | 'puffin' | 'goose' | 'puma' | 'yak'
type QuadKey = 'q1' | 'q2' | 'q3' | 'q4'
type TabKey = 'matrix' | 'list' | 'comms' | 'zoo'

interface Stakeholder {
  id: string
  name: string
  role: string
  power: number
  interest: number
  animal: AnimalKey
  notes: string
}

interface AnimalDef {
  name: string
  full: string
  emoji: string
  color: string
  bg: string
  desc: string
  warn: string
  tips: string[]
}

interface QuadDef {
  name: string
  sub: string
  color: string
  border: string
  bgClass: string
  channel: string
  freq: string
  content: string
  goal: string
}

// ── Data ─────────────────────────────────────────────────────────────────────

const ANIMALS: Record<AnimalKey, AnimalDef> = {
  hippo: { name: 'HiPPO', full: "Highest Paid Person's Opinion", emoji: '🦛', color: '#16a34a', bg: 'rgba(22,163,74,.12)',
    desc: 'Leaders who decide on gut feeling, dismissing data and team input.',
    warn: '"I think we should…" — no evidence, full authority.',
    tips: ['Be their discovery partner. Frame next steps as "confirming your hypothesis," not challenging it.', 'Amass mixed evidence: user research, market data, competitor benchmarks.', 'Define what success looks like with numbers — converts gut-feel into a measurable project.'] },
  rhino: { name: 'RHiNO', full: 'Really High-value New Opportunity', emoji: '🦏', color: '#b45309', bg: 'rgba(180,83,9,.12)',
    desc: 'Drives one-off feature requests focused on a single deal, ignoring the broader market.',
    warn: '"If we just had feature X, we\'d land this client."',
    tips: ['Redirect to market needs — identify the core problem felt by a broad customer range.', 'Share technical complexity so they understand what "just adding" actually involves.', 'Assign them validation research: does anyone else need this? Tiny acts of discovery before building.'] },
  wolf: { name: 'WoLF', full: 'Works on Latest Fire', emoji: '🐺', color: '#b91c1c', bg: 'rgba(185,28,28,.10)',
    desc: 'A situation (not always a person) creating constant firefighting that blocks all strategic work.',
    warn: 'Permanent crisis mode — reactive, never planned, always urgent.',
    tips: ['Use "firebreaks": contain releases to limited user segments to restrict blast radius.', 'Pay down technical debt in every sprint — one fix per release, no exceptions.', 'Document the conscious decision when a fire takes over — make priority shifts visible.'] },
  zebra: { name: 'ZEbRA', full: 'Zero Evidence But Really Arrogant', emoji: '🦓', color: '#1d4ed8', bg: 'rgba(29,78,216,.10)',
    desc: 'Relies on instinct, dismisses contradicting data, asserts opinions as proven facts.',
    warn: 'Confident claims, zero data — and strong resistance to challenge.',
    tips: ['Produce your own evidence. When they have none, bring yours and shift the burden of proof.', 'Gather more voices: ZEbRAs fold when multiple credible sources contradict them.', 'Shift the suggestion: subtly steer their idea toward your strategy so they feel it\'s still "theirs."'] },
  seagull: { name: 'Seagull', full: 'Seagull Manager', emoji: '🦅', color: '#c2410c', bg: 'rgba(194,65,12,.10)',
    desc: 'Swoops in from afar, creates well-intentioned chaos with context-free directives, then disappears.',
    warn: 'Sudden high-power intervention that resets weeks of work — then silence.',
    tips: ['Validate the insight behind their proposal, not the solution. Ask: "What problem are you seeing?"', 'Slow the swoop rate through transparency: connect them to day-to-day progress regularly.'] },
  cobra: { name: 'CoBRA', full: 'Cognitive Bias Related Assertions', emoji: '🐍', color: '#15803d', bg: 'rgba(21,128,61,.10)',
    desc: 'Invisible cognitive biases (confirmation, sunk-cost, optimism) driving decisions undetected.',
    warn: 'Snap judgments and invisible bias — damage is often only visible after the fact.',
    tips: ['Familiarise the team with common biases: confirmation bias, sunk cost, escalation of commitment.', 'Break large decisions into small, reversible steps to buy time for learning.', 'Invite diverse voices into every important decision.'] },
  puffin: { name: 'PUFFIn', full: 'Plans Unending Feature Factory Initiatives', emoji: '🐦', color: '#6d28d9', bg: 'rgba(109,40,217,.10)',
    desc: 'Chases shiny new features with no long-term vision — building for the sake of building.',
    warn: '"Can we just quickly add…" — endless scope creep with no North Star.',
    tips: ['Make the strategic roadmap visible and accessible to stakeholders so context is always present.', 'Recognise when runways are at risk — Feature Factories emerge under financial pressure.', 'Validate before building: every "quick add" needs a discovery step first.'] },
  goose: { name: 'GOOSE', full: 'Guesstimating Overly Optimistic Scheduling Estimates', emoji: '🦢', color: '#9f1239', bg: 'rgba(159,18,57,.10)',
    desc: 'Chronically over-promises timelines, forgetting QA, onboarding, and unforeseen complexity.',
    warn: '"It\'ll be done by Friday." — Every. Single. Week.',
    tips: ['Keep user stories tiny: one outcome, one "when → then." Smaller scope = reliable estimates.', 'Account for QA, go-to-market, onboarding, and documentation in every estimate.', 'Keep a history of past estimates and review them as a team.'] },
  puma: { name: 'PUMA', full: 'Promotes Unusually Meaningless Assumptions', emoji: '🐆', color: '#374151', bg: 'rgba(55,65,81,.10)',
    desc: 'Pounces on single data points or anecdotes and treats them as universal truth.',
    warn: '"One customer said X, so we must change everything immediately."',
    tips: ['Stay in the problem space longer. Ask "five whys" before jumping to a solution.', 'Run tiny acts of discovery: A/B tests, customer interviews, hand-drawn wireframes.', 'Translate solution-space language into problem-space questions.'] },
  yak: { name: 'YAK', full: 'Yet Another KPI', emoji: '🐂', color: '#92400e', bg: 'rgba(146,64,14,.10)',
    desc: 'Obsesses over metrics and vanity numbers disconnected from real business outcomes.',
    warn: 'Drowning in dashboards, optimising metrics that can be gamed or don\'t matter.',
    tips: ['Tie every KPI to a desired user behaviour or concrete business result.', 'The "I" in KPI stands for "indicator" — treat them as course-correction signals, not verdicts.', 'Create psychological safety around metrics so people share bad news early.'] },
}

const QUADS: Record<QuadKey, QuadDef> = {
  q1: { name: 'Manage Closely', sub: 'Schlüssel-Stakeholder', color: '#ef4444', border: 'border-red-200', bgClass: 'bg-red-50/70',
    channel: 'Persönliches Meeting, Steering Committee', freq: 'Wöchentlich',
    content: 'Status, Risiken, Entscheidungsvorlagen, ROI-Fortschritt', goal: 'Commitment sichern, Blocker frühzeitig lösen' },
  q2: { name: 'Keep Satisfied', sub: 'Latente Entscheider', color: '#3b82f6', border: 'border-blue-200', bgClass: 'bg-blue-50/70',
    channel: 'Executive Briefing, E-Mail', freq: 'Monatlich',
    content: 'Executive Summary (1 Seite), Budget-Impact, strategische Milestones', goal: 'Zufriedenheit erhalten, Eskalation verhindern' },
  q3: { name: 'Keep Informed', sub: 'Engagierte Unterstützer', color: '#f59e0b', border: 'border-amber-200', bgClass: 'bg-amber-50/70',
    channel: 'Team-Newsletter, Townhall, Slack', freq: 'Bi-wöchentlich',
    content: 'Sprint-Updates, Lessons Learned, offener Feedback-Kanal', goal: 'Einbindung und Motivation aufrechterhalten' },
  q4: { name: 'Monitor', sub: 'Rand-Stakeholder', color: '#64748b', border: 'border-slate-200', bgClass: 'bg-slate-50/60',
    channel: 'Newsletter, allgemeine Ankündigung', freq: 'Quartalsweise',
    content: 'Allgemeiner Fortschrittsstand, keine Überraschungen', goal: 'Informiert halten ohne Overload' },
}

const DEFAULT_SH: Stakeholder[] = [
  { id: 's1',  name: 'Dr. Petra Schreiber',  role: 'CTO / KI-Programm-Sponsor',         power: 9,  interest: 8, animal: 'hippo',   notes: 'Enthusiastisch für KI, trifft finale Budgetentscheidungen. Entscheidet auf Bauchgefühl — Daten helfen, wenn man sie als "Bestätigung ihrer Vision" rahmt.' },
  { id: 's2',  name: 'Heinrich Mäurer',       role: 'CEO',                                power: 10, interest: 2, animal: 'seagull', notes: 'Hat das KI-Programm abgesegnet, schaltet sich aber ohne Kontext ein. Regelmäßige 1-seitige Executive Summaries verringern spontane Interventionen.' },
  { id: 's3',  name: 'Anna Fischer',          role: 'Datenschutzbeauftragte',             power: 7,  interest: 7, animal: 'cobra',   notes: 'DSGVO Art. 38 — Pflichteinbindung. Entscheidet über Freigabe der Kundendaten. Cognitive Bias oft unsichtbar: bevorzugt bekannte Risiken gegenüber neuen.' },
  { id: 's4',  name: 'Alfons Brockmann',      role: 'Senior Field Techniker',             power: 4,  interest: 9, animal: 'zebra',   notes: '20 Jahre Erfahrung, Vertrauen der Basis an allen Standorten. Behauptet auf Basis von Erfahrung — Data-Gegenbeweis allein reicht nicht, braucht Peer-Stimmen.' },
  { id: 's5',  name: 'Thomas Bauer',          role: 'VP Vertrieb',                        power: 6,  interest: 8, animal: 'rhino',   notes: 'Sieht KI als Verkaufsargument. Fordert laufend One-off-Features für spezifische Deals. "Wenn wir Feature X hätten, würden wir diesen Kunden gewinnen."' },
  { id: 's6',  name: 'Kai Zimmermann',        role: 'IT-Leiter',                          power: 6,  interest: 5, animal: 'wolf',    notes: 'Reagiert nur auf Brände — jede Woche eine neue Krise. Legacy-Systeme erzeugen permanenten Firefighting-Modus, der KI-Projektzeit auffrisst.' },
  { id: 's7',  name: 'Lisa Hartmann',         role: 'Head of Product',                    power: 5,  interest: 8, animal: 'puffin',  notes: 'Jede Woche neue Feature-Ideen ohne strategischen Anker. "Können wir das nicht einfach kurz hinzufügen?" Roadmap-Transparenz ist das wichtigste Gegenmittel.' },
  { id: 's8',  name: 'Markus Brandt',         role: 'Projektleiter Digitalisierung',      power: 4,  interest: 7, animal: 'goose',   notes: '"Fertig bis Freitag." — Jede Woche. Vergisst QA, Onboarding und technische Schulden. History-Reviews helfen, schätzt aber ungern öffentlich nach.' },
  { id: 's9',  name: 'Sandra Weber',          role: 'Head of HR',                         power: 5,  interest: 6, animal: 'puma',    notes: '"Ein Techniker hat gesagt, das Tool ist zu kompliziert — wir müssen alles überarbeiten." Pounces on einzelne Datenpunkte; Discovery-Sprints helfen.' },
  { id: 's10', name: 'Dr. Stefan Müller',     role: 'CFO',                                power: 8,  interest: 3, animal: 'yak',     notes: 'Fordert 12 KPIs pro Sprint-Review. Optimiert Metriken, die man einfach messen kann, nicht die, die wichtig sind. ROI-Anbindung jedes KPIs ist Pflicht.' },
  { id: 's11', name: 'Bernd Kruse',           role: 'Werkleiter Busan',                   power: 3,  interest: 2, animal: 'rhino',   notes: 'Periphere Rolle — sein Standort ist kaum vom KI-Programm betroffen. Könnte zum RHiNO werden, wenn lokale Interessen ohne Vorwarnung berührt werden. Quartalsweise Newsletter reicht aus.' },
  { id: 's12', name: 'Julia Kern',            role: 'PR & Unternehmenskommunikation',     power: 2,  interest: 3, animal: 'goose',   notes: 'Kein direkter Einfluss auf das KI-Programm. Wird bei externen Kommunikationsmaßnahmen informiert. Neigt zu optimistischen Ankündigungen — Timing mit ihr abstimmen.' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return 's' + Math.random().toString(36).slice(2, 8) }
function gq(p: number, i: number): QuadKey {
  return p >= 5 && i >= 5 ? 'q1' : p >= 5 && i < 5 ? 'q2' : p < 5 && i >= 5 ? 'q3' : 'q4'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StakeholderPage() {
  const demoMode = useDemoStore(s => s.demoMode)
  const [sh, setSh] = useState<Stakeholder[]>(DEFAULT_SH)
  const [selId, setSelId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('matrix')
  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null })
  const [aiModal, setAiModal] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const [gridH, setGridH] = useState(0)

  useEffect(() => {
    const ro = new ResizeObserver(e => { if (e[0]) setGridH(e[0].contentRect.height) })
    if (gridRef.current) ro.observe(gridRef.current)
    return () => ro.disconnect()
  }, [])

  const selected = sh.find(s => s.id === selId) ?? null
  const openAdd = () => setModal({ open: true, editId: null })
  const openEdit = (id: string) => setModal({ open: true, editId: id })
  const closeModal = () => setModal({ open: false, editId: null })

  function saveStakeholder(data: Omit<Stakeholder, 'id'>) {
    if (modal.editId) {
      setSh(prev => prev.map(s => s.id === modal.editId ? { ...s, ...data } : s))
    } else {
      setSh(prev => [...prev, { id: uid(), ...data }])
    }
    closeModal()
  }

  function removeStakeholder(id: string) {
    if (!confirm('Stakeholder entfernen?')) return
    setSh(prev => prev.filter(s => s.id !== id))
    if (selId === id) setSelId(null)
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'matrix', label: 'Matrix' },
    { key: 'list', label: 'Teamliste' },
    { key: 'comms', label: 'Kommunikationsplan' },
    { key: 'zoo', label: 'Tier-Leitfaden' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">🦁 Stakeholder Zoo</h1>
          <p className="text-xs text-slate-400 mt-0.5">Mendelow-Matrix × Dangerous Animals of Product Management</p>
        </div>
        <div className="flex items-center gap-2">
          {!demoMode && (
            <button onClick={() => setAiModal(true)} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              ✦ Mit KI generieren
            </button>
          )}
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Stakeholder
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-slate-200 bg-white px-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* ── MATRIX ─────────────────────────────────────────── */}
        {tab === 'matrix' && (
          <div className="flex h-full">
            {/* Matrix area */}
            <div className="flex-1 flex flex-col p-4 pl-10 gap-2 min-w-0">
              {/* Y label */}
              <div className="flex flex-col items-start gap-1 flex-1 min-h-0">
                <div className="relative w-full flex-1 min-h-0" ref={gridRef}>
                  {/* Rotated Y axis */}
                  <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold tracking-widest text-slate-400 uppercase whitespace-nowrap select-none">
                    Power ↑
                  </div>

                  {/* The grid */}
                  <div
                    className="w-full h-full relative grid grid-cols-2 grid-rows-2 border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                    onClick={(e) => { if (!(e.target as Element).closest('[data-dot]')) setSelId(null) }}
                  >
                    {/* Q2 top-left: Keep Satisfied */}
                    <div className="bg-blue-50/60 border-b border-r border-slate-200 p-3 flex flex-col">
                      <span className="text-[9px] font-bold tracking-widest text-blue-500 uppercase">Keep Satisfied</span>
                      <span className="text-[10px] text-slate-500 font-medium mt-0.5">Latente Entscheider</span>
                      <span className="mt-1.5 self-start text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">Hohe Macht · Geringes Interesse</span>
                      <div className="mt-auto pt-3 space-y-1 border-t border-blue-100 mt-3">
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Kanal:</span> Executive Briefing, E-Mail</div>
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Frequenz:</span> Monatlich</div>
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Inhalt:</span> 1-Pager, Budget-Impact, Milestones</div>
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Ziel:</span> Zufriedenheit erhalten, Eskalation verhindern</div>
                      </div>
                    </div>
                    {/* Q1 top-right: Manage Closely */}
                    <div className="bg-red-50/60 border-b border-slate-200 p-3 flex flex-col">
                      <span className="text-[9px] font-bold tracking-widest text-red-500 uppercase">Manage Closely</span>
                      <span className="text-[10px] text-slate-500 font-medium mt-0.5">Schlüssel-Stakeholder</span>
                      <span className="mt-1.5 self-start text-[9px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-600">Hohe Macht · Hohes Interesse</span>
                      <div className="mt-auto pt-3 space-y-1 border-t border-red-100 mt-3">
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Kanal:</span> Persönliches Meeting, Steering Committee</div>
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Frequenz:</span> Wöchentlich</div>
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Inhalt:</span> Status, Risiken, Entscheidungsvorlagen, ROI</div>
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Ziel:</span> Commitment sichern, Blocker lösen</div>
                      </div>
                    </div>
                    {/* Q4 bottom-left: Monitor */}
                    <div className="bg-slate-50/60 border-r border-slate-200 p-3 flex flex-col">
                      <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">Monitor</span>
                      <span className="text-[10px] text-slate-500 font-medium mt-0.5">Rand-Stakeholder</span>
                      <span className="mt-1.5 self-start text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">Geringe Macht · Geringes Interesse</span>
                      <div className="mt-auto pt-3 space-y-1 border-t border-slate-200 mt-3">
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Kanal:</span> Newsletter, allgemeine Ankündigung</div>
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Frequenz:</span> Quartalsweise</div>
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Inhalt:</span> Allgemeiner Fortschrittsstand</div>
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Ziel:</span> Informiert halten ohne Overload</div>
                      </div>
                    </div>
                    {/* Q3 bottom-right: Keep Informed */}
                    <div className="bg-amber-50/60 p-3 flex flex-col">
                      <span className="text-[9px] font-bold tracking-widest text-amber-600 uppercase">Keep Informed</span>
                      <span className="text-[10px] text-slate-500 font-medium mt-0.5">Engagierte Unterstützer</span>
                      <span className="mt-1.5 self-start text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">Geringe Macht · Hohes Interesse</span>
                      <div className="mt-auto pt-3 space-y-1 border-t border-amber-100 mt-3">
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Kanal:</span> Newsletter, Townhall, Slack</div>
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Frequenz:</span> Bi-wöchentlich</div>
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Inhalt:</span> Sprint-Updates, Lessons Learned, Feedback</div>
                        <div className="text-[9px] text-slate-400"><span className="font-semibold text-slate-500">Ziel:</span> Einbindung und Motivation erhalten</div>
                      </div>
                    </div>

                    {/* Dots layer */}
                    <div className="absolute inset-0 pointer-events-none" style={{ height: gridH || '100%' }}>
                      {sh.map(s => {
                        const a = ANIMALS[s.animal]
                        const isSelected = s.id === selId
                        return (
                          <div
                            key={s.id}
                            data-dot="true"
                            className="absolute pointer-events-auto cursor-pointer transition-transform duration-150"
                            style={{
                              left: `${s.interest / 10 * 100}%`,
                              bottom: `${s.power / 10 * 100}%`,
                              transform: `translate(-50%, 50%) scale(${isSelected ? 1.2 : 1})`,
                              zIndex: isSelected ? 10 : 2,
                            }}
                            onClick={(e) => { e.stopPropagation(); setSelId(s.id); setTab('matrix') }}
                            title={s.name}
                          >
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-md border-2 transition-all duration-150"
                              style={{
                                background: a.bg,
                                borderColor: isSelected ? '#2563eb' : a.color,
                                boxShadow: isSelected ? `0 0 0 2px #2563eb, 0 4px 12px rgba(37,99,235,.3)` : undefined,
                              }}
                            >
                              {a.emoji}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* X axis */}
              <div className="flex justify-between text-[10px] font-semibold tracking-widest text-slate-400 uppercase px-1">
                <span>Low Interest</span>
                <span>High Interest</span>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 flex-shrink-0 border-l border-slate-200 bg-white overflow-y-auto flex flex-col">
              {!selected ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <span className="text-4xl opacity-30">🗺️</span>
                  <p className="text-sm text-slate-400">Klicke auf einen Stakeholder in der Matrix, um sein Profil und die Zähmungsstrategie zu sehen.</p>
                  <button onClick={openAdd} className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    + Stakeholder hinzufügen
                  </button>
                </div>
              ) : (
                <DetailPanel s={selected} onEdit={() => openEdit(selected.id)} onDelete={() => removeStakeholder(selected.id)} />
              )}
            </div>
          </div>
        )}

        {/* ── LIST ─────────────────────────────────────────────── */}
        {tab === 'list' && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    {['Stakeholder', 'Tier-Typ', 'Quadrant', 'Macht', 'Interesse', 'Kanal · Frequenz', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sh.map((s, i) => {
                    const a = ANIMALS[s.animal]
                    const q = gq(s.power, s.interest)
                    const qi = QUADS[q]
                    return (
                      <tr key={s.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{s.name}</div>
                          <div className="text-xs text-slate-400">{s.role}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border" style={{ background: a.bg, borderColor: a.color, color: a.color }}>
                            {a.emoji} {a.name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full border bg-transparent" style={{ borderColor: qi.color, color: qi.color }}>
                            {qi.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-600">{s.power}/10</td>
                        <td className="px-4 py-3 tabular-nums text-slate-600">{s.interest}/10</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{qi.channel}<br />{qi.freq}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => openEdit(s.id)} className="text-xs text-slate-400 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-2 py-1 rounded transition-colors">Bearbeiten</button>
                        </td>
                      </tr>
                    )
                  })}
                  {sh.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">Noch keine Stakeholder. Klicke "+ Stakeholder" um zu beginnen.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── COMMS PLAN ───────────────────────────────────────── */}
        {tab === 'comms' && (
          <div className="p-6 overflow-auto h-full">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-800">Kommunikationsmatrix</h2>
              <p className="text-xs text-slate-400 mt-0.5">Automatisch generiert aus Stakeholder-Profilen — Mendelow-Quadrant × Tier-Archetypus kombiniert.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" style={{ minWidth: 900 }}>
                <thead>
                  <tr className="border-b border-slate-200">
                    {['Stakeholder', 'Animal', 'Inhalt', 'Ziel', 'Kanal', 'Frequenz', 'Verantwortlich', '⚠ Warnsignal'].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase whitespace-nowrap bg-white sticky top-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sh.map(s => {
                    const a = ANIMALS[s.animal]
                    const q = gq(s.power, s.interest)
                    const qi = QUADS[q]
                    return (
                      <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{s.name}</div>
                          <div className="text-slate-400">{s.role}</div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">{a.emoji} {a.name}</td>
                        <td className="px-3 py-3 text-slate-600 leading-relaxed max-w-[180px]">{qi.content}</td>
                        <td className="px-3 py-3 text-slate-600 leading-relaxed max-w-[160px]">{qi.goal}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-slate-600">{qi.channel}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-slate-600">{qi.freq}</td>
                        <td className="px-3 py-3 text-slate-400">KI-Beauftragter</td>
                        <td className="px-3 py-3 text-red-500 max-w-[180px] leading-relaxed">{a.warn}</td>
                      </tr>
                    )
                  })}
                  {sh.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">Noch keine Stakeholder vorhanden.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ZOO ──────────────────────────────────────────────── */}
        {tab === 'zoo' && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(Object.entries(ANIMALS) as [AnimalKey, AnimalDef][]).map(([key, a]) => (
                <div key={key} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 flex-shrink-0" style={{ background: a.bg, borderColor: a.color }}>
                      {a.emoji}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{a.name}</div>
                      <div className="text-[11px] text-slate-400">{a.full}</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">{a.desc}</p>
                  <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-2">⚠ {a.warn}</div>
                  <div className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">✓ Tipp: {a.tips[0]}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KI-Generierungs-Modal */}
      {aiModal && (
        <AiGenerateModal
          onClose={() => setAiModal(false)}
          onAdd={(generated) => {
            setSh(prev => [...prev, ...generated.map(g => ({ ...g, id: uid() }))])
            setAiModal(false)
          }}
        />
      )}

      {/* Manuelles Stakeholder-Modal */}
      {modal.open && (
        <StakeholderModal
          editData={modal.editId ? sh.find(s => s.id === modal.editId) : undefined}
          onSave={saveStakeholder}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({ s, onEdit, onDelete }: { s: Stakeholder; onEdit: () => void; onDelete: () => void }) {
  const a = ANIMALS[s.animal]
  const q = gq(s.power, s.interest)
  const qi = QUADS[q]
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Hero */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 flex-shrink-0" style={{ background: a.bg, borderColor: a.color }}>
          {a.emoji}
        </div>
        <div>
          <div className="font-bold text-slate-800">{s.name}</div>
          <div className="text-xs text-slate-400">{s.role}</div>
        </div>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-bold px-2 py-1 rounded-full border" style={{ borderColor: qi.color, color: qi.color }}>{qi.name}</span>
        <span className="text-xs font-bold px-2 py-1 rounded-full border" style={{ background: a.bg, borderColor: a.color, color: a.color }}>{a.emoji} {a.name}</span>
      </div>

      {/* Bars */}
      <div>
        <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Macht / Interesse</div>
        <div className="space-y-2">
          {[{ label: 'Macht', val: s.power, color: '#ef4444' }, { label: 'Interesse', val: s.interest, color: '#3b82f6' }].map(b => (
            <div key={b.label} className="flex items-center gap-2 text-xs">
              <span className="w-12 text-slate-400 flex-shrink-0">{b.label}</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${b.val * 10}%`, background: b.color }} />
              </div>
              <span className="w-5 text-right tabular-nums text-slate-400 text-[11px]">{b.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Animal */}
      <div>
        <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Tier-Archetypus</div>
        <div className="bg-slate-50 rounded-lg p-3 text-xs leading-relaxed">
          <span className="font-bold text-slate-700">{a.name} — {a.full}</span><br />
          <span className="text-slate-500">{a.desc}</span>
        </div>
      </div>

      {/* Warning */}
      <div>
        <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">⚠ Warnsignal</div>
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-xs text-orange-700 font-medium">{a.warn}</div>
      </div>

      {/* Tips */}
      <div>
        <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">✓ Zähmungstaktiken</div>
        <div className="space-y-2">
          {a.tips.map((t, i) => (
            <div key={i} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
              <span className="text-blue-500 flex-shrink-0 mt-0.5">→</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comms */}
      <div>
        <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Kommunikationsstrategie</div>
        <div className="bg-slate-50 rounded-lg p-3 text-xs leading-relaxed text-slate-600">
          {qi.content}<br /><br />
          <span className="text-slate-400">Kanal:</span> {qi.channel}<br />
          <span className="text-slate-400">Frequenz:</span> {qi.freq}
        </div>
      </div>

      {/* Notes */}
      {s.notes && (
        <div>
          <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Notizen</div>
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 leading-relaxed">{s.notes}</div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-slate-200">
        <button onClick={onEdit} className="flex-1 text-xs font-medium py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Bearbeiten</button>
        <button onClick={onDelete} className="text-xs font-medium px-3 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">Entfernen</button>
      </div>
    </div>
  )
}

// ── KI-Generierungs-Modal ─────────────────────────────────────────────────────

function AiGenerateModal({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (stakeholders: Omit<Stakeholder, 'id'>[]) => void
}) {
  const [context, setContext] = useState('Wir führen bei einem Automobilzulieferer (3.000 MA, 5 Werke) ein KI-Programm zur Predictive Maintenance ein. Die IT-Infrastruktur ist veraltet, der Betriebsrat ist skeptisch und der CEO hat das Budget freigegeben ohne die operative Ebene einzubinden.')
  const [count, setCount] = useState(6)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Omit<Stakeholder, 'id'>[] | null>(null)

  async function generate() {
    if (!context.trim()) return
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const res = await fetch('/api/stakeholders-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, count }),
      })
      const data = await res.json() as { stakeholders?: Omit<Stakeholder, 'id'>[]; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? 'Unbekannter Fehler')
      setPreview(data.stakeholders ?? [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2">✦ KI-Stakeholder-Generator</h2>
            <p className="text-xs text-slate-400 mt-0.5">Beschreibe dein Projekt — die KI analysiert und erstellt passende Stakeholder mit Tier-Archetypen.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Projektkontext</label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            rows={6}
            placeholder="Beschreibe dein KI-Projekt: Branche, Unternehmensgröße, Ziele, beteiligte Abteilungen, Herausforderungen…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-violet-500 resize-none leading-relaxed"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Anzahl Stakeholder — <span className="text-violet-600">{count}</span></label>
          <input type="range" min={3} max={10} value={count} onChange={e => setCount(+e.target.value)} className="w-full accent-violet-600" />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>3 (kompakt)</span>
            <span>10 (vollständig)</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
            ⚠ {error}
          </div>
        )}

        {preview && (
          <div className="space-y-2">
            <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{preview.length} Stakeholder generiert — Vorschau</div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {preview.map((s, i) => {
                const a = ANIMALS[s.animal]
                const q = gq(s.power, s.interest)
                const qi = QUADS[q]
                return (
                  <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-base border flex-shrink-0" style={{ background: a.bg, borderColor: a.color }}>
                      {a.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800">{s.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border" style={{ borderColor: qi.color, color: qi.color }}>{qi.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border" style={{ background: a.bg, borderColor: a.color, color: a.color }}>{a.name}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{s.role} · Macht {s.power}/10 · Interesse {s.interest}/10</div>
                      <div className="text-xs text-slate-500 mt-1 leading-relaxed">{s.notes}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">Abbrechen</button>
          {preview ? (
            <button onClick={() => onAdd(preview)} className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors">
              {preview.length} Stakeholder übernehmen
            </button>
          ) : (
            <button onClick={generate} disabled={!context.trim() || loading} className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2">
              {loading ? (
                <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analysiere…</>
              ) : '✦ Generieren'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function StakeholderModal({ editData, onSave, onClose }: {
  editData?: Stakeholder
  onSave: (data: Omit<Stakeholder, 'id'>) => void
  onClose: () => void
}) {
  const [name, setName] = useState(editData?.name ?? '')
  const [role, setRole] = useState(editData?.role ?? '')
  const [power, setPower] = useState(editData?.power ?? 5)
  const [interest, setInterest] = useState(editData?.interest ?? 5)
  const [animal, setAnimal] = useState<AnimalKey>(editData?.animal ?? 'hippo')
  const [notes, setNotes] = useState(editData?.notes ?? '')

  function submit() {
    if (!name.trim()) { alert('Bitte einen Namen eingeben.'); return }
    onSave({ name: name.trim(), role: role.trim(), power, interest, animal, notes: notes.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800">{editData ? 'Stakeholder bearbeiten' : 'Stakeholder hinzufügen'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Maria Schmidt"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Role / Title</label>
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="CTO, Betriebsrat, Datenschutzbeauftragte…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500" />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Power (formal + faktisch) — <span className="text-blue-600">{power}/10</span></label>
          <input type="range" min={1} max={10} value={power} onChange={e => setPower(+e.target.value)} className="w-full accent-blue-600" />
          <p className="text-[10px] text-slate-400">Tipp: Formale Hierarchie ≠ faktische Macht. Informellen Einfluss einbeziehen.</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Interest — <span className="text-blue-600">{interest}/10</span></label>
          <input type="range" min={1} max={10} value={interest} onChange={e => setInterest(+e.target.value)} className="w-full accent-blue-600" />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Animal Type — Welches Muster zeigt diese Person?</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(ANIMALS) as [AnimalKey, AnimalDef][]).map(([key, a]) => (
              <button key={key} onClick={() => setAnimal(key)}
                className={`flex items-center gap-2 text-left px-2.5 py-2 rounded-lg border text-xs transition-colors ${animal === key ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <span className="text-base">{a.emoji}</span>
                <div>
                  <div className="font-bold text-slate-700">{a.name}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{a.full}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-[11px] text-slate-500">{ANIMALS[animal].desc}</div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Faktische Macht, Beziehungen, Betroffenheit, Besonderheiten…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 resize-none" />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">Abbrechen</button>
          <button onClick={submit} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            {editData ? 'Speichern' : 'Hinzufügen'}
          </button>
        </div>
      </div>
    </div>
  )
}
