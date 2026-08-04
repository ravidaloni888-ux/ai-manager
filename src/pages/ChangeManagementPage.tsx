import { useState } from 'react'
import TheoryBlock from '../components/ui/TheoryBlock'
import ChangeDiagnoseWizard from '../components/change/ChangeDiagnoseWizard'

// ─────────────────────────────────────────────────────────────────────────
// Tag 16 · Change Management — Umgang mit Widerständen
// ─────────────────────────────────────────────────────────────────────────

// ── Drei Ursachen von Widerstand ─────────────────────────────────────────

const RESISTANCE_CAUSES = [
  {
    key: 'rational',
    icon: '🧠',
    title: 'Rational',
    motto: '„Das macht keinen Sinn."',
    ursache: 'Sachliche Einwände — oft berechtigt',
    color: 'blue',
    aussagen: ['„Das System antwortet manchmal falsch."', '„Wer haftet, wenn die KI einen Fehler macht?"', '„Das Projekt kostet mehr, als es bringt."'],
    hilft: 'Sachliche Argumentation, Daten und Pilotbelege. Wer rationalen Widerstand mit emotionalen Appellen bekämpft, verschlimmert ihn. Wer ihn ignoriert, verliert Glaubwürdigkeit.',
    beispiel: 'Die Compliance-Verantwortliche hat Sicherheitsbedenken — rational und nicht zu überwinden, sondern zu adressieren: durch Datenflussdiagramme und Auftragsverarbeitungsvertrag (AVV).',
  },
  {
    key: 'emotional',
    icon: '❤️',
    title: 'Emotional',
    motto: '„Das macht mir Angst."',
    ursache: 'Unsicherheit, Angst vor Bedeutungsverlust',
    color: 'red',
    aussagen: ['„Ich komme nicht dazu, das auszuprobieren."', '„Lass uns das erst beobachten."', '„Man weiß ja nie, was das wirklich macht."'],
    hilft: 'Empathie als handlungsfähige Strategie: aktives Zuhören, Ängste benennen (nicht wegdiskutieren), Würdigung der bisherigen Arbeit. Selten explizit — zeigt sich in passivem Verhalten und Ausweichen.',
    beispiel: 'Ein erfahrener Werkmeister sagt „Ich komme nicht dazu" — emotionaler Widerstand. Er fürchtet, sein jahrzehntelanges Expertenwissen werde durch eine Maschine ersetzt. Kein sachlicher Einwand.',
  },
  {
    key: 'politisch',
    icon: '♟️',
    title: 'Politisch',
    motto: '„Das bedroht meine Stellung."',
    ursache: 'Machtverschiebung, Ressourcen',
    color: 'purple',
    aussagen: ['„Das haben wir schon immer so gemacht."', '„Das ist IT-Aufgabe, nicht unsere."', '„Warum wurde das nicht mit uns abgestimmt?"'],
    hilft: 'Frühzeitige Einbindung. Interessen transparent machen. Gewinner und Verlierer benennen und Ausgleich anbieten — nicht verschweigen. Wird selten offen gezeigt; sachliche/emotionale Argumente dienen als Proxy.',
    beispiel: 'Ein IT-Leiter stellt einen Bedingungskatalog auf — er verteidigt seinen Bereich vor Überlastung und Haftung. Er sagt nicht „nein", setzt aber Bedingungen, die das Projekt ausbremsen.',
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
        <strong>Die meisten KI-Projekte scheitern nicht an der Technologie, sondern an der Organisation.</strong> Widerstand ist kein Störfaktor, sondern ein Signal. Er hat drei Ursachen — rational, emotional, politisch — jede braucht eine andere Antwort. Wer emotionalen Widerstand mit noch mehr Schulung bekämpft, verstärkt ihn.
      </div>

      {/* Research data */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Was die Daten sagen · McKinsey &amp; BCG 2026</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { stat: '86 %', body: 'der Führungskräfte sagen: Organisation ist nicht auf KI-Integration im Arbeitsalltag vorbereitet (McKinsey).' },
            { stat: '81 %', body: 'berichten trotz KI-Experimenten von keinem messbaren Ergebnis auf der Ergebnisrechnung (McKinsey).' },
            { stat: '5 : 1', body: 'Empfehlung: Für jeden Dollar in KI-Technologie fünf Dollar in Menschen investieren (McKinsey).' },
            { stat: '74 %', body: 'der Frontline-Mitarbeitenden nutzen KI regelmäßig (2025: 51 %) — „Silicon Ceiling" durchbrochen (BCG).' },
          ].map(s => (
            <div key={s.stat} className="flex items-start gap-3 border border-slate-100 rounded-lg px-3 py-2.5 bg-slate-50">
              <span className="text-lg font-bold text-slate-800 flex-shrink-0 w-14">{s.stat}</span>
              <span className="text-xs text-slate-600 leading-relaxed">{s.body}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <strong>Kernerkenntnis:</strong> Adoption allein erzeugt keinen Wert. Der stärkste Hebel für messbaren Impact ist das <strong>Redesign von Workflows</strong> — nicht das Deployment von Tools. Rollen, Prozesse und Managementsysteme müssen mit angepasst werden.
        </p>
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
                    <p className="text-[11px] text-slate-500">{c.ursache}</p>
                  </div>
                </div>
                <p className={`text-xs italic font-medium mt-2 ${clr.text}`}>{c.motto}</p>
              </div>
              <div className="p-4 space-y-3 flex-1">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Typische Aussagen</p>
                  <div className="space-y-1">
                    {c.aussagen.map(a => (
                      <div key={a} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className={`w-1.5 h-1.5 rounded-full ${clr.dot} flex-shrink-0 mt-1`} />
                        <span className="italic">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Was hilft</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{c.hilft}</p>
                </div>
                <div className={`rounded-lg px-3 py-2 ${clr.bg}`}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Beispiel</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{c.beispiel}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Diagnose */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-900 leading-relaxed">
        <strong>Die Diagnose entscheidet über die Strategie.</strong> Ein emotionaler Widerstand, der mit Fakten bekämpft wird, verhärtet sich. Ein rationaler Widerstand, der mit Empathie beantwortet wird, wird als Ablenkung erlebt. Erst <strong>diagnostizieren</strong>, dann handeln.
      </div>

      {/* Praxisbeispiele */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Praxisbeispiele aus der Unternehmensrealität</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border border-slate-200 rounded-lg p-4 space-y-1.5">
            <p className="text-sm font-bold text-slate-800">McKinsey · „AI Black Belts"</p>
            <p className="text-xs text-slate-500 leading-relaxed">KI-kompetente Mitarbeitende als Change-Agenten in Teams eingebettet; internes Preisprogramm auf KI-Anwendungsfälle ausgerichtet. Ergebnis: Nutzung skaliert durch <strong>Peer-Learning</strong>, nicht durch Top-down-Mandate.</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-4 space-y-1.5">
            <p className="text-sm font-bold text-slate-800">BCG · Mittelmanagement als Schlüssel</p>
            <p className="text-xs text-slate-500 leading-relaxed">Change gelingt nicht, wenn KI nur von oben mandatiert wird. <strong>Mittlere Führungskräfte müssen den Wandel vorleben</strong> — sie übersetzen Strategie in Alltagssituationen.</p>
          </div>
        </div>
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
  { title: 'Dringlichkeit erzeugen', was: 'Warum müssen wir handeln — jetzt?', beispiel: 'Projektleitung erklärt, warum Expertenwissen digitalisiert werden muss, um wettbewerbsfähig zu bleiben.' },
  { title: 'Führungskoalition aufbauen', was: 'Wer trägt die Veränderung?', beispiel: 'Steuerungskreis + angesehene Fachkraft als Brücke zur Belegschaft + Standortleiter als Botschafter.' },
  { title: 'Vision entwickeln', was: 'Wohin wollen wir — in einem Satz?', beispiel: '„Das Wissen unserer besten Leute steht weltweit zur Verfügung — und bleibt dem Unternehmen erhalten."' },
  { title: 'Vision kommunizieren', was: 'Alle, immer, konsistent.', beispiel: 'Kommunikationsplan (vgl. Tag 13).' },
  { title: 'Hindernisse beseitigen', was: 'Was blockiert konkret?', beispiel: 'Datenquellen bereinigen, Compliance-Freigabe einholen, Expertenwissen zugänglich machen.' },
  { title: 'Kurzfristige Erfolge feiern', was: 'Kleine Siege sichtbar machen.', beispiel: 'Pilotstandort liefert erste Ergebnisse — öffentlich kommunizieren, positive Rückmeldungen verbreiten.' },
  { title: 'Konsolidieren und erweitern', was: 'Auf Erfolgen aufbauen.', beispiel: 'Nach stabilem Pilot weitere Standorte einbinden.' },
  { title: 'In Kultur verankern', was: 'Veränderung wird Normalzustand.', beispiel: 'KI-System als Standard-Werkzeug etablieren, nicht als Experiment.' },
]

const LEWIN_PHASES = [
  { title: 'Unfreeze', body: 'Den Status quo destabilisieren: Warum ist der Ist-Zustand nicht haltbar?', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { title: 'Change', body: 'Den Übergang gestalten: neue Verhaltensweisen einüben, Unsicherheit begleiten.', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { title: 'Refreeze', body: 'Den neuen Zustand stabilisieren: neue Norm verankern (Standards · Prozesse · Regeln).', color: 'bg-green-50 border-green-200 text-green-700' },
]

const MODEL_COMPARISON = [
  { model: 'Kotter', stark: 'Transformativer Wandel, viele Stakeholder, Vision nötig', schwach: 'Veränderung schnell und inkrementell', color: 'text-indigo-700' },
  { model: 'ADKAR', stark: 'Fokus auf einzelne Personen/Rollen, Diagnose auf Individualebene', schwach: 'Gesamtorganisationaler Wandel ohne Personenfokus', color: 'text-orange-700' },
  { model: 'Lewin', stark: 'Schnelle Lageeinschätzung, erste Diagnose, einfache Kontexte', schwach: 'Komplexe Multi-Stakeholder-Projekte mit vielen Phasen', color: 'text-teal-700' },
]

function ModelleTab() {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 rounded-r-xl px-5 py-4 text-sm text-slate-700 leading-relaxed">
        <strong>Drei Change-Modelle — unterschiedliche Fokusebenen.</strong> Kotter (Organisation/Transformation), ADKAR (Individuum), Lewin (Team). Sie widersprechen sich nicht — sie ergänzen sich je nach Ebene.
      </div>

      {/* ADKAR interactive tool */}
      <AdkarTool />

      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-xs text-orange-800 leading-relaxed">
        <strong>ADKAR-Pointe:</strong> Wer beim skeptischen Werkmeister mit Schulung (Knowledge) beginnt, ohne das <strong>Desire</strong>-Problem gelöst zu haben, verschwendet Ressourcen. Der richtige Einstieg ist das persönliche Gespräch — das Desire-Element. <span className="text-orange-600">Prosci-Modell (Jeff Hiatt, 2006).</span>
      </div>

      {/* Theorie — bei Bedarf */}
      <TheoryBlock title="Kotter · ADKAR · Lewin im Überblick" hint="Welches Modell auf welcher Ebene ansetzt">
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
      </TheoryBlock>

      {/* Lewin */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lewin-Modell · Schnelldiagnose (Kurt Lewin, 1947)</p>
          <p className="text-xs text-slate-400 mt-1">Das älteste und einfachste Modell — am nützlichsten für erste Diagnosen: In welcher Phase stecken wir gerade? Oft steckt die erfahrene Belegschaft im Übergang zwischen Unfreeze und Change — sie hat die alte Realität noch nicht losgelassen.</p>
        </div>
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
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kotter · 8 Stufen zur Transformation (John Kotter, 1996)</p>
          <p className="text-xs text-slate-400 mt-1">Acht sequenzielle Stufen — die Reihenfolge ist entscheidend.</p>
        </div>
        <div className="space-y-2">
          {KOTTER_STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-3 border border-slate-100 rounded-lg px-3 py-2.5 bg-slate-50">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{s.title} <span className="text-xs font-normal text-slate-400">· {s.was}</span></p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.beispiel}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-xs text-red-800 leading-relaxed">
          <strong>Kotters häufigster Fehler:</strong> Stufe 1 (Dringlichkeit) überspringen und direkt mit Stufe 3 (Vision) oder Stufe 5 (Hindernisse) starten. Ohne gefühlte Dringlichkeit folgt niemand — egal wie überzeugend die Vision ist.
        </div>
      </div>

      {/* Wann welches Modell? */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 bg-slate-800 text-white">
          <p className="text-sm font-bold">Wann welches Modell?</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left py-2.5 px-4 font-semibold text-slate-500">Modell</th>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-500">Am stärksten, wenn…</th>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-500">Schwächer, wenn…</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MODEL_COMPARISON.map(m => (
                <tr key={m.model} className="hover:bg-slate-50 transition-colors">
                  <td className={`py-3 px-4 font-bold ${m.color}`}>{m.model}</td>
                  <td className="py-3 px-3 text-slate-600">{m.stark}</td>
                  <td className="py-3 px-3 text-slate-400">{m.schwach}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
          <strong>In der Praxis:</strong> Kotter für das Gesamtprojekt, ADKAR für einzelne skeptische Schlüsselpersonen, Lewin als Schnelldiagnose im Gespräch.
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
      {/* Intro */}
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 rounded-r-xl px-5 py-4 text-sm text-slate-700 leading-relaxed">
        Ein Change-Management-Plan übersetzt das Modell in <strong>Aktivitäten, Verantwortlichkeiten und Zeitrahmen</strong>. Er ist kein Masterplan, der alles vorhersagt — er ist ein Steuerungsinstrument, das regelmäßig aktualisiert wird.
      </div>

      {/* 4 Bestandteile eines Change-Plans */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 bg-slate-800 text-white">
          <p className="text-sm font-bold">Vier Bestandteile eines KI-Change-Management-Plans</p>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { nr: '1', t: 'Widerstandsdiagnose', inhalt: 'Für jeden Schlüssel-Stakeholder: welche Dimension (rational/emotional/politisch)? Intensität? Beeinflussbarkeit?', fehler: 'Alle Widerstände als emotional behandeln — dabei sind viele rational und berechtigt.' },
            { nr: '2', t: 'Kommunikationsplan', inhalt: 'Wer bekommt wann welche Botschaft — und über welchen Kanal? (aus Tag 13 übernehmen)', fehler: 'Einbahn-Kommunikation — Mitarbeitende werden informiert, nicht einbezogen.' },
            { nr: '3', t: 'Maßnahmen pro Stakeholder', inhalt: 'Konkrete Aktivitäten pro Person und Gruppe: Gespräche, Workshops, Piloteinladungen, Würdigungen.', fehler: 'Maßnahmen werden geplant, aber nie durchgeführt — weil niemand Verantwortung übernimmt.' },
            { nr: '4', t: 'KPIs und Monitoring', inhalt: 'Wie messen wir, ob der Plan wirkt? Nutzungsquoten, Feedback, Eskalationen.', fehler: 'KPIs werden definiert, aber nie gemessen — Akzeptanz bleibt eine Annahme.' },
          ].map(b => (
            <div key={b.nr} className="flex gap-3 px-5 py-3">
              <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{b.nr}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{b.t}</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{b.inhalt}</p>
                <p className="text-[11px] text-red-600 mt-1 leading-relaxed">⚠ Typischer Fehler: {b.fehler}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Story */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Die Change Story — das Fundament</p>
          <p className="text-xs text-slate-400 mt-1">McKinsey zählt die „compelling change story" zu den zwölf kritischen Erfolgsfaktoren: eine überzeugende Begründung, warum die Organisation KI einführt — und warum jetzt.</p>
        </div>
        <div className="bg-slate-50 border-l-4 border-l-slate-800 rounded-r-lg px-4 py-3">
          <p className="text-sm text-slate-700 leading-relaxed italic">
            „Unser Unternehmen hat über Jahrzehnte einzigartiges Diagnosewissen aufgebaut — in den Köpfen unserer erfahrensten Fachkräfte. Wenn die nächste Generation übernimmt und unsere Servicetechniker weltweit vor einer kritischen Störung stehen, sollen sie dieses Expertenwissen abrufen können. Unser KI-Projekt ist nicht dazu da, Erfahrung zu ersetzen — es ist dazu da, sie über die aktive Zeit der Wissensträger hinaus zu erhalten."
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
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-900 leading-relaxed">
          <strong>Wichtig:</strong> Eine Change Story ist keine Werbebotschaft. Sie muss ehrlich sein — auch über Risiken, Herausforderungen und offene Fragen. Wer sie zu glatt macht, verliert Vertrauen.
        </div>
      </div>

      {/* Change-Agenten */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Multiplikatoren &amp; Change-Agenten</p>
          <p className="text-xs text-slate-400 mt-1">Veränderung setzt sich selten durch hierarchische Anweisung durch, sondern durch überzeugte Fürsprecher — Brückenbauer zwischen Management und Belegschaft.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: '🛠️', t: 'Die angesehene Fachkraft', d: 'Erfahren, offen für Digitalisierung, genießt Vertrauen bei den Skeptikern. Nutzt sie das System aktiv und spricht darüber, zieht das andere mit.' },
            { icon: '📍', t: 'Der Standortverantwortliche', d: 'Kennt die lokalen Gegebenheiten und spricht die Sprache des Teams. Ein positiver Pilotbericht von ihm trägt mehr als jede Präsentation aus der Zentrale.' },
            { icon: '🚀', t: 'Der erste Anwender', d: '„Das hat mir bei einer echten Aufgabe geholfen." Diese enthusiastische Stimme aus der Praxis ist unersetzlich.' },
          ].map(a => (
            <div key={a.t} className="border border-slate-200 rounded-lg p-4 space-y-1.5">
              <span className="text-2xl">{a.icon}</span>
              <p className="text-sm font-bold text-slate-800">{a.t}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{a.d}</p>
            </div>
          ))}
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
  const [tab, setTab] = useState<'diagnose' | 'modelle' | 'widerstand' | 'story'>('diagnose')

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
          { id: 'diagnose',   label: '🧭 Diagnose je Person' },
          { id: 'modelle',    label: '🎯 ADKAR-Diagnose' },
          { id: 'widerstand', label: '🛡️ Widerstände' },
          { id: 'story',      label: '📖 Story & KPIs' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'diagnose' && <ChangeDiagnoseWizard />}
      {tab === 'widerstand' && <WiderstaendeTab />}
      {tab === 'modelle' && <ModelleTab />}
      {tab === 'story' && <StoryKpiTab />}
    </div>
  )
}
