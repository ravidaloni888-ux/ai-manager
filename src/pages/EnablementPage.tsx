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

// ── Tag 14 · Schulungskonzept ─────────────────────────────────────────────

const KUEBLER_ROSS = [
  { block: 'Block 1', title: 'Verleugnung', icon: '🚫', feeling: '"Das passiert mir nicht." · "Die KI wird meinen Job nicht beeinflussen."', help: 'Klare, sachliche Kommunikation. Beruhigung und Zuhören.', phase: 'stopp' },
  { block: 'Block 2', title: 'Zorn', icon: '😠', feeling: '"Warum ich?" · "Diese neue KI ist nutzlos/kompliziert."', help: 'Gefühle anerkennen. Sichere Räume für Feedback. Energie in konstruktive Maßnahmen.', phase: 'stopp' },
  { block: 'Block 3', title: 'Verhandeln', icon: '💭', feeling: '"Wenn nur…" · "Können wir nicht das alte System behalten?"', help: 'Mitarbeitende in die Entscheidungsfindung einbeziehen. Vorteile und neue Möglichkeiten aufzeigen.', phase: 'stopp' },
  { block: 'Block 4', title: 'Verhandlung', icon: '🤝', feeling: '"Wenn ich muss, dann unter diesen Bedingungen…"', help: 'Bedingungen klären · Würdigung zeigen.', phase: 'schulen' },
  { block: 'Block 5', title: 'Akzeptanz ★', icon: '😊', feeling: 'Bereitschaft zur aktiven Auseinandersetzung.', help: 'Jetzt erst schulen! Ausprobieren ermöglichen.', phase: 'jetzt' },
  { block: 'Block 6', title: 'Integration', icon: '💻', feeling: 'Aktive Nutzung · eigene Erfahrungen aufbauen.', help: 'Erfolge sichtbar machen · Peer-Learning.', phase: 'schulen' },
]

const LERNFORMATE = [
  { nr: '1', title: 'Blended Learning', staerke: 'Flexibilität + Tiefe · beste Nachhaltigkeit', einsatz: 'Service-Ingenieure Bremen: E-Learning (30 Min.) + On-the-Job + Praxis-Session' },
  { nr: '2', title: 'Microlearning', staerke: '3–7 Min. · direkt in den Arbeitsalltag integriert', einsatz: 'Internationale Agenten: 3–5 Einheiten · asynchron · Mobilgerät' },
  { nr: '3', title: 'On-the-Job-Lernen', staerke: 'Lernen während der Arbeit, nicht davor', einsatz: 'Shadow Deployment ist de facto On-the-Job-Lernen' },
  { nr: '4', title: 'Peer-Learning', staerke: 'Kolleg:innen lernen von Kolleg:innen · hohe Glaubwürdigkeit', einsatz: 'Kruse (Busan) berichtet in Bremen → mehr Wirkung als jede Präsentation' },
  { nr: '5', title: 'E-Learning / Webinar', staerke: 'Skalierbar · asynchron oder synchron', einsatz: 'Alle Standorte gleichzeitig — aber nur mit Sprachanpassung wirksam' },
]

const KIRKPATRICK = [
  { ebene: '1', title: 'Reaktion', was: 'War die Schulung gut? Hat sie gefallen?', hinweis: 'Fast immer gemessen — zu wenig.', color: 'text-slate-500', star: false },
  { ebene: '2', title: 'Lernen', was: 'Wurde Wissen aufgebaut?', hinweis: '', color: 'text-slate-500', star: false },
  { ebene: '3', title: 'Verhalten', was: 'Wird das Gelernte angewendet?', hinweis: 'Bei KI-Systemen Minimum-Standard.', color: 'text-orange-600', star: true },
  { ebene: '4', title: 'Ergebnis', was: 'Hat die Schulung den Projekterfolg unterstützt?', hinweis: '', color: 'text-slate-500', star: false },
]

const SCHULUNGSBAUSTEINE = [
  { baustein: 'Zielgruppen', was: 'Wer wird geschult? Welche Vorkenntnisse?', beispiel: '4 Gruppen · differenziert nach Aufgabe + Standort' },
  { baustein: 'Lernziele', was: 'Was können sie danach konkret tun?', beispiel: '„Service-Ingenieur kann Quellenverweis interpretieren"' },
  { baustein: 'Format', was: 'Blended · Microlearning · On-the-Job · Peer', beispiel: 'Je nach Gruppe differenziert' },
  { baustein: 'Zeitpunkt', was: 'Kübler-Ross Phase 5 abwarten', beispiel: 'Erst nach Akzeptanz — nicht bei Frust' },
  { baustein: 'Sprache', was: 'In welcher Sprache?', beispiel: 'DE · EN · KO · AR je nach Standort' },
  { baustein: 'Erfolgsmessung', was: 'Welche Kirkpatrick-Ebene?', beispiel: 'Mindestens Ebene 3 bei KI-Systemen' },
]

function SchulungskonzeptTab() {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-white border border-slate-200 border-l-4 border-l-slate-800 rounded-r-xl px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong>Lernziel Tag 14:</strong> Ein zielgruppengerechtes Schulungskonzept für ein KI-System entwickeln — differenziert nach Aufgabe, Vorkenntnissen, Sprache und emotionaler Phase.
        <span className="block mt-1 text-slate-400 text-xs">Change Management · Zielgruppen · Kirkpatrick · Art. 4 KI-VO</span>
      </div>

      {/* Hype Cycle + Konsequenz */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gartner Hype Cycle 2025 · Schulungsplanung</p>
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
          <strong>Konsequenz für Schulung:</strong> Mitarbeitende kommen nicht unvoreingenommen. Aufgabe der Schulung: Erwartungen kalibrieren, bevor Wissen vermittelt wird. Eine ehrliche Demo mit einer <em>falschen</em> Antwort zu Beginn ist wertvoller als zehn richtige.
        </div>
      </div>

      {/* Kübler-Ross */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kübler-Ross · Wann ist der richtige Schulungszeitpunkt?</p>
          <p className="text-xs text-slate-400 mt-1">Schulungen erst ab Phase 5 (Akzeptanz). Wer in Phase 3 schult, verstärkt den Widerstand.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {KUEBLER_ROSS.map(b => (
            <div key={b.block} className={`rounded-lg border p-3 space-y-1.5 ${b.phase === 'jetzt' ? 'border-orange-300 bg-orange-50' : b.phase === 'stopp' ? 'border-slate-200 bg-slate-50' : 'border-green-200 bg-green-50'}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{b.icon}</span>
                <span className="text-xs font-bold text-slate-700">{b.block}: {b.title}</span>
                {b.phase === 'jetzt' && <span className="ml-auto text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">JETZT SCHULEN</span>}
                {b.phase === 'stopp' && <span className="ml-auto text-[10px] bg-slate-300 text-slate-600 px-1.5 py-0.5 rounded-full">⏸ noch warten</span>}
              </div>
              <p className="text-[11px] text-slate-600 italic">{b.feeling}</p>
              <p className="text-[11px] text-slate-500"><span className="font-semibold">Was hilft:</span> {b.help}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fünf Lernformate */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fünf Lernformate · Wann welches?</p>
        <div className="grid grid-cols-1 gap-2">
          {LERNFORMATE.map(f => (
            <div key={f.nr} className="flex gap-3 items-start border border-slate-100 rounded-lg px-4 py-3 bg-slate-50">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{f.nr}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{f.title}</p>
                <p className="text-xs text-slate-500 mt-0.5"><span className="font-medium">Stärke:</span> {f.staerke}</p>
                <p className="text-xs text-slate-500"><span className="font-medium">Einsatz:</span> {f.einsatz}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Art. 4 KI-VO */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Art. 4 EU AI Act · KI-Kompetenz als Betreiberpflicht</p>
        <p className="text-sm text-slate-700 leading-relaxed">
          Art. 4 EU AI Act verpflichtet Betreiber, sicherzustellen, dass das Personal über ausreichende KI-Kompetenz verfügt — nicht nur technische Bedienung, sondern <strong>kritisches Urteilsvermögen.</strong>
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { title: 'Was kann das System — und was nicht?', body: 'Anwender:innen müssen die Grenzen des Systems kennen — nicht nur seine Funktionen.' },
            { title: 'Wann ist eine Antwort plausibel?', body: 'Kritisches Prüfen von Quellenverweisen und Diagnose-Vorschlägen — nicht blindes Vertrauen.' },
            { title: 'Fehler melden', body: 'Was tue ich, wenn es falsch liegt? Klarer Feedback-Kanal ist Teil der Schulungspflicht.' },
          ].map(c => (
            <div key={c.title} className="border border-slate-200 rounded-lg p-3 space-y-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide leading-snug">{c.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800">
          <strong>Forschungshinweis (Türkei-Studie 2025):</strong> Schüler mit KI-Unterstützung → +18 % bei Hausaufgaben, aber −17 % in ununterstützten Tests. KI übernimmt das Denken — kritisches Urteilen verkümmert. Schulung muss aktives Urteilsvermögen aufbauen, nicht Abhängigkeit.
        </div>
      </div>

      {/* Kirkpatrick */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kirkpatrick-Modell · Vier Ebenen der Schulungsevaluation</p>
          <p className="text-xs text-slate-400 mt-1">Kirkpatrick, D. (1959) — Evaluating Training Programs. Four Levels Model.</p>
        </div>
        <div className="space-y-2">
          {KIRKPATRICK.map(k => (
            <div key={k.ebene} className={`flex gap-3 items-start border rounded-lg px-4 py-3 ${k.star ? 'border-orange-300 bg-orange-50' : 'border-slate-100 bg-slate-50'}`}>
              <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${k.star ? 'border-orange-500 text-orange-600' : 'border-slate-300 text-slate-500'}`}>{k.ebene}</span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${k.star ? 'text-orange-700' : 'text-slate-700'}`}>{k.title} {k.star && '★'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{k.was}</p>
                {k.hinweis && <p className={`text-[11px] mt-1 font-medium ${k.star ? 'text-orange-600' : 'text-slate-400'}`}>{k.hinweis}</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="border border-orange-200 border-dashed rounded-lg px-4 py-2.5 text-xs text-orange-700 leading-relaxed">
          <strong>★ Bei KI-Systemen sollte Ebene 3 Standard sein.</strong> Wissen über kritisches Prüfen muss in Verhalten übergehen — Kirkpatrick Ebene 1 allein reicht nicht.
        </div>
      </div>

      {/* Aufbau Schulungskonzept */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 bg-slate-800 text-white">
          <p className="text-sm font-bold">Aufbau eines Schulungskonzeptes</p>
          <p className="text-xs text-slate-400 mt-0.5">Sechs Bausteine — differenziert nach Zielgruppe, Format, Zeitpunkt, Sprache und Erfolgsmessung</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left py-2.5 px-4 font-semibold text-slate-500">Baustein</th>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-500">Was es enthält</th>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-500">WellSeal-Beispiel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SCHULUNGSBAUSTEINE.map(b => (
                <tr key={b.baustein} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800">{b.baustein}</td>
                  <td className="py-3 px-3 text-slate-600">{b.was}</td>
                  <td className="py-3 px-3 text-slate-500 italic">{b.beispiel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kernbotschaften */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kernbotschaften Tag 14</p>
        <div className="space-y-2">
          {[
            { nr: '1', title: 'KI-Schulung ist Change Management', body: 'Vertrauen, Kompetenz und Sicherheit aufbauen — nicht nur Klicks erklären.' },
            { nr: '2', title: 'Kübler-Ross als Planungsrahmen', body: 'Schulungen erst ab Phase 5 (Akzeptanz). Wer in Phase 3 schult, verstärkt den Widerstand.' },
            { nr: '3', title: 'Fünf Lernformate · situationsbezogen', body: 'Blended · Microlearning · On-the-Job · Peer-Learning · E-Learning. Je nach Zielgruppe kombinieren.' },
            { nr: '4', title: 'Art. 4 KI-Verordnung', body: 'Kompetenzpflicht des Betreibers — nicht nur Bedienungsschulung: kritisches Urteilsvermögen ist gesetzliche Anforderung.' },
            { nr: '5', title: 'Kirkpatrick Ebene 3 als Minimum', body: 'Vier Evaluationsebenen: Reaktion · Lernen · Verhalten · Ergebnis. Bei KI-Systemen muss Verhalten (Ebene 3) gemessen werden.' },
          ].map(k => (
            <div key={k.nr} className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{k.nr}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 uppercase tracking-wide text-[11px]">{k.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{k.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
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
