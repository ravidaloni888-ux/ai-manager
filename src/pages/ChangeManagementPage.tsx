import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────
// Tag 16 · Change Management — Umgang mit Widerständen
// ─────────────────────────────────────────────────────────────────────────

// ── Drei Ursachen von Widerstand ─────────────────────────────────────────

const RESISTANCE_CAUSES = [
  {
    key: 'rational',
    icon: '🧠',
    title: 'Rational',
    ursache: 'Informationslücken',
    color: 'blue',
    beispiele: ['Fehlende Einführung', 'Komplexe Bedienung', 'Mangelnde Erklärbarkeit'],
    massnahmen: ['Schulungen', 'Dokumentation', 'Transparenz'],
  },
  {
    key: 'emotional',
    icon: '❤️',
    title: 'Emotional',
    ursache: 'Verlustangst',
    color: 'red',
    beispiele: ['Angst, ersetzt zu werden', 'Identitätsverlust', 'Sinnverlust'],
    massnahmen: ['Emotionen ernst nehmen', 'Desire vor Knowledge (ADKAR)'],
  },
  {
    key: 'politisch',
    icon: '♟️',
    title: 'Politisch',
    ursache: 'Machtverschiebung',
    color: 'purple',
    beispiele: ['Informationshoheit', 'Zugangsbeschränkungen', 'Koalitionen'],
    massnahmen: ['Stakeholder-Analyse', 'Machtstrukturen berücksichtigen'],
  },
]

const CAUSE_COLORS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  blue:   { border: 'border-blue-200',   bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  red:    { border: 'border-red-200',    bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
  purple: { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
}

const EMPATHY_PRINCIPLES = [
  {
    icon: '👁️',
    title: 'Perspektive verstehen',
    body: 'Nicht fragen „Was würde ich fühlen?" — sondern „Was fühlt die andere Person?"',
  },
  {
    icon: '🤝',
    title: 'Vertrauen aufbauen',
    body: 'Früh einbeziehen · Kritik zulassen · Experten ernst nehmen.',
  },
  {
    icon: '⭐',
    title: 'Motivation schaffen',
    body: 'Menschen möchten gestalten und beteiligt sein — nicht ersetzt werden.',
  },
]

function WiderstaendeTab() {
  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 rounded-r-xl px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong>Widerstand ist kein Störfaktor, sondern ein Signal.</strong> Er hat drei mögliche Ursachen — rational, emotional, politisch. Jede braucht eine andere Antwort. Wer emotionalen Widerstand mit noch mehr Schulung bekämpft, verstärkt ihn.
      </div>

      {/* Three causes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {RESISTANCE_CAUSES.map(c => {
          const clr = CAUSE_COLORS[c.color]
          return (
            <div key={c.key} className={`bg-white rounded-xl border-2 ${clr.border} overflow-hidden flex flex-col`}>
              <div className={`px-4 py-3 ${clr.bg}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${clr.text}`}>{c.title}</p>
                    <p className="text-[11px] text-slate-500">Ursache: {c.ursache}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3 flex-1">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Beispiele</p>
                  <div className="space-y-1">
                    {c.beispiele.map(b => (
                      <div key={b} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className={`w-1.5 h-1.5 rounded-full ${clr.dot} flex-shrink-0 mt-1`} />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Maßnahmen</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.massnahmen.map(m => (
                      <span key={m} className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${clr.bg} ${clr.text}`}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empathy as a tool */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Empathie als Werkzeug · Drei Prinzipien</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EMPATHY_PRINCIPLES.map(p => (
            <div key={p.title} className="border border-slate-200 rounded-lg p-4 space-y-1.5">
              <span className="text-2xl">{p.icon}</span>
              <p className="text-sm font-bold text-slate-800">{p.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reflection questions */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reflexionsfragen</p>
        <ul className="space-y-1.5">
          {[
            'Welche Widerstände kennen wir aus dem Unternehmen?',
            'Welche Muster erwarten wir bei KI?',
            'Wo haben wir selbst Widerstand erlebt?',
            'Wann wurde dieser erkannt?',
          ].map(q => (
            <li key={q} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="text-slate-400 flex-shrink-0">→</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── ADKAR-Diagnose-Tool ──────────────────────────────────────────────────

const ADKAR_STEPS = [
  {
    key: 'awareness',
    letter: 'A',
    title: 'Awareness',
    sub: 'Bewusstsein',
    frage: 'Versteht die Person, WARUM die Veränderung nötig ist?',
    fehlt: 'Widerstand aus Unwissen',
    fehltDetail: 'Ohne Bewusstsein für das Warum wirkt jede Änderung willkürlich — die Person blockiert aus Unverständnis.',
    fix: 'Change Story kommunizieren: Warum jetzt? Welche Konsequenz, wenn nichts passiert?',
  },
  {
    key: 'desire',
    letter: 'D',
    title: 'Desire',
    sub: 'Wunsch',
    frage: 'MÖCHTE die Person die Veränderung mittragen?',
    fehlt: 'Passiver Widerstand',
    fehltDetail: 'Die Person versteht das Warum, will aber nicht. Sie macht Dienst nach Vorschrift, sabotiert leise. „Desire vor Knowledge" — hier ansetzen, nicht mit Schulung.',
    fix: 'Emotionen ernst nehmen, persönlichen Nutzen zeigen, früh beteiligen, Ängste adressieren.',
  },
  {
    key: 'knowledge',
    letter: 'K',
    title: 'Knowledge',
    sub: 'Wissen',
    frage: 'WEISS die Person, wie die Veränderung funktioniert?',
    fehlt: 'Gutes Wollen ohne Erfolg',
    fehltDetail: 'Die Person will, weiß aber nicht wie. Motivation verpufft ohne konkretes Können.',
    fix: 'Schulungen, Dokumentation, konkrete Anleitungen für den Arbeitsalltag.',
  },
  {
    key: 'ability',
    letter: 'A',
    title: 'Ability',
    sub: 'Fähigkeit',
    frage: 'KANN die Person es praktisch umsetzen?',
    fehlt: 'Frustration & Rückfall',
    fehltDetail: 'Wissen im Kopf, aber Umsetzung scheitert in der Praxis. Führt zu Frust und Rückkehr zum Alten.',
    fix: 'Geführte Übungen, Coaching, Sprechstunden, Zeit zum Ausprobieren, Support.',
  },
  {
    key: 'reinforcement',
    letter: 'R',
    title: 'Reinforcement',
    sub: 'Verstärkung',
    frage: 'Wird das neue Verhalten dauerhaft STABILISIERT?',
    fehlt: 'Rückfall nach Pilotphase',
    fehltDetail: 'Anfangs läuft es, aber ohne Verankerung fällt die Organisation nach der Pilotphase ins alte Muster zurück.',
    fix: 'Erfolge sichtbar machen, Anerkennung, Standards & Prozesse verankern, Monitoring.',
  },
]

function AdkarTool() {
  const [state, setState] = useState<Record<string, boolean | null>>(
    Object.fromEntries(ADKAR_STEPS.map(s => [s.key, null]))
  )

  const set = (key: string, val: boolean) =>
    setState(s => ({ ...s, [key]: s[key] === val ? null : val }))

  const allAnswered = ADKAR_STEPS.every(s => state[s.key] !== null)
  // ADKAR: der erste fehlende Baustein ist der Barrierepunkt
  const firstGapIdx = ADKAR_STEPS.findIndex(s => state[s.key] === false)
  const firstGap = firstGapIdx >= 0 ? ADKAR_STEPS[firstGapIdx] : null

  return (
    <div className="bg-white rounded-xl border-2 border-slate-800 overflow-hidden">
      <div className="px-5 py-3 bg-slate-800 text-white">
        <p className="text-sm font-bold">🎯 ADKAR-Diagnose</p>
        <p className="text-xs text-slate-300 mt-0.5">Beantworte jeden Baustein. Der <strong>erste fehlende</strong> ist der Barrierepunkt — genau dort setzt die Maßnahme an, nicht später.</p>
      </div>

      <div className="p-5 space-y-2">
        {ADKAR_STEPS.map((s, i) => {
          const answer = state[s.key]
          const isBarrier = firstGap?.key === s.key
          const isAfterBarrier = firstGapIdx >= 0 && i > firstGapIdx
          return (
            <div key={s.key} className={`rounded-lg border p-3 transition-colors ${isBarrier ? 'border-red-400 bg-red-50' : answer === true ? 'border-green-200 bg-green-50/50' : answer === false ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200'} ${isAfterBarrier ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${answer === true ? 'bg-green-500 text-white' : answer === false ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{s.letter}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-800">{s.title}</p>
                    <span className="text-[11px] text-slate-400">{s.sub}</span>
                    {isBarrier && <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">⚠ BARRIERE</span>}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{s.frage}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => set(s.key, true)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors ${answer === true ? 'bg-green-500 text-white border-green-500' : 'text-green-700 border-green-300 hover:bg-green-50'}`}>
                    Ja
                  </button>
                  <button onClick={() => set(s.key, false)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors ${answer === false ? 'bg-red-500 text-white border-red-500' : 'text-red-700 border-red-300 hover:bg-red-50'}`}>
                    Fehlt
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Result */}
        {firstGap && (
          <div className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 space-y-2 mt-1">
            <p className="text-sm font-bold text-red-800">Barrierepunkt: {firstGap.title} fehlt → „{firstGap.fehlt}"</p>
            <p className="text-xs text-red-700 leading-relaxed">{firstGap.fehltDetail}</p>
            <div className="bg-white/70 rounded-lg px-3 py-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Hier ansetzen</p>
              <p className="text-xs text-slate-700 leading-relaxed">{firstGap.fix}</p>
            </div>
            {firstGapIdx < ADKAR_STEPS.length - 1 && (
              <p className="text-[11px] text-red-600 italic">Spätere Bausteine erst angehen, wenn dieser sitzt — sonst verpufft die Maßnahme.</p>
            )}
          </div>
        )}
        {allAnswered && !firstGap && (
          <div className="rounded-xl border-2 border-green-300 bg-green-50 px-4 py-3 mt-1">
            <p className="text-sm font-bold text-green-800">✅ Alle fünf Bausteine vorhanden</p>
            <p className="text-xs text-green-700 mt-1 leading-relaxed">Kein Barrierepunkt — die individuelle Veränderung ist tragfähig. Reinforcement dauerhaft aufrechterhalten, um Rückfall zu vermeiden.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Change-Modelle ───────────────────────────────────────────────────────

const KOTTER_STEPS = [
  'Dringlichkeit erzeugen',
  'Führungskoalition aufbauen',
  'Vision entwickeln',
  'Vision kommunizieren',
  'Hindernisse beseitigen',
  'Kurzfristige Erfolge sichern',
  'Erfolge konsolidieren',
  'Wandel verankern',
]

const LEWIN_PHASES = [
  { title: 'Unfreeze', body: 'Dringlichkeit schaffen · Veränderungsbereitschaft erzeugen.', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { title: 'Change', body: 'Pilot · Lernen · Feedback · Anpassungen.', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { title: 'Refreeze', body: 'Neue Arbeitsweisen dauerhaft etablieren: Standards · Prozesse · Regeln.', color: 'bg-green-50 border-green-200 text-green-700' },
]

function ModelleTab() {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 rounded-r-xl px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong>Drei Change-Modelle — unterschiedliche Fokusebenen.</strong> Kotter (Organisation/Transformation), ADKAR (Individuum), Lewin (Team). Sie widersprechen sich nicht — sie ergänzen sich je nach Ebene.
      </div>

      {/* Model overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { name: 'Kotter', detail: '8 Stufen', focus: 'Transformation (Organisation)', color: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
          { name: 'ADKAR', detail: 'A·D·K·A·R', focus: 'Individuelle Veränderung', color: 'border-orange-200 bg-orange-50 text-orange-700' },
          { name: 'Lewin', detail: 'Unfreeze·Change·Refreeze', focus: 'Teamveränderung', color: 'border-teal-200 bg-teal-50 text-teal-700' },
        ].map(m => (
          <div key={m.name} className={`rounded-xl border-2 p-4 ${m.color}`}>
            <p className="text-base font-bold">{m.name}</p>
            <p className="text-xs mt-0.5 opacity-80">{m.detail}</p>
            <p className="text-[11px] mt-2 font-medium">Fokus: {m.focus}</p>
          </div>
        ))}
      </div>

      {/* ADKAR interactive tool */}
      <AdkarTool />

      {/* Lewin */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lewin-Modell · Teamveränderung</p>
        <div className="flex items-stretch gap-2">
          {LEWIN_PHASES.map((p, i) => (
            <div key={p.title} className="flex items-center flex-1 gap-2">
              <div className={`flex-1 rounded-lg border p-3 ${p.color}`}>
                <p className="text-sm font-bold">{p.title}</p>
                <p className="text-xs mt-1 opacity-80 leading-relaxed">{p.body}</p>
              </div>
              {i < LEWIN_PHASES.length - 1 && (
                <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kotter */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kotter · 8 Schritte zur Transformation</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {KOTTER_STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3 border border-slate-100 rounded-lg px-3 py-2 bg-slate-50">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="text-sm text-slate-700">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Change Story & KPIs ──────────────────────────────────────────────────

const CHANGE_KPIS = [
  { icon: '📊', title: 'Nutzungsquote', misst: 'Tatsächliche Nutzung', grenzwert: 'Unter 30 % nach 4 Wochen → Intervention', color: 'border-blue-200' },
  { icon: '⚠️', title: 'Fehler & Eskalationen', misst: 'Praxistauglichkeit', grenzwert: 'Häufung zeigt fehlende Reife', color: 'border-amber-200' },
  { icon: '💬', title: 'Feedbackqualität', misst: 'Akzeptanz oder Widerstand', grenzwert: 'Tonfall & Inhalt beobachten', color: 'border-teal-200' },
  { icon: '❤️', title: 'Pulse Check', misst: 'Stimmung im Unternehmen', grenzwert: 'Monatlich & anonym durchführen', color: 'border-purple-200' },
]

function StoryKpiTab() {
  return (
    <div className="space-y-5">
      {/* Change Story */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Die Change Story</p>
        <div className="bg-slate-50 border-l-4 border-l-slate-800 rounded-r-lg px-4 py-3">
          <p className="text-sm text-slate-700 leading-relaxed">
            <strong>WellSeal möchte</strong> Erfahrungswissen sichern, das Wissen erfahrener Ingenieure bewahren — <strong>und Menschen nicht ersetzen.</strong>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Eine gute Change Story beantwortet</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { q: 'Warum?', d: 'Der Grund für die Veränderung — nachvollziehbar und ehrlich.' },
              { q: 'Welche Risiken gibt es?', d: 'Offen benannt, nicht schöngeredet.' },
              { q: 'Welche Rolle habe ich?', d: 'Jede:r Mitarbeitende sieht den eigenen Platz im Wandel.' },
            ].map(x => (
              <div key={x.q} className="border border-slate-200 rounded-lg p-3">
                <p className="text-sm font-bold text-slate-800">{x.q}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">KPIs für Change Management</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CHANGE_KPIS.map(k => (
            <div key={k.title} className={`border-2 ${k.color} rounded-xl p-4 space-y-1.5`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{k.icon}</span>
                <p className="text-sm font-bold text-slate-800">{k.title}</p>
              </div>
              <p className="text-xs text-slate-600"><span className="font-semibold">Misst:</span> {k.misst}</p>
              <p className="text-[11px] text-slate-500 bg-slate-50 rounded px-2 py-1">{k.grenzwert}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function ChangeManagementPage() {
  const [tab, setTab] = useState<'widerstand' | 'modelle' | 'story'>('widerstand')

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-4">
        <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-1">KI-Beauftragte:r · Tag 16</p>
        <h1 className="text-2xl font-bold text-slate-800">Change Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Umgang mit Widerständen — Ursachen, Modelle, Change Story &amp; KPIs
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {([
          { id: 'widerstand', label: '🛡️ Widerstände' },
          { id: 'modelle',    label: '🎯 Change-Modelle' },
          { id: 'story',      label: '📖 Story & KPIs' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'widerstand' && <WiderstaendeTab />}
      {tab === 'modelle' && <ModelleTab />}
      {tab === 'story' && <StoryKpiTab />}
    </div>
  )
}
