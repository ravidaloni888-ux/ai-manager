import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { scopedGet, scopedSet } from '../../lib/mandantData'
import { getMandantType } from '../../store/mandantStore'
import { useProfil } from '../../store/mandantProfil'

// ─────────────────────────────────────────────────────────────────────────
// Change-Diagnose je Schlüsselperson oder Gruppe.
//
// Zwei Fragen entscheiden über die Maßnahme: WORAN es hakt (ADKAR-Barriere)
// und WIE der Widerstand auftritt (rational, emotional, politisch). Wer die
// Dimension verwechselt, greift falsch ein — emotionaler Widerstand, mit
// Fakten bekämpft, verhärtet sich. Deshalb nennt das Ergebnis immer auch,
// was hier gerade nicht hilft.
// ─────────────────────────────────────────────────────────────────────────

type Dimension = 'rational' | 'emotional' | 'politisch'
type Barriere  = 'awareness' | 'desire' | 'knowledge' | 'ability' | 'reinforcement'
type Einfluss  = 'hoch' | 'mittel' | 'gering'
type Betroffen = 'stark' | 'teilweise' | 'kaum'

interface Antworten {
  dimension?: Dimension
  barriere?: Barriere
  einfluss?: Einfluss
  betroffen?: Betroffen
}

interface Diagnose extends Antworten {
  id: string
  person: string
  erstelltAm: string
}

const DIMENSION_INFO: Record<Dimension, { icon: string; titel: string; kern: string; ton: string }> = {
  rational: {
    icon: '🧠', titel: 'Rational', kern: 'Sachlicher Einwand — oft berechtigt',
    ton: 'border-blue-300 bg-blue-50',
  },
  emotional: {
    icon: '❤️', titel: 'Emotional', kern: 'Angst vor Bedeutungs- oder Kontrollverlust',
    ton: 'border-red-300 bg-red-50',
  },
  politisch: {
    icon: '♟️', titel: 'Politisch', kern: 'Sorge um Stellung, Ressourcen, Zuständigkeit',
    ton: 'border-purple-300 bg-purple-50',
  },
}

const BARRIERE_INFO: Record<Barriere, { buchstabe: string; titel: string; fehlt: string }> = {
  awareness:     { buchstabe: 'A', titel: 'Awareness',     fehlt: 'Das Warum ist nicht angekommen' },
  desire:        { buchstabe: 'D', titel: 'Desire',        fehlt: 'Das Wollen fehlt' },
  knowledge:     { buchstabe: 'K', titel: 'Knowledge',     fehlt: 'Das Wissen fehlt' },
  ability:       { buchstabe: 'A', titel: 'Ability',       fehlt: 'Die Umsetzung im Alltag gelingt nicht' },
  reinforcement: { buchstabe: 'R', titel: 'Reinforcement', fehlt: 'Es fällt in alte Muster zurück' },
}

/** Was zu tun ist — bestimmt von der Barriere, im Ton der Dimension. */
const MASSNAHMEN: Record<Barriere, Record<Dimension, string[]>> = {
  awareness: {
    rational: [
      'Ausgangslage mit Zahlen zeigen: Was kostet der heutige Zustand konkret?',
      'Belegen, was passiert, wenn nichts geschieht — Frist, Wettbewerb, Rechtslage',
      'Quellen offenlegen, damit die Person selbst nachrechnen kann',
    ],
    emotional: [
      'Persönliches Gespräch vor der offiziellen Ankündigung — nicht per Rundmail erfahren lassen',
      'Klar sagen, was gleich bleibt. Unsicherheit entsteht aus dem Ungesagten',
      'Die bisherige Arbeit ausdrücklich würdigen, bevor über Änderung gesprochen wird',
    ],
    politisch: [
      'Vor der Entscheidung einbinden, nicht danach informieren',
      'Offenlegen, wer entschieden hat und auf welcher Grundlage',
      'Die eigene Rolle im Vorhaben früh benennen',
    ],
  },
  desire: {
    rational: [
      'Den Nutzen für genau diese Rolle beziffern — nicht für „das Unternehmen"',
      'Einwände sammeln und schriftlich beantworten, auch die unbequemen',
      'Einen begrenzten Piloten anbieten, dessen Ergebnis wirklich zählt',
    ],
    emotional: [
      'Zuhören ohne zu widerlegen. Die Sorge benennen dürfen, bevor sie entkräftet wird',
      'Sicherheit geben, wo sie ehrlich gegeben werden kann — etwa zur Stellensicherheit',
      'Kolleginnen und Kollegen berichten lassen statt der Projektleitung',
    ],
    politisch: [
      'Die künftige Rolle konkret definieren — Unklarheit wird als Abstieg gelesen',
      'Gestaltungsspielraum abgeben: bei etwas mitentscheiden lassen, das wirklich offen ist',
      'Gesichtsverlust vermeiden — Kurswechsel als gemeinsame Erkenntnis darstellen',
    ],
  },
  knowledge: {
    rational: ['Schulung mit fachlicher Tiefe und belegbaren Quellen'],
    emotional: ['Schulung in kleiner, geschützter Runde — Fehler dürfen dort passieren'],
    politisch: ['Schulung nicht als Nachhilfe inszenieren; Rolle als Multiplikator anbieten'],
  },
  ability: {
    rational: ['Übung am echten Fall, mit messbarem Vorher-Nachher'],
    emotional: ['Feste Ansprechperson für die ersten Wochen — niemand steht allein da'],
    politisch: ['Erfolge sichtbar dieser Person zuschreiben, nicht dem Projekt'],
  },
  reinforcement: {
    rational: ['Kennzahl vereinbaren und regelmäßig zurückspiegeln'],
    emotional: ['Anerkennung aussprechen, sichtbar und namentlich'],
    politisch: ['Die Person als Fürsprecher im Führungskreis auftreten lassen'],
  },
}

/** Der häufigste Fehlgriff je Lage — genauso wichtig wie die Maßnahme. */
function warnung(a: Antworten): string | null {
  if (!a.dimension || !a.barriere) return null
  if (a.dimension === 'emotional' && (a.barriere === 'awareness' || a.barriere === 'desire')) {
    return 'Jetzt keine Zahlen und Argumente. Emotionaler Widerstand, mit Fakten bekämpft, verhärtet sich — die Person fühlt sich nicht gehört und begründet ihre Ablehnung anschließend sachlich weiter.'
  }
  if (a.dimension === 'politisch' && (a.barriere === 'knowledge' || a.barriere === 'ability')) {
    return 'Vorsicht: Wenn jemand seine Stellung bedroht sieht, wirkt ein Schulungsangebot entwertend — es unterstellt ein Können-Problem, wo ein Macht-Problem liegt. Erst die Rolle klären.'
  }
  if (a.dimension === 'politisch') {
    return 'Politischer Widerstand wird selten offen gezeigt. Rechnen Sie damit, dass sachliche Einwände vorgeschoben werden — diese zu widerlegen löst nichts.'
  }
  if (a.dimension === 'rational') {
    return 'Nicht mit Begeisterung oder Appellen antworten. Rationale Einwände sind oft berechtigt; wer sie übergeht, verliert Glaubwürdigkeit auch bei den Zustimmenden.'
  }
  return null
}

const SCHULUNG_HILFT: Barriere[] = ['knowledge', 'ability']

function prioritaet(a: Antworten): { stufe: 'hoch' | 'mittel' | 'niedrig'; text: string; ton: string } {
  const e = a.einfluss, b = a.betroffen
  if (e === 'hoch' && (b === 'stark' || b === 'teilweise')) {
    return { stufe: 'hoch', text: 'Zuerst angehen — hoher Einfluss trifft auf spürbare Betroffenheit. Diese Person kippt die Stimmung im Umfeld.', ton: 'border-red-300 bg-red-50 text-red-800' }
  }
  if (e === 'hoch') {
    return { stufe: 'mittel', text: 'Einflussreich, aber kaum selbst betroffen — als Fürsprecher gewinnen, nicht als Betroffenen behandeln.', ton: 'border-amber-300 bg-amber-50 text-amber-800' }
  }
  if (b === 'stark') {
    return { stufe: 'mittel', text: 'Stark betroffen bei geringerem Einfluss — hier entscheidet sich, ob die Einführung im Alltag trägt.', ton: 'border-amber-300 bg-amber-50 text-amber-800' }
  }
  return { stufe: 'niedrig', text: 'Im Blick behalten, aber nicht vorziehen. Kräfte auf die einflussreichen und stark betroffenen Personen bündeln.', ton: 'border-slate-200 bg-slate-50 text-slate-700' }
}

const BUCKET = 'changediagnose'

// ── Fragen ───────────────────────────────────────────────────────────────

interface Frage {
  id: keyof Antworten
  frage: string
  hinweis?: string
  optionen: { wert: string; label: string; sub?: string }[]
}

const FRAGEN: Frage[] = [
  {
    id: 'dimension',
    frage: 'Wie äußert sich der Widerstand?',
    hinweis: 'Am ehesten an den Sätzen erkennbar, die tatsächlich fallen.',
    optionen: [
      { wert: 'rational',  label: '„Das ergibt keinen Sinn."',       sub: 'Sachliche Einwände: Fehlerquote, Haftung, Kosten' },
      { wert: 'emotional', label: '„Ich komme nicht dazu."',          sub: 'Ausweichen, Vertagen, passives Verhalten' },
      { wert: 'politisch', label: '„Warum wurde das nicht abgestimmt?"', sub: 'Zuständigkeit, Bedingungen, Verfahrensfragen' },
    ],
  },
  {
    id: 'barriere',
    frage: 'Woran hakt es zuerst?',
    hinweis: 'Der erste fehlende Baustein zählt — spätere anzugehen wirkt nicht.',
    optionen: [
      { wert: 'awareness',     label: 'Versteht das Warum nicht',        sub: 'hält die Änderung für willkürlich' },
      { wert: 'desire',        label: 'Versteht es, will aber nicht',    sub: 'kein erkennbarer Vorteil für sich' },
      { wert: 'knowledge',     label: 'Will, weiß aber nicht wie',       sub: 'fehlendes Wissen' },
      { wert: 'ability',       label: 'Weiß es, schafft es aber nicht',  sub: 'im Alltag scheitert die Umsetzung' },
      { wert: 'reinforcement', label: 'Fällt in alte Muster zurück',     sub: 'Anfangserfolg hält nicht' },
    ],
  },
  {
    id: 'einfluss',
    frage: 'Wie groß ist der Einfluss dieser Person im Umfeld?',
    hinweis: 'Gemeint ist die tatsächliche Wirkung auf andere, nicht die Hierarchiestufe.',
    optionen: [
      { wert: 'hoch',   label: 'Hoch',   sub: 'prägt die Meinung anderer spürbar' },
      { wert: 'mittel', label: 'Mittel', sub: 'wird im eigenen Team gehört' },
      { wert: 'gering', label: 'Gering', sub: 'wirkt kaum über sich hinaus' },
    ],
  },
  {
    id: 'betroffen',
    frage: 'Wie stark verändert sich die tägliche Arbeit dieser Person?',
    optionen: [
      { wert: 'stark',     label: 'Stark',     sub: 'Aufgaben oder Rolle ändern sich merklich' },
      { wert: 'teilweise', label: 'Teilweise', sub: 'einzelne Abläufe ändern sich' },
      { wert: 'kaum',      label: 'Kaum',      sub: 'arbeitet weitgehend wie bisher' },
    ],
  },
]

// ── Komponente ───────────────────────────────────────────────────────────

export default function ChangeDiagnoseWizard() {
  const navigate = useNavigate()
  const profil = useProfil()

  const [person, setPerson] = useState('')
  const [antworten, setAntworten] = useState<Antworten>({})
  const [pos, setPos] = useState(-1) // -1 = Name
  const [fertig, setFertig] = useState(false)
  const [gespeichert, setGespeichert] = useState<Diagnose[]>([])

  const speicherbar = getMandantType() !== 'demo'

  useEffect(() => { setGespeichert(scopedGet<Diagnose[]>(BUCKET, [])) }, [])

  const frage = pos >= 0 ? FRAGEN[pos] : null

  const antworte = (wert: string) => {
    setAntworten({ ...antworten, [frage!.id]: wert } as Antworten)
    if (pos + 1 < FRAGEN.length) setPos(pos + 1)
    else setFertig(true)
  }

  const zurueck = () => {
    if (fertig) { setFertig(false); setPos(FRAGEN.length - 1); return }
    setPos(pos - 1)
  }

  const neu = () => { setPerson(''); setAntworten({}); setPos(-1); setFertig(false) }

  const sichern = () => {
    const eintrag: Diagnose = { ...antworten, id: nanoid(), person: person.trim() || 'Ohne Namen', erstelltAm: new Date().toISOString() }
    const next = [...gespeichert, eintrag]
    setGespeichert(next)
    if (speicherbar) scopedSet(BUCKET, next)
    neu()
  }

  const entfernen = (id: string) => {
    const next = gespeichert.filter((g) => g.id !== id)
    setGespeichert(next)
    if (speicherbar) scopedSet(BUCKET, next)
  }

  const dim = antworten.dimension
  const bar = antworten.barriere
  const massnahmen = dim && bar ? MASSNAHMEN[bar][dim] : []
  const warn = warnung(antworten)
  const prio = prioritaet(antworten)
  const schulungSinnvoll = bar ? SCHULUNG_HILFT.includes(bar) : false

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Change-Diagnose je Person</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Vier Fragen — daraus ergibt sich, was zu tun ist, was gerade schadet und wie dringend es ist.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        {pos === -1 && !fertig && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Um wen geht es? <span className="font-normal text-slate-400">(Person oder Gruppe)</span>
              </label>
              <input
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && person.trim()) setPos(0) }}
                placeholder="z. B. Werkstattleitung oder Frau Berger, Einkauf"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                autoFocus
              />
            </div>
            <button type="button" disabled={!person.trim()} onClick={() => setPos(0)}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors">
              Diagnose starten →
            </button>
          </>
        )}

        {frage && !fertig && (
          <>
            <div className="flex items-center gap-1.5">
              {FRAGEN.map((f, i) => (
                <div key={f.id} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    antworten[f.id] ? 'bg-green-500 text-white'
                    : i === pos ? 'bg-blue-600 text-white'
                    : 'border-2 border-slate-300 bg-white text-slate-400'
                  }`}>
                    {antworten[f.id] ? '✓' : i + 1}
                  </div>
                  {i < FRAGEN.length - 1 && <div className="h-px w-4 bg-slate-200" />}
                </div>
              ))}
              <span className="text-[11px] text-slate-400 ml-2 truncate">{person}</span>
            </div>

            <div>
              <p className="text-base font-semibold text-slate-800 leading-snug">{frage.frage}</p>
              {frage.hinweis && <p className="text-xs text-slate-500 mt-1">{frage.hinweis}</p>}
            </div>

            <div className="space-y-2">
              {frage.optionen.map((o) => {
                const gewaehlt = antworten[frage.id] === o.wert
                return (
                  <button key={o.wert} type="button" onClick={() => antworte(o.wert)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      gewaehlt ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}>
                    <span className="block text-sm font-semibold">{o.label}</span>
                    {o.sub && (
                      <span className={`block text-[11px] mt-0.5 ${gewaehlt ? 'text-slate-300' : 'text-slate-500'}`}>{o.sub}</span>
                    )}
                  </button>
                )
              })}
            </div>

            <button type="button" onClick={zurueck}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700">
              ← Zurück
            </button>
          </>
        )}

        {fertig && dim && bar && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Diagnose</p>
                <p className="text-lg font-bold text-slate-800">{person}</p>
              </div>
              <button type="button" onClick={neu}
                className="text-xs text-slate-400 hover:text-slate-600 underline flex-shrink-0">
                Neu starten
              </button>
            </div>

            {/* Befund */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className={`rounded-xl border px-4 py-3 ${DIMENSION_INFO[dim].ton}`}>
                <p className="text-xs font-bold text-slate-700">
                  {DIMENSION_INFO[dim].icon} Widerstand: {DIMENSION_INFO[dim].titel}
                </p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{DIMENSION_INFO[dim].kern}</p>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold text-slate-700">
                  Barriere: {BARRIERE_INFO[bar].titel} ({BARRIERE_INFO[bar].buchstabe})
                </p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{BARRIERE_INFO[bar].fehlt}</p>
              </div>
            </div>

            {/* Priorität */}
            <div className={`rounded-xl border px-4 py-3 ${prio.ton}`}>
              <p className="text-xs font-bold">Dringlichkeit: {prio.stufe}</p>
              <p className="text-[11px] mt-1 leading-relaxed">{prio.text}</p>
            </div>

            {/* Was tun */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Das hilft jetzt</p>
              <div className="space-y-1.5">
                {massnahmen.map((m) => (
                  <div key={m} className="flex items-start gap-2 border-l-2 border-green-400 bg-green-50/60 rounded-r-lg px-3 py-2">
                    <span className="text-green-600 text-xs mt-0.5 flex-shrink-0">✓</span>
                    <p className="text-[12px] text-slate-700 leading-relaxed">{m}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Was schadet */}
            {warn && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Das schadet gerade</p>
                <div className="border-l-2 border-red-400 bg-red-50 rounded-r-lg px-3 py-2">
                  <p className="text-[12px] text-red-900 leading-relaxed">{warn}</p>
                </div>
              </div>
            )}

            {/* Brücke zur Schulung */}
            <div className={`rounded-lg border px-3 py-2.5 ${schulungSinnvoll ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
              {schulungSinnvoll ? (
                <>
                  <p className="text-[11px] font-bold text-blue-900">Schulung greift hier</p>
                  <p className="text-[11px] text-blue-900 mt-1 leading-relaxed">
                    Bei fehlendem Wissen oder Können ist Schulung das richtige Mittel.
                  </p>
                  <button type="button" onClick={() => navigate('/enablement')}
                    className="mt-2 text-[11px] font-semibold text-blue-700 hover:text-blue-600 underline">
                    Bedarf ermitteln unter Schulung &amp; Coaching →
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-bold text-slate-700">Schulung wäre hier verfrüht</p>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Solange das Warum oder das Wollen fehlt, verpufft jede Schulung — im schlechteren Fall
                    verstärkt sie den Frust. Erst {bar === 'reinforcement' ? 'das Dranbleiben sichern' : 'diese Barriere lösen'},
                    dann schulen.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={zurueck}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                ← Antwort ändern
              </button>
              <button type="button" onClick={sichern}
                className="ml-auto text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                Diagnose sichern ✓
              </button>
            </div>
            {!speicherbar && (
              <p className="text-[10px] text-slate-400">Im Demo-Mandanten wird nichts dauerhaft gespeichert.</p>
            )}
          </>
        )}
      </div>

      {/* Bisherige Diagnosen */}
      {gespeichert.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Diagnosen · {gespeichert.length}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {gespeichert.map((g) => {
              const p = prioritaet(g)
              return (
                <div key={g.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    p.stufe === 'hoch' ? 'bg-red-500' : p.stufe === 'mittel' ? 'bg-amber-500' : 'bg-slate-300'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{g.person}</p>
                    <p className="text-[11px] text-slate-400">
                      {g.dimension && DIMENSION_INFO[g.dimension].titel} · Barriere {g.barriere && BARRIERE_INFO[g.barriere].titel} · Dringlichkeit {p.stufe}
                    </p>
                  </div>
                  <button type="button" onClick={() => entfernen(g.id)}
                    className="text-slate-300 hover:text-red-500 text-xs flex-shrink-0">
                    Entfernen
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {profil.betriebsrat && !gespeichert.some((g) => /betriebsrat|gremium/i.test(g.person)) && (
        <p className="text-[11px] text-slate-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          Für dieses Mandat ist ein Betriebsrat hinterlegt — er gehört als eigene Diagnose in die Liste.
          Politischer Widerstand des Gremiums bleibt sonst bis zur Verhandlung unsichtbar.
        </p>
      )}
    </div>
  )
}
