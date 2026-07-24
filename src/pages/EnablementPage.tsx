import { useEffect, useState } from 'react'
import { useEnablementStore } from '../store/enablementStore'
import { useAuthStore } from '../store/authStore'
import { TRAINING_TOPICS, DEPARTMENTS, TrainingTopicKey, TrainingStatus, EnablementData } from '../types'

const TOPIC_CLR: Record<string, { border: string; badge: string; badgeText: string }> = {
  blue:   { border: 'border-l-blue-500',   badge: 'bg-blue-100',   badgeText: 'text-blue-700' },
  indigo: { border: 'border-l-indigo-500', badge: 'bg-indigo-100', badgeText: 'text-indigo-700' },
  red:    { border: 'border-l-red-500',    badge: 'bg-red-100',    badgeText: 'text-red-700' },
  amber:  { border: 'border-l-amber-500',  badge: 'bg-amber-100',  badgeText: 'text-amber-700' },
  green:  { border: 'border-l-green-500',  badge: 'bg-green-100',  badgeText: 'text-green-700' },
  orange: { border: 'border-l-orange-500', badge: 'bg-orange-100', badgeText: 'text-orange-700' },
  purple: { border: 'border-l-purple-500', badge: 'bg-purple-100', badgeText: 'text-purple-700' },
}

function statusSelectCls(s: TrainingStatus) {
  if (s === 'done')    return 'bg-green-100 text-green-700 font-semibold'
  if (s === 'planned') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-50 text-slate-400'
}

function getStatus(data: EnablementData, dept: string, key: TrainingTopicKey): TrainingStatus {
  return data.trainingMap[dept]?.[key] ?? 'open'
}

function computeStats(data: EnablementData) {
  const total = DEPARTMENTS.length * TRAINING_TOPICS.length
  let done = 0, topicsFull = 0, deptsFull = 0
  for (const dept of DEPARTMENTS) {
    const d = TRAINING_TOPICS.filter(t => getStatus(data, dept, t.key) === 'done').length
    if (d === TRAINING_TOPICS.length) deptsFull++
    done += d
  }
  for (const t of TRAINING_TOPICS) {
    if (DEPARTMENTS.every(d => getStatus(data, d, t.key) === 'done')) topicsFull++
  }
  return { pct: Math.round(done / total * 100), done, total, topicsFull, deptsFull }
}

// ── ISO 42001 §7.2 / §7.3 / A.2.2 Training panel ─────────────────────────

const ISO_TRAINING_REQUIREMENTS = [
  {
    clause: '§7.2',
    title: 'Competence',
    description: 'The organisation must determine the competencies required for roles affecting AI system performance, ensure people have those competencies (via training or other means), and retain documented evidence of competence.',
    check: (stats: ReturnType<typeof computeStats>) => stats.pct >= 50,
    status: (stats: ReturnType<typeof computeStats>) =>
      stats.pct >= 80 ? 'Compliant' :
      stats.pct >= 50 ? 'Partially met' : 'Gap identified',
    detail: (stats: ReturnType<typeof computeStats>) =>
      stats.pct < 50
        ? `Only ${stats.pct}% of training completed — ISO 42001 §7.2 requires documented evidence of competence for all roles involved in AI system operation and oversight.`
        : stats.pct < 80
        ? `${stats.pct}% complete — continue building documented training evidence for all departments.`
        : `${stats.pct}% complete — ensure training records are documented and retained as evidence.`,
  },
  {
    clause: '§7.3',
    title: 'Awareness',
    description: 'All persons doing work under the organisation\'s control must be aware of the AI policy, their contribution to AIMS effectiveness, and the implications of not conforming to requirements.',
    check: (stats: ReturnType<typeof computeStats>) => stats.deptsFull >= 1,
    status: (stats: ReturnType<typeof computeStats>) =>
      stats.deptsFull >= 5 ? 'Compliant' :
      stats.deptsFull >= 1 ? 'In progress' : 'Not started',
    detail: (stats: ReturnType<typeof computeStats>) =>
      `${stats.deptsFull} of ${9} departments have completed all awareness topics. AI policy, governance and compliance topics must be covered for all departments.`,
  },
  {
    clause: '§7.4',
    title: 'Communication',
    description: 'The organisation must determine what to communicate about the AIMS internally and externally, including AI-related risks and policies. Regular AI training sessions serve as the primary internal communication mechanism.',
    check: (stats: ReturnType<typeof computeStats>) => stats.topicsFull >= 2,
    status: (stats: ReturnType<typeof computeStats>) =>
      stats.topicsFull >= 5 ? 'Compliant' :
      stats.topicsFull >= 2 ? 'In progress' : 'Not started',
    detail: (stats: ReturnType<typeof computeStats>) =>
      `${stats.topicsFull} of 7 topics completed across all departments. Each training topic also serves as an internal communication touchpoint for AI awareness.`,
  },
  {
    clause: 'A.2.2',
    title: 'AI Knowledge & Training (Annex A)',
    description: 'Annex A control A.2.2 requires the organisation to provide AI-specific training to relevant personnel — covering AI fundamentals, data handling, risk awareness, regulatory requirements (EU AI Act), and responsible use.',
    check: (_stats: ReturnType<typeof computeStats>, data: EnablementData) => {
      const keyTopics: TrainingTopicKey[] = ['fundamentals', 'compliance', 'data_safety']
      return keyTopics.every((key) =>
        DEPARTMENTS.some((dept) => data.trainingMap[dept]?.[key] === 'done')
      )
    },
    status: (_stats: ReturnType<typeof computeStats>, data: EnablementData) => {
      const keyTopics: TrainingTopicKey[] = ['fundamentals', 'compliance', 'data_safety']
      const done = keyTopics.filter((key) =>
        DEPARTMENTS.some((dept) => data.trainingMap[dept]?.[key] === 'done')
      ).length
      return done === keyTopics.length ? 'Compliant' : done > 0 ? 'In progress' : 'Not started'
    },
    detail: (_stats: ReturnType<typeof computeStats>, data: EnablementData) => {
      const keyTopics: TrainingTopicKey[] = ['fundamentals', 'compliance', 'data_safety']
      const missing = keyTopics.filter((key) =>
        !DEPARTMENTS.some((dept) => data.trainingMap[dept]?.[key] === 'done')
      )
      return missing.length > 0
        ? `Core topics not yet completed in any department: ${missing.join(', ')} — these are explicitly required by Annex A.2.2.`
        : 'All three mandatory Annex A.2.2 topics (Fundamentals, Data Safety, Compliance) are completed in at least one department.'
    },
  },
]

function Iso42001TrainingPanel({
  stats,
  data,
}: {
  stats: ReturnType<typeof computeStats>
  data: EnablementData
}) {
  const [open, setOpen] = useState(false)

  const passed = ISO_TRAINING_REQUIREMENTS.filter((r) =>
    r.check(stats, data)
  ).length

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">ISO 42001 · Training & Competence Requirements</p>
            <p className="text-xs text-slate-500 mt-0.5">§7.2 Competence · §7.3 Awareness · §7.4 Communication · Annex A.2.2</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            passed === ISO_TRAINING_REQUIREMENTS.length ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {passed}/{ISO_TRAINING_REQUIREMENTS.length} met
          </span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          <div className="px-5 py-3 bg-indigo-50">
            <p className="text-xs text-indigo-700 leading-relaxed">
              <span className="font-semibold">ISO 42001:2023 §7</span> requires organisations to determine, provide, and document AI-related competencies. Training completion in this matrix serves as documented evidence for §7.2 compliance. Annex A.2.2 mandates specific AI knowledge topics for personnel involved in AI system development and operation.
            </p>
          </div>

          {ISO_TRAINING_REQUIREMENTS.map((req) => {
            const ok     = req.check(stats, data)
            const status = req.status(stats, data)
            const detail = req.detail(stats, data)
            const statusColor =
              status === 'Compliant'       ? 'bg-green-100 text-green-700' :
              status === 'Partially met' || status === 'In progress' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'

            return (
              <div key={req.clause} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  {ok ? (
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{req.clause}</span>
                    <p className="text-xs font-semibold text-slate-700">{req.title}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{status}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{req.description}</p>
                  <p className={`text-[10px] font-medium ${ok ? 'text-green-600' : 'text-amber-600'}`}>
                    {ok ? '✓' : '⚠'} {detail}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── Tag 14 · Adoption Path & Schulungskonzept ─────────────────────────────

const ADOPTION_BLOCKS = [
  {
    nr: 1,
    title: 'Schock / Leugnung',
    quote: '"Das brauchen wir nicht."',
    icon: '😶',
    colorKey: 'red',
    verhalten: ['Ablehnung, Vermeidung', 'Angst vor Jobverlust', '"Das ist nichts für mich."'],
    ziel: 'Aufmerksamkeit erzeugen, Veränderung real und relevant machen.',
    wasTun: ['Klare Kommunikation: Warum jetzt? Was ändert sich – was bleibt?', 'Fakten statt Hype: Realistisches Bild (inkl. Grenzen).', 'Betroffene zu Wort kommen lassen (Ängste sammeln).'],
    wasHilft: ['Persönliche Ansprache.', 'Transparenz über Ziele & Auswirkungen.', 'FAQ zu Jobs, Sicherheit, Datenschutz.'],
    verantwortlich: 'Kommunikation + Change Lead · Linienführungskräfte',
    schulungFreigabe: false,
    lernformate: [],
    qualityGate: {
      pruefe: ['Awareness & Grundverständnis', 'Emotionale Ablehnung'],
      kriterien: ['≥ 70 % können in eigenen Worten erklären, warum das Projekt gestartet wurde.', 'Anteil starker Ablehnung < 40 %.'],
      methode: 'Pulse Survey · Kurzquiz · Feedbackrunden',
      fallback: 'Persönliche Gespräche intensivieren, Führungskräfte aktiv einbinden, FAQ zu Jobs & Sicherheit erweitern.',
    },
  },
  {
    nr: 2,
    title: 'Widerstand',
    quote: '"Das macht nur mehr Arbeit."',
    icon: '😠',
    colorKey: 'orange',
    verhalten: ['Kritik, Jammern', 'Fokus auf Probleme', 'Verbreitung negativer Botschaften'],
    ziel: 'Kritik ernst nehmen, Vertrauen aufbauen, Nutzen greifbar machen.',
    wasTun: ['Kritikformate (z. B. Dialogrunden).', 'Nutzenbeispiele aus der Praxis, Quick Wins sichtbar machen.', 'Botschafter aus dem Team gewinnen.', 'Kleine Entscheidungen mitbetreffen lassen.'],
    wasHilft: ['Offene Q&A mit Führung.', '"Stimmen aus der Praxis".', 'Nutzen-Kalkulation für den Arbeitsalltag.', 'Ängste ernst nehmen, nicht wegreden.'],
    verantwortlich: 'Change Lead + Führung · Botschafter',
    schulungFreigabe: false,
    lernformate: ['Peer-Learning (Botschafter-Berichte)', 'Microlearning (Nutzen-Demos, 3–5 Min.)'],
    qualityGate: {
      pruefe: ['Kritikniveau', 'Vertrauen in das Projekt'],
      kriterien: ['≥ 60 % sehen mindestens einen persönlichen Nutzen.', 'Anteil "kritisch/negativ" < 30 %.', 'Teilnahme an Dialogformaten ≥ 50 %.'],
      methode: 'Pulse Survey · Teilnahmequote · Feedbackprotokolle',
      fallback: 'Ursachenanalyse: Welche Einwände dominieren? Führungskräfte aktiv einbinden, Nutzen-Cases konkretisieren.',
    },
  },
  {
    nr: 3,
    title: 'Ausprobieren',
    quote: '"Vielleicht ist da ja doch was."',
    icon: '🤔',
    colorKey: 'amber',
    verhalten: ['Erste Neugier', 'Testet zögerlich', 'Fragt nach Nutzen'],
    ziel: 'Positive Erfahrungen ermöglichen, Hürden abbauen, Nutzen bestätigen.',
    wasTun: ['Hands-on Demos & Use Cases.', 'Sicherer Testraum anbieten.', 'Mikro-Piloten mit echten Nutzenden.', 'Individuelle Unterstützung (Coaching, Sprechstunden).', 'Erfolge öffentlich machen.'],
    wasHilft: ['Geführte Übungen.', 'Erfolgserlebnisse in der Realarbeit.', 'Zeit zum Ausprobieren.', 'Einfacher Zugang & Support.'],
    verantwortlich: 'Führung + Trainer · Anwender-Coaches',
    schulungFreigabe: false,
    lernformate: ['On-the-Job-Lernen (Shadow Deployment)', 'Peer-Learning (erste Erfolgsgeschichten)', 'Microlearning (kurze Praxis-Einheiten)'],
    qualityGate: {
      pruefe: ['Nutzungserfahrung', 'Erste Erfolge'],
      kriterien: ['≥ 50 % haben das System mind. 1× im Test genutzt.', '≥ 50 % berichten von mind. einem nützlichen Ergebnis.', 'Weiterempfehlungsbereitschaft (NPS) ≥ 0.'],
      methode: 'Nutzungsdaten · Umfrage · Kurzinterviews',
      fallback: 'Kein Nutzen erkennbar → Use Cases anpassen, einfachere Aufgaben zuerst, technische Hürden prüfen.',
    },
  },
  {
    nr: 4,
    title: 'Akzeptanz',
    quote: '"Ich nutze es – es hilft mir."',
    icon: '😊',
    colorKey: 'green',
    verhalten: ['Sieht Nutzen', 'Nutzt aktiv', 'Empfiehlt weiter'],
    ziel: 'Erfolg verankern, Kompetenzen vertiefen, andere mitnehmen.',
    wasTun: ['Schulungen & Deep Dives starten.', 'Best Practices teilen.', 'Anwender-Community aufbauen.', 'Feedback in Systemverbesserung einfließen lassen.'],
    wasHilft: ['Anerkennung & Sichtbarkeit.', 'Weiterbildungsangebote.', 'Mitgestalten ermöglichen.', 'Erfolg messen & feiern.'],
    verantwortlich: 'Führung + L&D · Community Lead',
    schulungFreigabe: true,
    lernformate: ['Blended Learning (E-Learning + On-the-Job + Praxis)', 'E-Learning / Webinar (skalierbar, mit Sprachanpassung)', 'Peer-Learning (Anwender-Community)', 'On-the-Job-Lernen'],
    qualityGate: {
      pruefe: ['Akzeptanz & Bereitschaft', 'Motivation'],
      kriterien: ['Akzeptanzindex ≥ 70 %.', '≥ 70 % wollen das System regelmäßig nutzen.', 'Keine offene Ablehnung in der Gruppe.'],
      methode: 'Akzeptanz-Umfrage · Führungseinschätzung',
      fallback: 'Akzeptanzindex < 50 % nach Woche 3 → Ursachenanalyse & Maßnahmen nachsteuern. Eskalation an Führungskräfte.',
    },
  },
]

type AdoptionBlock = typeof ADOPTION_BLOCKS[0]

const BLOCK_COLORS: Record<string, { bg: string; border: string; activeBorder: string; dot: string; text: string; badge: string; light: string }> = {
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    activeBorder: 'border-red-500',    dot: 'bg-red-500',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',    light: 'bg-red-50' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', activeBorder: 'border-orange-500', dot: 'bg-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', light: 'bg-orange-50' },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  activeBorder: 'border-amber-500',  dot: 'bg-amber-500',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700',  light: 'bg-amber-50' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  activeBorder: 'border-green-500',  dot: 'bg-green-500',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700',  light: 'bg-green-50' },
}

function AdoptionPathTool() {
  const { data, setAdoptionPhase } = useEnablementStore()
  const currentPhase = data.adoptionPhase ?? 0
  const [activeBlock, setActiveBlock] = useState(currentPhase)
  const [detailTab, setDetailTab] = useState<'overview' | 'gate' | 'formate'>('overview')
  const [gateOpen, setGateOpen] = useState(false)
  const b: AdoptionBlock = ADOPTION_BLOCKS[activeBlock]
  const c = BLOCK_COLORS[b.colorKey]

  return (
    <div className="space-y-4">
      {/* Journey bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Adoption Path · Kübler-Ross</p>
        <div className="flex items-stretch gap-1">
          {ADOPTION_BLOCKS.map((blk, i) => {
            const bc = BLOCK_COLORS[blk.colorKey]
            const isActive = i === activeBlock
            return (
              <div key={blk.nr} className="flex items-center flex-1 gap-1">
                <button
                  onClick={() => { setActiveBlock(i); setDetailTab('overview'); setGateOpen(false) }}
                  className={`flex-1 rounded-lg border-2 p-3 text-left transition-all ${isActive ? `${bc.activeBorder} ${bc.bg} shadow-sm` : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{blk.icon}</span>
                    {i === currentPhase && <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold ml-auto">📍 Aktuell</span>}
                    {blk.schulungFreigabe && i !== currentPhase && <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold ml-auto">▶ SCHULUNG</span>}
                  </div>
                  <p className={`text-[10px] font-bold ${isActive ? bc.text : 'text-slate-500'}`}>Block {blk.nr}</p>
                  <p className={`text-xs font-semibold leading-snug mt-0.5 ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>{blk.title}</p>
                  <p className="text-[10px] text-slate-400 mt-1 italic leading-snug">{blk.quote}</p>
                </button>
                {i < ADOPTION_BLOCKS.length - 1 && (
                  <svg className="w-3 h-3 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>
        <div className={`mt-3 flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${ADOPTION_BLOCKS[activeBlock].schulungFreigabe ? 'text-green-700 bg-green-50 border border-green-200' : 'text-slate-400 bg-slate-50'}`}>
          <span className="text-base">{ADOPTION_BLOCKS[activeBlock].schulungFreigabe ? '✅' : '⏸'}</span>
          <span className="flex-1">
            {ADOPTION_BLOCKS[activeBlock].schulungFreigabe
              ? <><strong>Schulungsfreigabe:</strong> Quality Gate erfüllt — jetzt strukturierte Schulungen starten.</>
              : 'Noch keine Schulungsfreigabe in dieser Phase — zuerst Akzeptanz herstellen.'}
          </span>
          {activeBlock !== currentPhase && (
            <button
              onClick={() => setAdoptionPhase(activeBlock)}
              className="flex-shrink-0 text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-500 transition-colors"
            >
              📍 Als aktuell setzen
            </button>
          )}
          {activeBlock === currentPhase && (
            <span className="flex-shrink-0 text-[10px] font-bold text-blue-600">📍 Aktuelle Phase</span>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className={`bg-white rounded-xl border-2 ${c.activeBorder} overflow-hidden`}>
        {/* Sub-tabs */}
        <div className="flex border-b border-slate-100">
          {(['overview', 'gate', 'formate'] as const).map(t => (
            <button key={t} onClick={() => setDetailTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${detailTab === t ? `${c.bg} ${c.text}` : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
              {t === 'overview' ? '📋 Maßnahmen' : t === 'gate' ? '🔒 Quality Gate' : '📚 Lernformate'}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Overview tab */}
          {detailTab === 'overview' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Typisches Verhalten</p>
                  <div className="space-y-1">
                    {b.verhalten.map(v => (
                      <div key={v} className={`flex items-start gap-2 text-xs px-2 py-1.5 rounded ${c.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0 mt-1`} />
                        <span className="text-slate-700">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Ziel dieser Phase</p>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 rounded-lg px-3 py-2">{b.ziel}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Verantwortlich</p>
                  <p className={`text-xs font-medium px-2 py-1 rounded ${c.badge}`}>{b.verantwortlich}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Was wir tun</p>
                  <div className="space-y-1">
                    {b.wasTun.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className={`text-[10px] font-bold ${c.text} flex-shrink-0 mt-0.5`}>{i + 1}.</span>
                        <span className="text-slate-700 leading-relaxed">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Was hilft (konkret)</p>
                  <div className="space-y-1">
                    {b.wasHilft.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-slate-400 flex-shrink-0">→</span>
                        <span className="text-slate-700 leading-relaxed">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quality Gate tab */}
          {detailTab === 'gate' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">Quality Gate — wann darf Block {b.nr + 1 <= 4 ? b.nr + 1 : '✓'} starten?</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {b.nr < 4 ? `Alle Kriterien müssen erfüllt sein, bevor Block ${b.nr + 1} startet.` : 'Alle Kriterien erfüllt → strukturierte Schulungen freigegeben.'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Wir prüfen…</p>
                  <div className="space-y-1.5">
                    {b.qualityGate.pruefe.map(p => (
                      <div key={p} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${c.badge}`}>{p}</div>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-3 mb-1.5">Datenquelle / Methode</p>
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{b.qualityGate.methode}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Entscheidungskriterien</p>
                  <div className="space-y-2">
                    {b.qualityGate.kriterien.map((k, i) => (
                      <div key={i} className="flex items-start gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-white">
                        <span className="text-green-500 flex-shrink-0 font-bold text-sm">✓</span>
                        <span className="text-xs text-slate-700 leading-relaxed">{k}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide">⚠ Fallback — wenn Kriterien nicht erfüllt</p>
                <p className="text-xs text-red-700 leading-relaxed">{b.qualityGate.fallback}</p>
              </div>
            </div>
          )}

          {/* Lernformate tab */}
          {detailTab === 'formate' && (
            <div className="space-y-3">
              {b.schulungFreigabe === false && b.lernformate.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-2xl mb-2">⏸</p>
                  <p className="text-sm font-medium">Keine Schulungsformate in dieser Phase.</p>
                  <p className="text-xs mt-1">Erst kommunizieren, dann schulen. Jetzt sind Dialogformate gefragt.</p>
                </div>
              )}
              {b.lernformate.length > 0 && (
                <>
                  <p className="text-xs text-slate-500">
                    {b.schulungFreigabe
                      ? 'Schulungsfreigabe erteilt — diese Formate jetzt einsetzen:'
                      : 'Bereits sinnvoll in dieser Phase — noch kein Schulungsprogramm, aber:'}
                  </p>
                  <div className="space-y-2">
                    {b.lernformate.map((f, i) => (
                      <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${c.border} ${c.bg}`}>
                        <span className={`w-6 h-6 rounded-full ${c.dot} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>{i + 1}</span>
                        <p className={`text-sm font-semibold ${c.text}`}>{f}</p>
                      </div>
                    ))}
                  </div>
                  {b.schulungFreigabe && (
                    <div className="mt-2 border-t border-slate-100 pt-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Kirkpatrick-Ziel für diese Schulungen</p>
                      <div className="flex gap-2">
                        {['1 · Reaktion', '2 · Lernen', '3 · Verhalten ★', '4 · Ergebnis'].map((e, i) => (
                          <div key={i} className={`flex-1 text-center text-[10px] px-2 py-1.5 rounded-lg border font-medium ${i === 2 ? 'bg-orange-100 border-orange-300 text-orange-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{e}</div>
                        ))}
                      </div>
                      <p className="text-[10px] text-orange-600 mt-1.5 font-medium">★ Ebene 3 (Verhalten) ist Minimum-Standard bei KI-Systemen (Art. 4 KI-VO).</p>
                    </div>
                  )}
                </>
              )}
              {/* Alle 5 Formate */}
              <div className="mt-2 border-t border-slate-100 pt-3">
                <button onClick={() => setGateOpen(v => !v)} className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  <svg className={`w-3 h-3 transition-transform ${gateOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  ALLE 5 LERNFORMATE IM ÜBERBLICK
                </button>
                {gateOpen && (
                  <div className="mt-2 space-y-1.5">
                    {[
                      { n: '1', t: 'Blended Learning', s: 'Flexibilität + Tiefe · beste Nachhaltigkeit', e: 'E-Learning (30 Min.) + On-the-Job + Praxis' },
                      { n: '2', t: 'Microlearning', s: '3–7 Min. · direkt in den Alltag', e: 'Internationale Teams · asynchron · Mobilgerät' },
                      { n: '3', t: 'On-the-Job-Lernen', s: 'Lernen während der Arbeit', e: 'Shadow Deployment = de facto On-the-Job' },
                      { n: '4', t: 'Peer-Learning', s: 'Kolleg:innen → hohe Glaubwürdigkeit', e: 'Kruse (Busan) berichtet in Bremen' },
                      { n: '5', t: 'E-Learning / Webinar', s: 'Skalierbar · synchron oder asynchron', e: 'Alle Standorte — nur mit Sprachanpassung wirksam' },
                    ].map(f => (
                      <div key={f.n} className="flex gap-2 items-start text-xs bg-slate-50 rounded-lg px-3 py-2">
                        <span className="w-4 h-4 rounded-full bg-slate-300 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{f.n}</span>
                        <div><span className="font-semibold text-slate-700">{f.t}</span> — <span className="text-slate-500">{f.s}</span><br /><span className="text-slate-400">{f.e}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Art. 4 + Schulungsbausteine */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Art. 4 EU AI Act · Betreiberpflicht</p>
          <p className="text-xs text-slate-600 leading-relaxed">KI-Kompetenz = nicht nur Bedienung, sondern <strong>kritisches Urteilsvermögen</strong> — was kann das System, wann ist eine Antwort plausibel, wie werden Fehler gemeldet?</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
            <strong>Türkei-Studie 2025:</strong> KI-Nutzung → +18 % bei Hausaufgaben, −17 % in ununterstützten Tests. Schulung muss Urteilsvermögen aufbauen, nicht Abhängigkeit.
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-800 text-white">
            <p className="text-xs font-bold">Schulungskonzept · 6 Bausteine</p>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { b: 'Zielgruppen', e: '4 Gruppen · Aufgabe + Standort' },
              { b: 'Lernziele', e: 'Konkrete Fähigkeit danach' },
              { b: 'Format', e: 'Blended · Micro · On-the-Job · Peer' },
              { b: 'Zeitpunkt', e: 'Erst nach Akzeptanz (Block 4)' },
              { b: 'Sprache', e: 'DE · EN · KO · AR je Standort' },
              { b: 'Erfolgsmessung', e: 'Kirkpatrick Ebene 3 Minimum' },
            ].map(r => (
              <div key={r.b} className="flex items-center gap-3 px-4 py-2">
                <span className="text-xs font-semibold text-slate-700 w-28 flex-shrink-0">{r.b}</span>
                <span className="text-xs text-slate-400">{r.e}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SchulungskonzeptTab() {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-white border border-slate-200 border-l-4 border-l-slate-800 rounded-r-xl px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong>Lernziel Tag 14:</strong> Ein zielgruppengerechtes Schulungskonzept entwickeln — differenziert nach Aufgabe, Vorkenntnissen, Sprache und emotionaler Phase.
        <span className="block mt-1 text-slate-400 text-xs">Change Management · Kübler-Ross · Lernformate · Kirkpatrick · Art. 4 KI-VO</span>
      </div>

      {/* Hype Cycle */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gartner Hype Cycle 2025 · Konsequenz für Schulungsplanung</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'KI-Agenten + KI-Ready Data', where: 'Gipfel der überzogenen Erwartungen', color: 'border-red-200 bg-red-50 text-red-700' },
            { label: 'Generative KI (allgemein)', where: 'Tal der Enttäuschungen', color: 'border-amber-200 bg-amber-50 text-amber-700' },
            { label: 'RAG-Systeme', where: 'Pfad der Erleuchtung', color: 'border-green-200 bg-green-50 text-green-700' },
          ].map(c => (
            <div key={c.label} className={`rounded-lg border p-3 ${c.color}`}>
              <p className="text-xs font-bold">{c.label}</p>
              <p className="text-xs mt-1 opacity-80">{c.where}</p>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-800 leading-relaxed">
          <strong>Konsequenz:</strong> Mitarbeitende kommen nicht unvoreingenommen. Erwartungen zuerst kalibrieren — eine ehrliche Demo mit einer <em>falschen</em> Antwort zu Beginn ist wertvoller als zehn richtige.
        </div>
      </div>

      {/* Interactive Adoption Path Tool */}
      <AdoptionPathTool />
    </div>
  )
}

export default function EnablementPage() {
  const [tab, setTab] = useState<'map' | 'library' | 'konzept'>('map')
  const { data, loading, saving, init, setStatus, save } = useEnablementStore()
  const user = useAuthStore(s => s.user)

  useEffect(() => { init() }, [init])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stats = computeStats(data)

  return (
    <div className="px-6 py-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Enablement & Coaching</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Step 4 · Train employees — 7 core topics from the AI deployment framework
          </p>
        </div>
        {tab === 'map' && user && (
          <button
            onClick={save}
            disabled={saving}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>

      {/* KPIs */}
      {tab === 'map' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Overall Readiness</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">{stats.pct}%</span>
              <span className="text-xs text-slate-400 mb-1">{stats.done}/{stats.total} trainings</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${stats.pct}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Topics Complete</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {stats.topicsFull}<span className="text-base font-normal text-slate-400">/{TRAINING_TOPICS.length}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">completed across all departments</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Departments Fully Trained</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {stats.deptsFull}<span className="text-base font-normal text-slate-400">/{DEPARTMENTS.length}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">all 7 topics completed</p>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['map', 'library', 'konzept'] as const).map(key => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {key === 'map' ? 'Training Map' : key === 'library' ? 'Topic Library' : '📚 Schulungskonzept'}
          </button>
        ))}
      </div>

      {/* ISO 42001 Training Requirements */}
      {tab === 'map' && <Iso42001TrainingPanel stats={stats} data={data} />}

      {/* Training Map */}
      {tab === 'map' && (
        <div className="bg-white rounded-xl border border-slate-200">
          {!user && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 rounded-t-xl">
              Read only — sign in to update training status.
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 border-b border-slate-100 min-w-[130px]">
                    Department
                  </th>
                  {TRAINING_TOPICS.map(t => {
                    const clr = TOPIC_CLR[t.color]
                    return (
                      <th key={t.key} className="text-center px-2 py-3 border-b border-slate-100 min-w-[84px]">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${clr.badge} ${clr.badgeText}`}>
                          {t.short}
                        </span>
                      </th>
                    )
                  })}
                  <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 border-b border-slate-100 min-w-[88px]">
                    % Done
                  </th>
                </tr>
              </thead>
              <tbody>
                {DEPARTMENTS.map((dept, di) => {
                  const deptDone = TRAINING_TOPICS.filter(t => getStatus(data, dept, t.key) === 'done').length
                  const deptPct = Math.round(deptDone / TRAINING_TOPICS.length * 100)
                  const rowBg = di % 2 === 0 ? '#fff' : '#fafafa'
                  return (
                    <tr key={dept}>
                      <td className="sticky left-0 z-10 px-4 py-2 font-medium text-slate-700 border-b border-slate-50 text-sm" style={{ background: rowBg }}>
                        {dept}
                      </td>
                      {TRAINING_TOPICS.map(topic => {
                        const s = getStatus(data, dept, topic.key)
                        return (
                          <td key={topic.key} className="px-1 py-1 border-b border-slate-50" style={{ background: rowBg }}>
                            <select
                              value={s}
                              disabled={!user}
                              onChange={e => setStatus(dept, topic.key, e.target.value as TrainingStatus)}
                              className={`w-full text-xs rounded px-1.5 py-1 border-0 cursor-pointer outline-none transition-all ${statusSelectCls(s)} ${!user ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              <option value="open">— Open</option>
                              <option value="planned">⏳ Planned</option>
                              <option value="done">✓ Done</option>
                            </select>
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 border-b border-slate-50" style={{ background: rowBg }}>
                        <div className="flex items-center gap-1.5 justify-end">
                          <div className="w-10 bg-slate-100 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${deptPct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 w-8 text-right">{deptPct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="sticky left-0 z-10 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide border-t border-slate-200">
                    % Done
                  </td>
                  {TRAINING_TOPICS.map(t => {
                    const done = DEPARTMENTS.filter(d => getStatus(data, d, t.key) === 'done').length
                    const pct = Math.round(done / DEPARTMENTS.length * 100)
                    return (
                      <td key={t.key} className="text-center px-1 py-2.5 bg-slate-50 border-t border-slate-200">
                        <span className={`text-xs font-semibold ${pct === 100 ? 'text-green-600' : pct > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                          {pct}%
                        </span>
                      </td>
                    )
                  })}
                  <td className="bg-slate-50 border-t border-slate-200" />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">— Open</span></span>
            <span className="flex items-center gap-1.5"><span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px]">⏳ Planned</span></span>
            <span className="flex items-center gap-1.5"><span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">✓ Done</span></span>
            {user && <span className="ml-auto">Click a cell to set the training status</span>}
          </div>
        </div>
      )}

      {/* Schulungskonzept */}
      {tab === 'konzept' && <SchulungskonzeptTab />}

      {/* Topic Library */}
      {tab === 'library' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {TRAINING_TOPICS.map((topic, i) => {
            const clr = TOPIC_CLR[topic.color]
            return (
              <div key={topic.key} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${clr.border} p-5 space-y-3 flex flex-col`}>
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full ${clr.badge} ${clr.badgeText} text-xs font-bold flex items-center justify-center`}>
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">{topic.label}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{topic.description}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">👥 {topic.audience}</span>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">⏱ {topic.duration}</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-300 uppercase tracking-wide">Source: velpTEC K7.0069 · Strategic Planning</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
