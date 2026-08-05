import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { scopedGet, scopedSet } from '../../lib/mandantData'
import { getMandantType } from '../../store/mandantStore'
import { StrategyData } from '../../types'
import { useGapDaten, MASSNAHME, GAP_ZIEL } from './GapAnalyse'

// ─────────────────────────────────────────────────────────────────────────
// Die Strategie ist das Ergebnis der vier Schritte davor, nicht eine
// weitere Konfiguration.
//
// Der Bruch, den dieser Block schliesst: Die Gap-Analyse spricht über
// Fähigkeiten (Daten, Governance, Kompetenzen), die Schwerpunkte über
// Geschäftsfelder (Kundenservice, Betrieb). Die Stoßrichtungen sind die
// Brücke — aus einer gemessenen Lücke wird eine strategische Absicht.
// ─────────────────────────────────────────────────────────────────────────

export interface Stossrichtung {
  id: string
  titel: string
  /** Woher sie stammt — Dimension der Lücke oder 'eigen' */
  herkunft: string
  /** Anzeigetext der Herkunft */
  herkunftText: string
  status: 'offen' | 'angenommen' | 'verworfen'
  grund?: string
}

const BUCKET = 'stossrichtungen'

/** Vorschlagstitel je Reifegrad-Dimension. */
const TITEL: Record<string, string> = {
  strategy:   'Strategische Steuerung verankern',
  people:     'Kompetenzen im Haus aufbauen',
  technology: 'Technische Grundlage schaffen',
  data:       'Datengrundlage belastbar machen',
  governance: 'Governance und Verantwortung klären',
  adoption:   'Akzeptanz in der Breite herstellen',
}

type SwotFeld = 'staerken' | 'schwaechen' | 'chancen' | 'risiken'
type SwotDaten = Record<SwotFeld, { id: string; text: string }[]>
const SWOT_LEER: SwotDaten = { staerken: [], schwaechen: [], chancen: [], risiken: [] }

const AMBITION_LABEL: Record<string, string> = {
  anwender: 'Anwender', integrator: 'Integrator', entwickler: 'Entwickler',
}

export default function StrategieErgebnis({ strategie }: { strategie: StrategyData }) {
  const navigate = useNavigate()
  const gap = useGapDaten(strategie)
  const speicherbar = getMandantType() !== 'demo'

  const [richtungen, setRichtungen] = useState<Stossrichtung[]>([])
  const [swot, setSwot] = useState<SwotDaten>(SWOT_LEER)
  const [entwurf, setEntwurf] = useState('')
  const [verwerfeFuer, setVerwerfeFuer] = useState<string | null>(null)
  const [grundEntwurf, setGrundEntwurf] = useState('')

  useEffect(() => {
    setRichtungen(scopedGet<Stossrichtung[]>(BUCKET, []))
    setSwot({ ...SWOT_LEER, ...scopedGet<SwotDaten>('swot', SWOT_LEER) })
  }, [])

  const sichern = (next: Stossrichtung[]) => {
    setRichtungen(next)
    if (speicherbar) scopedSet(BUCKET, next)
  }

  // Für jede offene Lücke einen Vorschlag, der noch nicht entschieden ist
  const vorschlaege = useMemo(() => {
    const behandelt = new Set(richtungen.map((r) => r.herkunft))
    return gap.offen
      .filter((z) => !behandelt.has(z.id))
      .map((z) => ({
        id: z.id,
        titel: TITEL[z.id] ?? z.label,
        herkunftText: `Lücke ${z.label} · −${z.luecke}`,
        massnahme: MASSNAHME[z.id],
      }))
  }, [gap.offen, richtungen])

  const uebernehmen = (v: { id: string; titel: string; herkunftText: string }) =>
    sichern([...richtungen, {
      id: nanoid(), titel: v.titel, herkunft: v.id,
      herkunftText: v.herkunftText, status: 'angenommen',
    }])

  const verwerfen = (v: { id: string; titel: string; herkunftText: string }, grund: string) =>
    sichern([...richtungen, {
      id: nanoid(), titel: v.titel, herkunft: v.id,
      herkunftText: v.herkunftText, status: 'verworfen', grund,
    }])

  const eigeneHinzu = () => {
    const t = entwurf.trim()
    if (!t) return
    sichern([...richtungen, {
      id: nanoid(), titel: t, herkunft: 'eigen',
      herkunftText: 'Eigene Festlegung', status: 'angenommen',
    }])
    setEntwurf('')
  }

  const entfernen = (id: string) => sichern(richtungen.filter((r) => r.id !== id))

  const angenommen = richtungen.filter((r) => r.status === 'angenommen')
  const verworfen = richtungen.filter((r) => r.status === 'verworfen')

  // ── Konsistenz: passt die Strategie zu dem, was gemessen wurde? ──
  const hinweise: string[] = []
  const engpass = gap.offen[0]
  if (engpass && !richtungen.some((r) => r.herkunft === engpass.id && r.status === 'angenommen')) {
    hinweise.push(
      `Der größte Engpass ist ${engpass.label} (−${engpass.luecke}), aber dazu ist keine Stoßrichtung angenommen. `
      + 'Entweder gehört sie in die Liste, oder die Lücke ist falsch eingeschätzt.',
    )
  }
  const hoch = strategie.focusAreas.filter((f) => f.priority === 'High').length
  const schnitt = gap.zeilen.filter((z) => z.ist !== null).reduce((s, z, _, a) => s + (z.ist ?? 0) / a.length, 0)
  if (hoch >= 4 && schnitt > 0 && schnitt < 3) {
    hinweise.push(
      `${hoch} Schwerpunkte stehen auf „Hoch" bei einem Reifegrad von ${schnitt.toFixed(1)}. `
      + 'So viele Fronten gleichzeitig trägt die Organisation selten — zwei bis drei sind belastbarer.',
    )
  }
  if (angenommen.length === 0 && gap.offen.length > 0) {
    hinweise.push('Noch keine Stoßrichtung angenommen — ohne sie bleiben die Schwerpunkte unbegründet.')
  }
  if (swot.risiken.length > 0 && !richtungen.some((r) => r.herkunft === 'governance' && r.status === 'angenommen')
      && gap.offen.some((z) => z.id === 'governance')) {
    hinweise.push('In der SWOT stehen Risiken, und Governance ist eine offene Lücke — das gehört zusammen betrachtet.')
  }

  return (
    <div className="space-y-5">
      {/* ── ① Ausgangslage ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-bold text-slate-800">Ausgangslage</h3>
          <span className="text-[11px] text-slate-400 flex-shrink-0">aus den vier Schritten davor</span>
        </div>

        {strategie.vision ? (
          <p className="text-sm text-slate-700 leading-relaxed border-l-2 border-slate-300 pl-3">
            {strategie.vision}
          </p>
        ) : (
          <p className="text-sm text-slate-400">Noch keine Vision formuliert.</p>
        )}

        <div className="grid sm:grid-cols-3 gap-3 pt-1">
          <div className="rounded-lg border border-slate-200 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Anspruch</p>
            <p className="text-sm font-semibold text-slate-800">
              {gap.ambition ? AMBITION_LABEL[gap.ambition] : '—'}
              <span className="font-normal text-slate-400 text-xs"> · bis {new Date().getFullYear() + Number(strategie.horizon)}</span>
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Größter Engpass</p>
            <p className="text-sm font-semibold text-slate-800">
              {engpass ? <>{engpass.label} <span className="text-red-600">−{engpass.luecke}</span></> : gap.geladen ? 'keiner' : '…'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">SWOT</p>
            <p className="text-sm font-semibold text-slate-800">
              {swot.staerken.length + swot.schwaechen.length + swot.chancen.length + swot.risiken.length} Einträge
              {swot.risiken.length > 0 && (
                <span className="font-normal text-slate-400 text-xs"> · {swot.risiken.length} Risiken</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── ② Stoßrichtungen ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Stoßrichtungen</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Die eigentliche Strategie: Aus jeder gemessenen Lücke wird eine Absicht — angenommen oder
            mit Begründung verworfen. Verwerfen ist eine gültige Entscheidung, nur nicht stillschweigend.
          </p>
        </div>

        {/* Vorschläge, die noch nicht entschieden sind */}
        {vorschlaege.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Vorgeschlagen · {vorschlaege.length}
            </p>
            {vorschlaege.map((v) => (
              <div key={v.id} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{v.titel}</p>
                  <span className="text-[10px] font-mono text-blue-700 flex-shrink-0">{v.herkunftText}</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{v.massnahme}</p>

                {verwerfeFuer === v.id ? (
                  <div className="mt-2 space-y-2">
                    <input
                      autoFocus
                      value={grundEntwurf}
                      onChange={(e) => setGrundEntwurf(e.target.value)}
                      placeholder="Warum nicht? z. B. wird extern eingekauft"
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button type="button" disabled={!grundEntwurf.trim()}
                        onClick={() => { verwerfen(v, grundEntwurf.trim()); setVerwerfeFuer(null); setGrundEntwurf('') }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-700 text-white hover:bg-slate-600 disabled:bg-slate-200 disabled:text-slate-400">
                        Verwerfen
                      </button>
                      <button type="button" onClick={() => { setVerwerfeFuer(null); setGrundEntwurf('') }}
                        className="text-xs text-slate-500 hover:text-slate-700 px-2">
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2.5">
                    <button type="button" onClick={() => uebernehmen(v)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500">
                      Übernehmen
                    </button>
                    <button type="button" onClick={() => setVerwerfeFuer(v.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
                      Verwerfen…
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!gap.geladen && <p className="text-sm text-slate-400">Lücken werden berechnet…</p>}

        {gap.geladen && !gap.ambition && (
          <p className="text-[12px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Ohne Ambitionsniveau lässt sich keine Lücke berechnen — und ohne Lücke kein Vorschlag ableiten.
            Das Niveau entsteht im Vision-Assistenten.
          </p>
        )}

        {/* Angenommen */}
        {angenommen.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Angenommen · {angenommen.length}
            </p>
            {angenommen.map((r) => (
              <div key={r.id} className="group flex items-start gap-2.5 rounded-lg border-l-2 border-green-400 bg-green-50/60 px-3 py-2">
                <span className="text-green-600 text-xs mt-0.5 flex-shrink-0">✓</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{r.titel}</p>
                  <p className="text-[10px] font-mono text-slate-400">{r.herkunftText}</p>
                </div>
                {r.herkunft !== 'eigen' && GAP_ZIEL[r.herkunft] && (
                  <button type="button" onClick={() => navigate(GAP_ZIEL[r.herkunft])}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 flex-shrink-0">
                    Dorthin →
                  </button>
                )}
                <button type="button" onClick={() => entfernen(r.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 text-xs flex-shrink-0 transition-opacity">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Verworfen — mit Grund, damit die Entscheidung nachvollziehbar bleibt */}
        {verworfen.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Bewusst verworfen · {verworfen.length}
            </p>
            {verworfen.map((r) => (
              <div key={r.id} className="group flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-slate-400 text-xs mt-0.5 flex-shrink-0">–</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-500 line-through">{r.titel}</p>
                  <p className="text-[11px] text-slate-500">{r.grund}</p>
                </div>
                <button type="button" onClick={() => entfernen(r.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 text-xs flex-shrink-0 transition-opacity">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Eigene ergänzen */}
        <div className="flex gap-2 pt-1 border-t border-slate-100">
          <input
            value={entwurf}
            onChange={(e) => setEntwurf(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') eigeneHinzu() }}
            placeholder="Eigene Stoßrichtung ergänzen…"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mt-3"
          />
          <button type="button" onClick={eigeneHinzu} disabled={!entwurf.trim()}
            className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 flex-shrink-0">
            +
          </button>
        </div>

        {!speicherbar && (
          <p className="text-[10px] text-slate-400">Im Demo-Mandanten wird nichts dauerhaft gespeichert.</p>
        )}
      </div>

      {/* ── Konsistenzprüfung ──────────────────────────────────────── */}
      {hinweise.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
          <p className="text-sm font-semibold text-amber-900">Das passt noch nicht zusammen</p>
          {hinweise.map((h) => (
            <p key={h} className="text-[12px] text-amber-900 leading-relaxed flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-600 flex-shrink-0" />
              <span>{h}</span>
            </p>
          ))}
        </div>
      )}

      {hinweise.length === 0 && angenommen.length > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-semibold text-green-800">Strategie und Befund passen zusammen</p>
          <p className="text-[12px] text-green-900 mt-1 leading-relaxed">
            Die angenommenen Stoßrichtungen decken den Engpass ab, und die Zahl der Schwerpunkte
            passt zum Reifegrad.
          </p>
        </div>
      )}
    </div>
  )
}
