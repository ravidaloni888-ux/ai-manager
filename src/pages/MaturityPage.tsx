import { useState, useEffect } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { useIsDemo, useMandantId } from '../store/mandantStore'
import { loadFor, saveFor } from '../lib/mandantData'

const DEMO_SCORES: Scores = {
  strategy_0: 4, strategy_1: 4, strategy_2: 3,
  people_0: 3, people_1: 2, people_2: 3,
  technology_0: 4, technology_1: 3, technology_2: 3,
  data_0: 3, data_1: 3, data_2: 2,
  governance_0: 4, governance_1: 3, governance_2: 3,
  adoption_0: 5, adoption_1: 4, adoption_2: 3,
}

type Scores = Record<string, number>

interface DimDef {
  id: string
  label: string
  shortLabel: string
  color: string
  questions: string[]
}

const DIMS: DimDef[] = [
  {
    id: 'strategy',
    label: 'Strategie & Vision',
    shortLabel: 'Strategie',
    color: '#3b82f6',
    questions: [
      'Es gibt eine schriftliche KI-Strategie, die zu den Unternehmenszielen passt.',
      'Die Führung trägt KI-Vorhaben aktiv mit und stellt Mittel bereit.',
      'Wir messen, welchen Wert die Anwendungsfälle tatsächlich schaffen.',
    ],
  },
  {
    id: 'people',
    label: 'Menschen & Kompetenzen',
    shortLabel: 'Menschen',
    color: '#8b5cf6',
    questions: [
      'Mitarbeitende haben Zugang zu Schulung und Weiterbildung im KI-Bereich.',
      'Wir haben Fachleute für KI im Haus (Entwicklung, Betrieb, Datenarbeit).',
      'Bei uns darf man mit KI gefahrlos ausprobieren.',
    ],
  },
  {
    id: 'technology',
    label: 'Technologie',
    shortLabel: 'Technologie',
    color: '#06b6d4',
    questions: [
      'Es gibt eine tragfähige Plattform, um KI-Lösungen zu bauen und zu betreiben.',
      'Wir können mehrere Modelle einsetzen — kommerzielle wie offene.',
      'Der Betrieb ist über den ganzen Lebenszyklus geregelt, nicht nur bis zum Start.',
    ],
  },
  {
    id: 'data',
    label: 'Daten',
    shortLabel: 'Daten',
    color: '#10b981',
    questions: [
      'Unsere Daten sind gepflegt, von guter Qualität und für KI erreichbar.',
      'Firmenwissen ist so aufbereitet, dass eine KI gezielt darauf zugreifen kann.',
      'Herkunft und Zugriffsrechte sind nachvollziehbar — Ergebnisse sind belegbar.',
    ],
  },
  {
    id: 'governance',
    label: 'Governance & Risiko',
    shortLabel: 'Governance',
    color: '#f59e0b',
    questions: [
      'Es gibt einen verbindlichen Rahmen für verantwortliche KI (Verzerrung, Fairness, Transparenz).',
      'KI-Risiken werden erfasst und gemindert — Sicherheit, Urheberrecht, falsche Ausgaben.',
      'Wir erfüllen die für uns geltenden KI-Vorschriften.',
    ],
  },
  {
    id: 'adoption',
    label: 'Anwendung & Akzeptanz',
    shortLabel: 'Akzeptanz',
    color: '#ec4899',
    questions: [
      'In mehreren Bereichen laufen KI-Anwendungsfälle produktiv.',
      'Vorhaben kommen über den Pilotstatus hinaus in den Regelbetrieb.',
      'KI bewirkt etwas Messbares für Nutzende oder Kundschaft.',
    ],
  },
]

const LEVEL_LABELS = ['Anfänglich', 'Im Aufbau', 'Definiert', 'Gesteuert', 'Optimiert']
const LEVEL_COLORS = ['text-red-500', 'text-orange-500', 'text-amber-500', 'text-blue-500', 'text-green-500']
const LEVEL_BG    = ['bg-red-100 text-red-700', 'bg-orange-100 text-orange-700', 'bg-amber-100 text-amber-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700']

function levelIdx(score: number) {
  if (score <= 0) return -1
  if (score < 1.5) return 0
  if (score < 2.5) return 1
  if (score < 3.5) return 2
  if (score < 4.5) return 3
  return 4
}

function dimAvg(scores: Scores, id: string) {
  const vals = [0, 1, 2].map((i) => scores[`${id}_${i}`] ?? 0).filter((v) => v > 0)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
}

function overall(scores: Scores) {
  const avgs = DIMS.map((d) => dimAvg(scores, d.id)).filter((s) => s > 0)
  return avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : 0
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const s: number = payload[0].value
  const li = levelIdx(s)
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow text-xs space-y-0.5">
      <p className="font-semibold text-slate-800">{payload[0].payload.subject}</p>
      {s > 0
        ? <p className="text-slate-600">{s.toFixed(1)} / 5 — <span className="font-medium">{LEVEL_LABELS[li]}</span></p>
        : <p className="text-slate-400 italic">Not rated yet</p>
      }
    </div>
  )
}

export default function MaturityPage({ eingebettet }: { eingebettet?: boolean } = {}) {
  const user = useAuthStore((s) => s.user)
  const demoMode = useIsDemo()
  const mandantId = useMandantId()
  const [scores, setScores] = useState<Scores>({})
  const [original, setOriginal] = useState<Scores>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (demoMode) {
      setScores(DEMO_SCORES)
      setOriginal(DEMO_SCORES)
      setLoading(false)
      return
    }
    async function load() {
      const s = await loadFor<Scores>('maturity', async () => {
        try {
          const { data } = await supabase
            .from('ai_maturity')
            .select('scores')
            .eq('id', 'singleton')
            .single()
          return (data?.scores ?? {}) as Scores
        } catch { return {} }
      }, {})
      setScores(s)
      setOriginal(s)
      setLoading(false)
    }
    load()
  }, [mandantId, demoMode])

  const isDirty = JSON.stringify(scores) !== JSON.stringify(original)

  const handleSave = async () => {
    setSaving(true)
    await saveFor<Scores>('maturity', async (v) => {
      await supabase.from('ai_maturity').upsert({
        id: 'singleton', scores: v, updated_at: new Date().toISOString(),
      })
    }, scores)
    setOriginal({ ...scores })
    setSaving(false)
  }

  const setQ = (dimId: string, qi: number, v: number) => {
    if (!user) return
    setScores((prev) => ({ ...prev, [`${dimId}_${qi}`]: v }))
  }

  const radarData = DIMS.map((d) => ({
    subject: d.shortLabel,
    score: dimAvg(scores, d.id),
    fullMark: 5,
  }))

  const totalOverall = overall(scores)
  const answered = Object.values(scores).filter((v) => v > 0).length
  const oli = levelIdx(totalOverall)

  return (
    <div className={eingebettet ? 'space-y-6' : 'p-6 space-y-6'}>
      {/* Header — als Reiter trägt die Strategieseite schon eine Überschrift */}
      <div className="flex items-start justify-between">
        <div>
          {eingebettet ? (
            <>
              <h3 className="text-base font-bold text-slate-800">KI-Reifegrad einschätzen</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sechs Dimensionen, je drei Aussagen von 1 bis 5 · {answered}/18 beantwortet
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-800">KI-Reifegrad</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Sechs Dimensionen, je drei Aussagen von 1 bis 5 · {answered}/18 beantwortet
              </p>
            </>
          )}
        </div>
        {user && isDirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? 'Wird gespeichert…' : 'Speichern'}
          </button>
        )}
      </div>

      {/* Radar + summary */}
      <div className="bg-white rounded-xl shadow-md p-5 flex flex-col lg:flex-row items-center gap-6">
        {/* Chart */}
        <div className="w-full lg:w-[420px] flex-shrink-0">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
              <PolarGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 5]}
                tickCount={6}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(v) => (v === 0 ? '' : String(v))}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.12}
                strokeWidth={2}
                dot={{ r: 3, fill: '#3b82f6' }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Dimension scores */}
        <div className="flex-1 w-full space-y-2.5">
          {DIMS.map((d) => {
            const s = dimAvg(scores, d.id)
            const li = levelIdx(s)
            const answeredQ = [0, 1, 2].filter((i) => (scores[`${d.id}_${i}`] ?? 0) > 0).length
            return (
              <div key={d.id} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-sm text-slate-600 w-28 flex-shrink-0 truncate">{d.shortLabel}</span>
                {s > 0 ? (
                  <>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(s / 5) * 100}%`, background: d.color }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-7 text-right">{s.toFixed(1)}</span>
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full w-[76px] text-center ${LEVEL_BG[li]}`}>
                      {LEVEL_LABELS[li]}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full" />
                    <span className="text-xs text-slate-300 w-7 text-right">{answeredQ}/3</span>
                    <span className="text-[11px] text-slate-300 w-[76px] text-center italic">—</span>
                  </>
                )}
              </div>
            )
          })}

          {/* Overall */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-700 w-28 flex-shrink-0">Overall</span>
            {totalOverall > 0 ? (
              <>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-600 transition-all duration-300"
                    style={{ width: `${(totalOverall / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-800 w-7 text-right">{totalOverall.toFixed(1)}</span>
                <span className={`text-[11px] font-bold w-[76px] text-center ${LEVEL_COLORS[oli]}`}>
                  {LEVEL_LABELS[oli]}
                </span>
              </>
            ) : (
              <>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full" />
                <span className="text-xs text-slate-300 w-7" />
                <span className="text-[11px] text-slate-300 w-[76px] text-center italic">not rated</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Questions */}
      {loading ? (
        <div className="text-sm text-slate-400">Loading…</div>
      ) : (
        <div className="space-y-4">
          {DIMS.map((d, di) => (
            <div key={d.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Dimension header */}
              <div
                className="px-5 py-3 flex items-center gap-3"
                style={{ borderLeft: `4px solid ${d.color}`, background: `${d.color}12` }}
              >
                <span
                  className="text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: d.color }}
                >
                  {di + 1}
                </span>
                <h3 className="font-semibold text-sm text-slate-700">{d.label}</h3>
                {dimAvg(scores, d.id) > 0 && (() => {
                  const s = dimAvg(scores, d.id)
                  const li = levelIdx(s)
                  return (
                    <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${LEVEL_BG[li]}`}>
                      {s.toFixed(1)} · {LEVEL_LABELS[li]}
                    </span>
                  )
                })()}
              </div>

              {/* Questions */}
              <div className="divide-y divide-slate-50">
                {d.questions.map((q, qi) => {
                  const key = `${d.id}_${qi}`
                  const val = scores[key] ?? 0
                  return (
                    <div key={qi} className="px-5 py-3.5 flex items-center gap-4">
                      <p className="flex-1 text-sm text-slate-600 leading-snug">{q}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <button
                            key={v}
                            onClick={() => setQ(d.id, qi, v)}
                            disabled={!user}
                            title={LEVEL_LABELS[v - 1]}
                            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                              val === v
                                ? 'text-white shadow-sm scale-105'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:cursor-default'
                            }`}
                            style={val === v ? { background: d.color } : {}}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scale legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-400 pb-2">
        {LEVEL_LABELS.map((label, i) => (
          <span key={label}>
            <strong className="text-slate-500">{i + 1}</strong> = {label}
          </span>
        ))}
      </div>
    </div>
  )
}
