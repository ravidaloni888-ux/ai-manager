import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { loadFor } from '../../lib/mandantData'
import { useIsDemo, useMandantId } from '../../store/mandantStore'
import { StrategyData, Ambition } from '../../types'

// ─────────────────────────────────────────────────────────────────────────
// Gap-Analyse.
//
// Keine eigene Erhebung, sondern reine Rechenarbeit: Ist aus dem
// Reifegradcheck, Soll aus dem Ambitionsniveau der Vision. Fühlt sie sich
// schwer an, fehlt meist eines von beidem — dann sagt die Seite das auch,
// statt eine Lücke zu erfinden.
// ─────────────────────────────────────────────────────────────────────────

type Scores = Record<string, number>

/** Dieselben sechs Dimensionen wie im Reifegradcheck. */
const DIMS: { id: string; label: string }[] = [
  { id: 'strategy',   label: 'Strategie & Vision' },
  { id: 'people',     label: 'Menschen & Kompetenzen' },
  { id: 'technology', label: 'Technologie' },
  { id: 'data',       label: 'Daten' },
  { id: 'governance', label: 'Governance' },
  { id: 'adoption',   label: 'Akzeptanz & Nutzung' },
]

/**
 * Soll-Reife je Ambitionsniveau. „Reif genug" heißt für einen Anwender
 * etwas anderes als für einen Entwickler — deshalb kein fester Zielwert.
 */
const SOLL: Record<Ambition, Record<string, number>> = {
  anwender:   { strategy: 3, people: 3, technology: 2, data: 2, governance: 3, adoption: 4 },
  integrator: { strategy: 4, people: 3, technology: 3, data: 4, governance: 4, adoption: 4 },
  entwickler: { strategy: 4, people: 4, technology: 4, data: 5, governance: 5, adoption: 4 },
}

const AMBITION_LABEL: Record<Ambition, string> = {
  anwender: 'Anwender', integrator: 'Integrator', entwickler: 'Entwickler',
}

/** Was die Lücke je Dimension praktisch bedeutet. */
const MASSNAHME: Record<string, string> = {
  strategy:   'Vision schärfen, Schwerpunkte priorisieren und die Führung verbindlich einbinden.',
  people:     'Schulungsbedarf je Zielgruppe ermitteln und Multiplikatoren aufbauen.',
  technology: 'Werkzeuge und Schnittstellen klären — was wird gekauft, was integriert.',
  data:       'Datenquellen inventarisieren, Qualität je Anwendungsfall prüfen, Data Owner benennen.',
  governance: 'KI-Richtlinie aufsetzen, Rollen benennen, Freigabeprozess festlegen.',
  adoption:   'Change-Diagnose je Schlüsselperson, dann gezielt begleiten statt breit informieren.',
}

const ZIEL: Record<string, string> = {
  strategy: '/strategy', people: '/enablement', technology: '/vendors',
  data: '/data', governance: '/governance', adoption: '/change',
}

const DEMO_SCORES: Scores = {
  strategy_0: 4, strategy_1: 4, strategy_2: 3,
  people_0: 3, people_1: 2, people_2: 3,
  technology_0: 4, technology_1: 3, technology_2: 3,
  data_0: 3, data_1: 3, data_2: 2,
  governance_0: 4, governance_1: 3, governance_2: 3,
  adoption_0: 5, adoption_1: 4, adoption_2: 3,
}

export default function GapAnalyse({ strategie }: { strategie: StrategyData }) {
  const navigate = useNavigate()
  const demo = useIsDemo()
  const mandantId = useMandantId()
  const [scores, setScores] = useState<Scores>({})
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    let aktiv = true
    if (demo) { setScores(DEMO_SCORES); setGeladen(true); return }
    loadFor<Scores>('maturity', async () => {
      try {
        const { data } = await supabase.from('ai_maturity').select('scores').eq('id', 'singleton').single()
        return (data?.scores ?? {}) as Scores
      } catch { return {} }
    }, {}).then((s) => { if (aktiv) { setScores(s); setGeladen(true) } })
    return () => { aktiv = false }
  }, [mandantId, demo])

  const ambition = strategie.ambition

  /** Ist-Wert je Dimension: Mittel der drei Antworten, sofern beantwortet. */
  const istWert = (dim: string): number | null => {
    const werte = [0, 1, 2].map((i) => scores[`${dim}_${i}`]).filter((v): v is number => typeof v === 'number')
    if (werte.length === 0) return null
    return werte.reduce((a, b) => a + b, 0) / werte.length
  }

  const beantwortet = DIMS.filter((d) => istWert(d.id) !== null).length

  // Beide Enden müssen stehen — sonst wird die Lücke geraten
  if (!geladen) {
    return <p className="text-sm text-slate-400">Reifegrad wird geladen…</p>
  }

  if (!ambition || beantwortet === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-800">Gap-Analyse</h3>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
          <p className="text-sm font-semibold text-amber-900">Es fehlt noch ein Ende der Rechnung</p>
          <p className="text-[12px] text-amber-900 leading-relaxed">
            Die Lücke ergibt sich aus dem Soll der Vision und dem Ist des Reifegrads.
            {!ambition && ' Das Ambitionsniveau ist noch nicht gesetzt — es entsteht im Vision-Assistenten.'}
            {beantwortet === 0 && ' Der Reifegradcheck ist noch nicht ausgefüllt.'}
          </p>
          <div className="flex gap-2 pt-1">
            {!ambition && (
              <button type="button" onClick={() => navigate('/strategy')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-500">
                Zum Vision-Assistenten →
              </button>
            )}
            {beantwortet === 0 && (
              <button type="button" onClick={() => navigate('/maturity')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-500">
                Zum Reifegradcheck →
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const soll = SOLL[ambition]
  const zeilen = DIMS.map((d) => {
    const ist = istWert(d.id)
    const s = soll[d.id]
    return { ...d, ist, soll: s, luecke: ist === null ? null : Math.round((s - ist) * 10) / 10 }
  })

  const offen = zeilen
    .filter((z) => z.luecke !== null && z.luecke > 0)
    .sort((a, b) => (b.luecke ?? 0) - (a.luecke ?? 0))
  const erfuellt = zeilen.filter((z) => z.luecke !== null && z.luecke <= 0)
  const groesste = offen[0]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-800">Gap-Analyse</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Soll aus dem Ambitionsniveau <strong className="text-slate-700">{AMBITION_LABEL[ambition]}</strong>,
          Ist aus dem Reifegradcheck. Keine neue Eingabe nötig — beides liegt bereits vor.
        </p>
      </div>

      {beantwortet < DIMS.length && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Nur {beantwortet} von {DIMS.length} Dimensionen sind im Reifegradcheck bewertet — die übrigen
          bleiben hier ohne Aussage.
        </p>
      )}

      {/* Balken je Dimension */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        {zeilen.map((z) => {
          const fehlt = z.luecke !== null && z.luecke > 0
          return (
            <div key={z.id} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-slate-700">{z.label}</span>
                <span className="text-[11px] flex-shrink-0">
                  {z.ist === null ? (
                    <span className="text-slate-400">nicht bewertet</span>
                  ) : (
                    <>
                      <span className="text-slate-500">Ist {z.ist.toFixed(1)} · Soll {z.soll}</span>
                      {fehlt
                        ? <strong className="text-red-600 ml-2">−{z.luecke}</strong>
                        : <strong className="text-green-600 ml-2">erfüllt</strong>}
                    </>
                  )}
                </span>
              </div>
              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                {/* Soll als Markierung, Ist als Füllung */}
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${fehlt ? 'bg-orange-400' : 'bg-green-500'}`}
                  style={{ width: `${((z.ist ?? 0) / 5) * 100}%` }}
                />
                <div
                  className="absolute inset-y-0 w-0.5 bg-slate-700"
                  style={{ left: `${(z.soll / 5) * 100}%` }}
                  title={`Soll ${z.soll}`}
                />
              </div>
            </div>
          )
        })}
        <p className="text-[10px] text-slate-400 pt-1">
          Der senkrechte Strich markiert das Soll für dieses Ambitionsniveau.
        </p>
      </div>

      {/* Was daraus folgt */}
      {offen.length === 0 ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-semibold text-green-800">Keine Lücke gegenüber dem Anspruch</p>
          <p className="text-[12px] text-green-900 mt-1 leading-relaxed">
            Der Reifegrad trägt das gewählte Ambitionsniveau. Wenn das zu leicht klingt, ist womöglich
            die Ambition zu niedrig angesetzt — im Vision-Assistenten lässt sie sich anheben.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Lücken — größte zuerst
          </p>
          {offen.map((z, i) => (
            <div key={z.id} className={`rounded-xl border px-4 py-3 ${
              i === 0 ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
            }`}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">
                  {z.label}
                  {i === 0 && <span className="ml-2 text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">Engpass</span>}
                </p>
                <span className="text-xs font-bold text-red-600 flex-shrink-0">−{z.luecke}</span>
              </div>
              <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">{MASSNAHME[z.id]}</p>
              <button
                type="button"
                onClick={() => navigate(ZIEL[z.id])}
                className="mt-2 text-[11px] font-semibold text-blue-600 hover:text-blue-500 underline"
              >
                Dorthin →
              </button>
            </div>
          ))}
          {erfuellt.length > 0 && (
            <p className="text-[11px] text-slate-400 pt-1">
              Bereits ausreichend: {erfuellt.map((z) => z.label).join(', ')}.
            </p>
          )}
        </div>
      )}

      {groesste && (
        <p className="text-[11px] text-slate-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 leading-relaxed">
          Die Strategie beantwortet vor allem eine Frage: wie die größte Lücke geschlossen wird.
          Hier ist das <strong className="text-slate-700">{groesste.label}</strong> — die Schwerpunkte
          im Reiter daneben sollten das widerspiegeln.
        </p>
      )}
    </div>
  )
}
