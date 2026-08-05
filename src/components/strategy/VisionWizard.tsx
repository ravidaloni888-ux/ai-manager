import { useState } from 'react'
import { StrategyData, Ambition, ZielBaustein } from '../../types'

// ─────────────────────────────────────────────────────────────────────────
// Vision-Assistent.
//
// Eine Vision entsteht nicht aus einem leeren Textfeld. Fünf Schritte —
// Horizont, Auslöser, Ambitionsniveau, Ziele, Formulierung — führen zu
// einem Satz, der trägt. Das Ambitionsniveau ist der wichtigste Teil:
// es setzt den Maßstab, gegen den der Reifegrad später gemessen wird.
// ─────────────────────────────────────────────────────────────────────────

type WStep = 'horizont' | 'treiber' | 'ambition' | 'ziele' | 'satz'
const ORDER: WStep[] = ['horizont', 'treiber', 'ambition', 'ziele', 'satz']
const LABEL: Record<WStep, string> = {
  horizont: 'Horizont',
  treiber: 'Auslöser',
  ambition: 'Ambition',
  ziele: 'Ziele',
  satz: 'Formulierung',
}

const HORIZONTE: { wert: StrategyData['horizon']; label: string; sub: string }[] = [
  { wert: '1', label: '1 Jahr',  sub: 'Aufholen — konkrete Lücke schließen' },
  { wert: '2', label: '2 Jahre', sub: 'Aufbauen — Fundament und erste Skalierung' },
  { wert: '3', label: '3 Jahre', sub: 'Der übliche Rahmen für ein KI-Programm' },
  { wert: '5', label: '5 Jahre', sub: 'Umbau — KI verändert das Geschäftsmodell' },
]

const TREIBER: { wert: string; label: string; sub: string }[] = [
  { wert: 'wettbewerb',  label: 'Wettbewerbsdruck',        sub: 'Andere sind schneller oder günstiger geworden' },
  { wert: 'kosten',      label: 'Kosten manueller Arbeit',  sub: 'Aufwand, der sich automatisieren ließe' },
  { wert: 'qualitaet',   label: 'Qualität und Fehlerquote', sub: 'Fehler, die Geld oder Vertrauen kosten' },
  { wert: 'fachkraefte', label: 'Fehlende Fachkräfte',      sub: 'Arbeit, für die niemand zu finden ist' },
  { wert: 'erwartung',   label: 'Erwartung von Kundschaft', sub: 'Was am Markt inzwischen vorausgesetzt wird' },
  { wert: 'regulierung', label: 'Regulatorischer Druck',    sub: 'Nachweispflichten, die Struktur erzwingen' },
]

const AMBITIONEN: { wert: Ambition; label: string; sub: string; folge: string }[] = [
  {
    wert: 'anwender', label: 'Anwender', sub: 'Wir nutzen fertige Werkzeuge',
    folge: 'Der Schwerpunkt liegt auf Auswahl, sicherer Nutzung und Schulung. Eigene Datenkompetenz ist nachrangig — Anbieterprüfung und Verträge sind entscheidend.',
  },
  {
    wert: 'integrator', label: 'Integrator', sub: 'Wir verbinden Zugekauftes mit unseren Daten',
    folge: 'Datenqualität und Schnittstellen werden zum Engpass. Es braucht Data Owner, saubere Datenhaltung und eigene Testverfahren.',
  },
  {
    wert: 'entwickler', label: 'Entwickler', sub: 'Wir bauen eigene Modelle',
    folge: 'Höchster Anspruch an Daten, Kompetenzen und Dokumentation. Als Anbieter nach EU AI Act gelten die vollen Art.-16-Pflichten.',
  },
]

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

const LEERES_ZIEL: ZielBaustein = { was: '', mess: '', frist: '' }

/** Aus den Bausteinen einen lesbaren Zielsatz bauen. */
export function zielSatz(z: ZielBaustein): string {
  const teile = [z.was.trim(), z.mess.trim() && `— ${z.mess.trim()}`, z.frist.trim() && `bis ${z.frist.trim()}`]
  return teile.filter(Boolean).join(' ')
}

/** Vorschlag für den Vision-Satz aus den Antworten. */
function satzVorschlag(d: {
  horizon: StrategyData['horizon']
  treiber: string[]
  ambition?: Ambition
  bereiche: string[]
}): string {
  const jahr = new Date().getFullYear() + Number(d.horizon)
  const amb = AMBITIONEN.find((a) => a.wert === d.ambition)

  const rolle = d.ambition === 'entwickler'
    ? 'entwickeln wir eigene KI-Lösungen dort, wo sie einen Vorsprung schaffen, und nutzen im Übrigen erprobte Werkzeuge'
    : d.ambition === 'integrator'
    ? 'verbinden wir erprobte KI-Werkzeuge mit unseren eigenen Daten'
    : 'setzen wir erprobte KI-Werkzeuge gezielt dort ein, wo sie Arbeit spürbar erleichtern'

  const wo = d.bereiche.length
    ? ` in ${d.bereiche.slice(0, 3).join(', ')}`
    : ' in unseren Kernprozessen'

  const warumTexte: Record<string, string> = {
    wettbewerb:  'um im Wettbewerb anschlussfähig zu bleiben',
    kosten:      'um vermeidbaren manuellen Aufwand abzubauen',
    qualitaet:   'um Fehlerquoten messbar zu senken',
    fachkraefte: 'um trotz knapper Fachkräfte lieferfähig zu bleiben',
    erwartung:   'um die Erwartungen unserer Kundschaft zu erfüllen',
    regulierung: 'um regulatorische Nachweise verlässlich führen zu können',
  }
  const warum = d.treiber.map((t) => warumTexte[t]).filter(Boolean)
  const warumSatz = warum.length
    ? ` — ${warum.slice(0, 2).join(' und ')}`
    : ''

  const schluss = amb ? ` Die menschliche Entscheidung bleibt dort, wo sie hingehört.` : ''

  return `Bis ${jahr} ${rolle}${wo}${warumSatz}.${schluss}`
}

interface Props {
  data: StrategyData
  onFertig: (patch: Partial<StrategyData>) => void
  onAbbrechen?: () => void
}

export default function VisionWizard({ data, onFertig, onAbbrechen }: Props) {
  const [step, setStep] = useState<WStep>('horizont')

  const [horizon, setHorizon]   = useState<StrategyData['horizon']>(data.horizon ?? '3')
  const [treiber, setTreiber]   = useState<string[]>(data.treiber ?? [])
  const [ambition, setAmbition] = useState<Ambition | undefined>(data.ambition)
  const [ziele, setZiele]       = useState<ZielBaustein[]>(
    data.zielBausteine?.length === 3 ? data.zielBausteine : [LEERES_ZIEL, LEERES_ZIEL, LEERES_ZIEL],
  )
  const [satz, setSatz]         = useState(data.vision ?? '')
  const [satzBerührt, setSatzBerührt] = useState(!!data.vision)

  const idx = ORDER.indexOf(step)

  const bereiche = data.focusAreas
    .filter((f) => f.priority === 'High')
    .map((f) => f.theme)

  const vorschlag = satzVorschlag({ horizon, treiber, ambition, bereiche })

  const zieleGefuellt = ziele.filter((z) => z.was.trim().length > 0).length

  const kannWeiter: Record<WStep, boolean> = {
    horizont: true,
    treiber: treiber.length > 0,
    ambition: !!ambition,
    ziele: zieleGefuellt >= 1,
    satz: (satzBerührt ? satz : vorschlag).trim().length > 0,
  }

  const toggleTreiber = (w: string) =>
    setTreiber((p) => (p.includes(w) ? p.filter((x) => x !== w) : [...p, w]))

  const setZiel = (i: number, patch: Partial<ZielBaustein>) =>
    setZiele((p) => p.map((z, j) => (j === i ? { ...z, ...patch } : z)))

  const abschliessen = () => {
    const endSatz = (satzBerührt ? satz : vorschlag).trim()
    const saetze = ziele.map(zielSatz).filter((s) => s.length > 0)
    // objectives bleibt dreistellig — die Strategie-Ansicht erwartet das
    const objectives = [0, 1, 2].map((i) => saetze[i] ?? '')
    onFertig({
      horizon, treiber, ambition,
      zielBausteine: ziele,
      objectives,
      vision: endSatz,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-800">Vision-Assistent</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Fünf Schritte zu einem Zielbild, das trägt — der Satz entsteht am Ende aus Ihren Antworten.
        </p>
      </div>

      {/* Schrittleiste */}
      <div className="flex items-center gap-1 flex-wrap">
        {ORDER.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <button
              type="button"
              disabled={i > idx}
              onClick={() => i < idx && setStep(s)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                s === step ? 'bg-blue-600 text-white'
                : i < idx ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-slate-100 text-slate-400'
              }`}
            >
              <span>{i < idx ? '✓' : i + 1}</span>
              {LABEL[s]}
            </button>
            {i < ORDER.length - 1 && <span className="text-slate-300 text-xs">·</span>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        {step === 'horizont' && (
          <>
            <p className="text-base font-semibold text-slate-800">Bis wann soll das Zielbild erreicht sein?</p>
            <div className="space-y-2">
              {HORIZONTE.map((h) => (
                <button key={h.wert} type="button" onClick={() => setHorizon(h.wert)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    horizon === h.wert ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}>
                  <span className="block text-sm font-semibold">
                    {h.label} <span className={horizon === h.wert ? 'text-slate-300' : 'text-slate-400'}>
                      · bis {new Date().getFullYear() + Number(h.wert)}
                    </span>
                  </span>
                  <span className={`block text-[11px] mt-0.5 ${horizon === h.wert ? 'text-slate-300' : 'text-slate-500'}`}>
                    {h.sub}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'treiber' && (
          <>
            <div>
              <p className="text-base font-semibold text-slate-800">Was zwingt zum Handeln?</p>
              <p className="text-xs text-slate-500 mt-1">
                Mehrfachauswahl. Eine Vision ohne Auslöser bleibt eine Absichtserklärung —
                hier steht, warum jetzt und nicht in zwei Jahren.
              </p>
            </div>
            <div className="space-y-2">
              {TREIBER.map((t) => {
                const an = treiber.includes(t.wert)
                return (
                  <button key={t.wert} type="button" onClick={() => toggleTreiber(t.wert)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      an ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                    <span className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                        an ? 'bg-blue-600 text-white' : 'border border-slate-300 text-transparent'
                      }`}>✓</span>
                      <span className="text-sm font-semibold text-slate-800">{t.label}</span>
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 ml-6">{t.sub}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 'ambition' && (
          <>
            <div>
              <p className="text-base font-semibold text-slate-800">Wie tief will das Haus einsteigen?</p>
              <p className="text-xs text-slate-500 mt-1">
                Die wichtigste Festlegung: Sie bestimmt, woran der Reifegrad gemessen wird.
                „Reif genug" bedeutet für einen Anwender etwas völlig anderes als für einen Entwickler.
              </p>
            </div>
            <div className="space-y-2">
              {AMBITIONEN.map((a) => {
                const an = ambition === a.wert
                return (
                  <button key={a.wert} type="button" onClick={() => setAmbition(a.wert)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      an ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}>
                    <span className="block text-sm font-semibold">{a.label} — {a.sub}</span>
                    <span className={`block text-[11px] mt-1 leading-relaxed ${an ? 'text-slate-300' : 'text-slate-500'}`}>
                      {a.folge}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 'ziele' && (
          <>
            <div>
              <p className="text-base font-semibold text-slate-800">Drei Ziele, die man nachprüfen kann</p>
              <p className="text-xs text-slate-500 mt-1">
                Je Ziel: was erreicht wird, woran man es misst, bis wann. Ohne Messgröße ist es ein Wunsch.
              </p>
            </div>
            <div className="space-y-4">
              {ziele.map((z, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Ziel {i + 1}</p>
                  <input className={inputCls} value={z.was} onChange={(e) => setZiel(i, { was: e.target.value })}
                    placeholder="Was wird erreicht? z. B. KI im Kundenservice produktiv" />
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inputCls} value={z.mess} onChange={(e) => setZiel(i, { mess: e.target.value })}
                      placeholder="Woran messbar? z. B. 40 % der Anfragen" />
                    <input className={inputCls} value={z.frist} onChange={(e) => setZiel(i, { frist: e.target.value })}
                      placeholder="Bis wann? z. B. Q4 2027" />
                  </div>
                  {zielSatz(z) && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 rounded px-2 py-1.5">
                      Ergibt: <span className="text-slate-700">{zielSatz(z)}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {step === 'satz' && (
          <>
            <div>
              <p className="text-base font-semibold text-slate-800">Der Vision-Satz</p>
              <p className="text-xs text-slate-500 mt-1">
                Aus Ihren Antworten vorgeschlagen. Ändern Sie ihn, bis er nach Ihrem Haus klingt.
              </p>
            </div>

            {(satzBerührt ? satz.trim() !== vorschlag.trim() : true) && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
                <p className="text-[11px] font-bold text-blue-900">
                  {satzBerührt ? 'Neuer Vorschlag aus Ihren Antworten' : 'Vorschlag'}
                </p>
                <p className="text-sm text-slate-800 mt-1 leading-relaxed">{vorschlag}</p>
                <button type="button" onClick={() => { setSatz(vorschlag); setSatzBerührt(true) }}
                  className="mt-2 text-[11px] font-semibold text-blue-700 hover:text-blue-600 underline">
                  {satzBerührt ? 'Vorschlag übernehmen — ersetzt den Text unten' : 'Übernehmen und bearbeiten'} →
                </button>
              </div>
            )}

            <textarea
              className={`${inputCls} resize-none`} rows={4}
              value={satzBerührt ? satz : vorschlag}
              onChange={(e) => { setSatz(e.target.value); setSatzBerührt(true) }}
            />

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-1">
              <p className="text-[11px] font-bold text-slate-700">Damit steht fest</p>
              <p className="text-[11px] text-slate-600">
                Horizont: bis {new Date().getFullYear() + Number(horizon)} ·
                Ambition: {AMBITIONEN.find((a) => a.wert === ambition)?.label ?? '—'} ·
                Auslöser: {treiber.length} · Ziele: {zieleGefuellt}/3
              </p>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => (idx > 0 ? setStep(ORDER[idx - 1]) : onAbbrechen?.())}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-2">
          ← {idx > 0 ? 'Zurück' : 'Abbrechen'}
        </button>
        <div className="ml-auto">
          {step !== 'satz' ? (
            <button type="button" disabled={!kannWeiter[step]} onClick={() => setStep(ORDER[idx + 1])}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors">
              Weiter →
            </button>
          ) : (
            <button type="button" disabled={!kannWeiter.satz} onClick={abschliessen}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:bg-slate-300 transition-colors">
              Vision übernehmen ✓
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
