import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMandantStore } from '../store/mandantStore'
import { useProfilStore } from '../store/mandantProfil'
import type { MandantProfil } from '../store/mandantProfil'
import { StepId, ALL_STEP_IDS } from '../store/wizardStore'
import { scopedSet } from '../lib/mandantData'
import { useUseCasesStore } from '../store/useCasesStore'
import { useWizardStore } from '../store/wizardStore'
import { STEPS } from './StartPage'

// ─────────────────────────────────────────────────────────────────────────
// Interview beim Anlegen einer Firma.
//
// Es wird nicht vorab ein Umfang gewählt — gefragt wird nach der Lage, und
// die Arbeitsliste wächst mit jeder Antwort. Folgefragen erscheinen nur,
// wenn sie nach dem bisher Gesagten überhaupt Sinn ergeben.
//
// Ergebnis sind ausschliesslich Arbeitsschritte und Häkchen. Referenz- und
// Wissensinhalte bleiben draussen; die gibt es im Demo-Mandanten.
// ─────────────────────────────────────────────────────────────────────────

type Antworten = Record<string, string>

interface Option {
  wert: string
  label: string
  /** Schritte, die diese Antwort in die Liste holt */
  steps?: StepId[]
  /** Schritte, die durch diese Antwort schon erledigt sind */
  erledigt?: StepId[]
  /** Angaben, die ins Mandanten-Profil wandern */
  profil?: Partial<MandantProfil>
}

interface Frage {
  id: string
  /** Kurzname für die Sprungleiste — die ganze Frage passt dort nicht */
  kurz: string
  frage: string
  hinweis?: string
  optionen: Option[]
  /** Frage nur stellen, wenn das zutrifft */
  wenn?: (a: Antworten) => boolean
}

const hatFaelle = (a: Antworten) => a.bestand === 'ja' || a.geplant === 'ja'

const FRAGEN: Frage[] = [
  // ── Lage ──
  {
    id: 'bestand',
    kurz: 'KI im Einsatz',
    frage: 'Setzt die Firma heute schon KI ein?',
    hinweis: 'Auch eingekaufte Werkzeuge zählen — Copilot, Chatbots, KI-Funktionen in bestehender Software.',
    optionen: [
      { wert: 'ja',      label: 'Ja, im Einsatz',      steps: ['usecases', 'eu-act', 'project-plan'] },
      { wert: 'unklar',  label: 'Weiss ich nicht',     steps: ['usecases', 'eu-act', 'project-plan'] },
      { wert: 'nein',    label: 'Nein, noch nichts' },
    ],
  },
  {
    id: 'geplant',
    kurz: 'Vorhaben geplant',
    frage: 'Sind neue KI-Vorhaben geplant oder in Prüfung?',
    optionen: [
      { wert: 'ja',   label: 'Ja', steps: ['usecases', 'data-quality', 'score'] },
      { wert: 'nein', label: 'Nein' },
    ],
  },
  {
    id: 'hochrisiko',
    kurz: 'Sensibler Bereich',
    frage: 'Betrifft eines der Systeme einen sensiblen Bereich?',
    hinweis: 'Personalauswahl, Kreditvergabe, Medizin, Bildung, kritische Infrastruktur, Strafverfolgung.',
    wenn: hatFaelle,
    optionen: [
      { wert: 'ja',     label: 'Ja',            steps: ['risks', 'data-integrity'] },
      { wert: 'unklar', label: 'Muss ich prüfen', steps: ['risks'] },
      { wert: 'nein',   label: 'Nein' },
    ],
  },

  // ── Rahmen ──
  {
    id: 'rolle',
    kurz: 'Rolle nach AI Act',
    frage: 'Welche Rolle nimmt die Firma nach EU AI Act ein?',
    hinweis: 'Anbieter entwickeln oder vertreiben KI unter eigenem Namen, Betreiber setzen sie nur ein.',
    optionen: [
      { wert: 'betreiber', label: 'Betreiber — setzt KI ein',            profil: { rolle: 'betreiber' } },
      { wert: 'anbieter',  label: 'Anbieter — entwickelt/vertreibt KI',  profil: { rolle: 'anbieter' } },
    ],
  },
  {
    id: 'iso',
    kurz: 'ISO 42001',
    frage: 'Wird eine ISO-42001-Zertifizierung angestrebt?',
    optionen: [
      { wert: 'ja',      label: 'Ja',                 profil: { iso42001: 'ja' },      steps: ['governance', 'roles'] },
      { wert: 'nein',    label: 'Nein',               profil: { iso42001: 'nein' } },
      { wert: 'spaeter', label: 'Später entscheiden', profil: { iso42001: 'spaeter' } },
    ],
  },
  {
    id: 'betriebsrat',
    kurz: 'Betriebsrat',
    frage: 'Gibt es einen Betriebsrat?',
    hinweis: 'Bei KI am Arbeitsplatz ist er nach §87 BetrVG mitbestimmungspflichtig.',
    optionen: [
      { wert: 'ja',   label: 'Ja',   profil: { betriebsrat: true },  steps: ['stakeholders'] },
      { wert: 'nein', label: 'Nein', profil: { betriebsrat: false } },
    ],
  },
  {
    id: 'branche',
    kurz: 'Branche',
    frage: 'In welcher Branche ist die Firma tätig?',
    optionen: [
      { wert: 'sonstige',    label: 'Sonstige',         profil: { branche: 'sonstige' } },
      { wert: 'medizin',     label: 'Medizin',          profil: { branche: 'medizin' } },
      { wert: 'finanzen',    label: 'Finanzen',         profil: { branche: 'finanzen' } },
      { wert: 'oeffentlich', label: 'Öffentliche Hand', profil: { branche: 'oeffentlich' } },
    ],
  },

  // ── Was existiert schon ──
  {
    id: 'strategie',
    kurz: 'Strategie / Vision',
    frage: 'Gibt es eine schriftliche KI-Strategie oder Vision?',
    hinweis: 'Daran hängt die ganze strategische Grundlage — Standortbestimmung, Zielbild, Lücke und Schwerpunkte.',
    optionen: [
      // Auch wenn die Vision steht, fehlen meist die Schritte davor und danach:
      // eine dokumentierte SWOT und eine Lücke, die gegen den Anspruch gerechnet ist.
      { wert: 'ja',      label: 'Ja, liegt vor',        steps: ['vision'], erledigt: ['vision'] },
      { wert: 'nein',    label: 'Nein, wird gebraucht', steps: ['vision'] },
      { wert: 'unnoetig', label: 'Nicht Teil des Auftrags' },
    ],
  },
  {
    id: 'reifegrad',
    kurz: 'Reifegrad',
    frage: 'Ist bekannt, wo die Firma bei Daten, Kompetenzen und Werkzeugen steht?',
    optionen: [
      { wert: 'ja',      label: 'Ja, eingeschätzt',     steps: ['maturity'], erledigt: ['maturity'] },
      { wert: 'nein',    label: 'Nein, muss erhoben werden', steps: ['maturity'] },
      { wert: 'unnoetig', label: 'Nicht Teil des Auftrags' },
    ],
  },
  {
    id: 'richtlinie',
    kurz: 'KI-Richtlinie',
    frage: 'Gibt es eine verbindliche KI-Richtlinie im Haus?',
    optionen: [
      { wert: 'ja',      label: 'Ja, liegt vor',        steps: ['governance'], erledigt: ['governance'] },
      { wert: 'nein',    label: 'Nein, wird gebraucht', steps: ['governance'] },
      { wert: 'unnoetig', label: 'Nicht Teil des Auftrags' },
    ],
  },
  {
    id: 'rollen',
    kurz: 'Verantwortliche',
    frage: 'Ist benannt, wer für KI verantwortlich ist?',
    hinweis: 'KI-Beauftragte:r, Datenschutzbeauftragte:r, Data Owner in den Fachbereichen.',
    optionen: [
      { wert: 'ja',      label: 'Ja, benannt',           steps: ['roles'], erledigt: ['roles'] },
      { wert: 'nein',    label: 'Nein, muss geklärt werden', steps: ['roles'] },
      { wert: 'unnoetig', label: 'Nicht Teil des Auftrags' },
    ],
  },

  // ── Was ansteht ──
  {
    id: 'abnahme',
    kurz: 'Abnahmekriterien',
    frage: 'Sind für die Vorhaben Abnahmekriterien festgelegt?',
    hinweis: 'Messbare Schwellenwerte, ab denen ein System als gut genug gilt.',
    wenn: (a) => a.geplant === 'ja',
    optionen: [
      { wert: 'ja',   label: 'Ja, festgelegt',   steps: ['qa'], erledigt: ['qa'] },
      { wert: 'nein', label: 'Nein, noch offen', steps: ['qa'] },
    ],
  },
  {
    id: 'budget',
    kurz: 'Budget',
    frage: 'Steht eine Budget- oder Investitionsentscheidung an?',
    wenn: hatFaelle,
    optionen: [
      { wert: 'ja',   label: 'Ja', steps: ['roi', 'roadmap'] },
      { wert: 'nein', label: 'Nein' },
    ],
  },
  {
    id: 'einfuehrung',
    kurz: 'Einführung',
    frage: 'Steht die Einführung bei den Mitarbeitenden bevor?',
    hinweis: 'Rollout, Schulungsbedarf oder spürbare Vorbehalte im Team.',
    wenn: hatFaelle,
    optionen: [
      { wert: 'ja',      label: 'Ja',                   steps: ['change', 'enablement'] },
      { wert: 'spaeter', label: 'Erst später',          steps: ['enablement'] },
      { wert: 'nein',    label: 'Nein' },
    ],
  },
]

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'

/** Welche Fragen sind nach dem bisher Gesagten überhaupt zu stellen? */
function sichtbareFragen(a: Antworten): Frage[] {
  return FRAGEN.filter((f) => !f.wenn || f.wenn(a))
}

/** Umfang, erledigte Schritte und Profil aus den Antworten ableiten. */
function ableiten(a: Antworten) {
  const steps = new Set<StepId>()
  const erledigt = new Set<StepId>()
  let profil: MandantProfil = {}

  for (const f of sichtbareFragen(a)) {
    const opt = f.optionen.find((o) => o.wert === a[f.id])
    if (!opt) continue
    opt.steps?.forEach((s) => steps.add(s))
    opt.erledigt?.forEach((s) => erledigt.add(s))
    if (opt.profil) profil = { ...profil, ...opt.profil }
  }

  // Abhängigkeiten, die sich aus der Kombination ergeben
  if (steps.has('eu-act') || steps.has('score')) steps.add('usecases')
  if (steps.has('project-plan')) steps.add('eu-act')

  // Die strategische Kette hängt zusammen: Die SWOT ist Vorarbeit zur Vision,
  // die Gap-Analyse braucht Vision und Reifegrad als beide Enden der Rechnung,
  // und die Schwerpunkte sind die Antwort auf die ermittelte Lücke.
  if (steps.has('vision')) steps.add('swot')
  if (steps.has('vision') && steps.has('maturity')) {
    steps.add('gap')
    steps.add('strategie')
  }

  return {
    scope: ALL_STEP_IDS.filter((s) => steps.has(s)),
    erledigt: [...erledigt].filter((s) => steps.has(s)),
    profil,
  }
}

const titelVon = (id: StepId) => STEPS.find((s) => s.id === id)?.title ?? id

/**
 * Eine Zeile der Sprungleiste. Gleiche Form wie im Fall-Wizard: runde
 * Nummer, grün sobald beantwortet, blau für die Stelle, an der man steht.
 */
function SprungZeile({ nr, label, titel, erledigt, aktuell, gesperrt = false, onClick }: {
  nr: number | string
  label: string
  /** Volltext als Kurzhinweis — der Kurzname allein ist manchmal knapp */
  titel?: string
  erledigt: boolean
  aktuell: boolean
  /** Noch nicht erreichbar — etwa die Zusammenfassung vor der letzten Antwort */
  gesperrt?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={titel ?? label}
      disabled={gesperrt}
      aria-current={aktuell ? 'step' : undefined}
      onClick={onClick}
      className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md transition-colors ${
        gesperrt ? 'opacity-40 cursor-not-allowed' : aktuell ? 'bg-blue-50' : 'hover:bg-slate-100'
      }`}
    >
      <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${
        erledigt ? 'bg-emerald-500 text-white'
        : aktuell ? 'bg-blue-600 text-white'
        : 'bg-slate-100 text-slate-500'
      }`}>
        {erledigt ? '✓' : nr}
      </span>
      <span className={`text-[11px] truncate ${aktuell ? 'font-semibold text-blue-700' : erledigt ? 'text-slate-500' : 'text-slate-600'}`}>
        {label}
      </span>
    </button>
  )
}

export default function MandantInterviewPage() {
  const navigate = useNavigate()
  const addClient = useMandantStore((s) => s.addClient)
  const setActive = useMandantStore((s) => s.setActive)
  const setProfil = useProfilStore((p) => p.set)
  const resetCases = useUseCasesStore((s) => s.resetStore)
  const initCases = useUseCasesStore((s) => s.init)
  const initWizard = useWizardStore((s) => s.init)

  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [antworten, setAntworten] = useState<Antworten>({})
  const [pos, setPos] = useState(-1) // -1 = Firmenname, sonst Index in sichtbaren Fragen
  const [fertig, setFertig] = useState(false)

  const sichtbar = sichtbareFragen(antworten)
  const frage = pos >= 0 && pos < sichtbar.length ? sichtbar[pos] : null
  const { scope, erledigt, profil } = ableiten(antworten)
  const offen = scope.filter((s) => !erledigt.includes(s))
  // Stand für die Sprungleiste
  const beantwortet = sichtbar.filter((f) => antworten[f.id] !== undefined).length
  const alleBeantwortet = sichtbar.length > 0 && beantwortet === sichtbar.length

  const antworte = (opt: Option) => {
    const next = { ...antworten, [frage!.id]: opt.wert }
    setAntworten(next)
    // Nach der Antwort kann sich die Fragenliste ändern — neu bestimmen
    const nachher = sichtbareFragen(next)
    const eigenerIndex = nachher.findIndex((f) => f.id === frage!.id)
    if (eigenerIndex + 1 < nachher.length) setPos(eigenerIndex + 1)
    else setFertig(true)
  }

  const zurueck = () => {
    if (fertig) { setFertig(false); setPos(sichtbar.length - 1); return }
    if (pos > 0) setPos(pos - 1)
    else if (pos === 0) setPos(-1)
    else navigate(-1)
  }

  const anlegen = () => {
    const id = addClient(name.trim(), note.trim() || undefined, scope, 'interview')
    setActive(id)
    setProfil(profil)
    if (erledigt.length > 0) scopedSet('wizard', erledigt)
    resetCases()
    setTimeout(() => { initCases(); initWizard() }, 0)
    navigate('/guide')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800">Neue Firma anlegen</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Ein paar Fragen zur Lage — die Arbeitsliste ergibt sich daraus. Nur To-dos, keine Theorie.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-5 items-start">
        {/* ── Fragen ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            {pos === -1 && (
              <>
                <div>
                  <label className={labelCls}>Wie heisst die Firma? *</label>
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="z. B. Müller Maschinenbau GmbH" autoFocus />
                </div>
                <div>
                  <label className={labelCls}>Kurznotiz (optional)</label>
                  <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Branche, Projektname oder Ansprechpartner" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Kundendaten bleiben ausschliesslich lokal in diesem Browser.
                </p>
              </>
            )}

            {frage && !fertig && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Frage {pos + 1} von {sichtbar.length}
                </p>
                <div>
                  <p className="text-base font-semibold text-slate-800 leading-snug">{frage.frage}</p>
                  {frage.hinweis && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{frage.hinweis}</p>}
                </div>
                <div className="space-y-2">
                  {frage.optionen.map((o) => {
                    const gewaehlt = antworten[frage.id] === o.wert
                    return (
                      <button key={o.wert} type="button" onClick={() => antworte(o)}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                          gewaehlt ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}>
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {fertig && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Fertig</p>
                <p className="text-base font-semibold text-slate-800">{name}</p>
                {note && <p className="text-xs text-slate-400 -mt-3">{note}</p>}
                <p className="text-sm text-slate-600 leading-relaxed">
                  Aus Ihren Antworten ergeben sich <strong>{offen.length} offene Schritte</strong>
                  {erledigt.length > 0 && <> und {erledigt.length} bereits erledigte</>}.
                  Die vollständige Liste steht rechts.
                </p>
                {scope.length === 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Aus den Antworten ergibt sich noch keine Aufgabe. Gehen Sie zurück und prüfen Sie,
                    ob wirklich nichts zu tun ist.
                  </p>
                )}
                <p className="text-[11px] text-slate-400">
                  Referenz- und Wissensinhalte (EU AI Act-Grundlagen, DSGVO-Theorie, Ethik-Rahmen) sind
                  bewusst nicht Teil der Liste — zum Nachschlagen stehen sie im Demo-Mandanten.
                </p>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={zurueck}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-2">
              ← {pos === -1 ? 'Abbrechen' : 'Zurück'}
            </button>
            <div className="ml-auto">
              {pos === -1 ? (
                <button type="button" disabled={!name.trim()} onClick={() => setPos(0)}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors">
                  Interview starten →
                </button>
              ) : fertig ? (
                <button type="button" disabled={scope.length === 0} onClick={anlegen}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:bg-slate-300 transition-colors">
                  Firma anlegen — {offen.length} To-dos starten ✓
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Sprungleiste + Liste, die mitwächst ────────────────── */}
        <aside className="space-y-4 md:sticky md:top-4">
        <nav className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Fragen</p>
            <span className="text-xs font-bold text-blue-600">{beantwortet}/{sichtbar.length}</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <SprungZeile
              nr="•" label="Firma" erledigt={!!name.trim()} aktuell={pos === -1}
              onClick={() => { setFertig(false); setPos(-1) }}
            />
            {sichtbar.map((f, i) => (
              <SprungZeile
                key={f.id}
                nr={i + 1}
                label={f.kurz}
                titel={f.frage}
                erledigt={antworten[f.id] !== undefined}
                aktuell={!fertig && pos === i}
                onClick={() => { setFertig(false); setPos(i) }}
              />
            ))}
            <SprungZeile
              nr="✓" label="Zusammenfassung" erledigt={fertig} aktuell={fertig}
              gesperrt={!alleBeantwortet}
              onClick={() => alleBeantwortet && setFertig(true)}
            />
          </div>
        </nav>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Arbeitsliste</p>
            <span className="text-xs font-bold text-blue-600">{scope.length}</span>
          </div>

          {scope.length === 0 ? (
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Noch leer — sie füllt sich mit jeder Antwort.
            </p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {scope.map((id, i) => {
                const done = erledigt.includes(id)
                return (
                  <div key={id} className="flex items-start gap-2">
                    <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5 ${
                      done ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {done ? '✓' : i + 1}
                    </span>
                    <span className={`text-[11px] leading-snug ${done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {titelVon(id)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {profil.iso42001 === 'ja' && (
            <p className="text-[10px] text-slate-500 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5 mt-3 leading-relaxed">
              ISO 42001 angestrebt — Richtlinie und Rollen sind dafür Voraussetzung und wurden aufgenommen.
            </p>
          )}
        </div>
        </aside>
      </div>
    </div>
  )
}
