import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { useStrategyStore } from '../store/strategyStore'
import { useUseCasesStore } from '../store/useCasesStore'
import { useAuthStore } from '../store/authStore'
import {
  StrategyData, StrategyFocusArea, StrategyKPI,
  DEFAULT_STRATEGY, STATUS_BG, Status, DEPARTMENTS, AIUseCase,
} from '../types'
import { scoreColor } from '../lib/scoring'
import VisionWizard, { zielSatz } from '../components/strategy/VisionWizard'
import SwotTool from '../components/strategy/SwotTool'
import GapAnalyse from '../components/strategy/GapAnalyse'
import MaturityPage from './MaturityPage'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { loadFor } from '../lib/mandantData'
import { useIsDemo, useMandantId } from '../store/mandantStore'

type Tab = 'swot' | 'vision' | 'maturity' | 'gap' | 'focus' | 'roadmap' | 'investment'

const TABS: { id: Tab; label: string }[] = [
  { id: 'swot',       label: '① SWOT' },
  { id: 'vision',     label: '② KI-Vision' },
  { id: 'maturity',   label: '③ Reifegrad' },
  { id: 'gap',        label: '④ Gap-Analyse' },
  { id: 'focus',      label: '⑤ Schwerpunkte' },
  { id: 'roadmap',    label: 'Timeline' },
  { id: 'investment', label: 'Investitionen' },
]

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400'
const textareaCls = `${inputCls} resize-none`
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'

// Quarter where each status belongs on the roadmap
const QUARTER_MAP: Record<Status, string> = {
  'Production':           'Q2 2026',
  'Maintenance':          'Q2 2026',
  'Evaluation & Testing': 'Q3 2026',
  'Modeling & Piloting':  'Q4 2026',
  'Data Exploration':     'Q1 2027',
  'Problem Scoping':      'Q2 2027',
  'Idea':                 'Q2 2027',
  'Cancelled':            '',
}

const QUARTERS = ['Q2 2026', 'Q3 2026', 'Q4 2026', 'Q1 2027', 'Q2 2027']
const CURRENT_Q = 'Q2 2026'

const DEPT_BG: Record<string, string> = {
  Sales:              'bg-blue-100 text-blue-700',
  Operations:         'bg-green-100 text-green-700',
  'Customer Service': 'bg-pink-100 text-pink-700',
  Finance:            'bg-yellow-100 text-yellow-700',
  HR:                 'bg-rose-100 text-rose-700',
  IT:                 'bg-indigo-100 text-indigo-700',
  Legal:              'bg-purple-100 text-purple-700',
  Marketing:          'bg-orange-100 text-orange-700',
  Logistics:          'bg-cyan-100 text-cyan-700',
  Other:              'bg-slate-100 text-slate-600',
}

const FOCUS_ICONS: Record<string, string> = {
  'Customer Experience':    '😊',
  'Operational Efficiency': '⚙️',
  'Revenue Growth':         '📈',
  'Risk & Compliance':      '🛡️',
  'Innovation & R&D':       '💡',
  'HR & Talent':            '👥',
  'Data & Analytics':       '📊',
  'Sustainability':          '🌱',
}

const PRIORITY_OPTS: { value: StrategyFocusArea['priority']; label: string; cls: string }[] = [
  { value: 'High',   label: 'High',   cls: 'bg-red-100 text-red-700 border-red-200'     },
  { value: 'Medium', label: 'Med',    cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'Low',    label: 'Low',    cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'None',   label: '—',      cls: 'bg-white text-slate-400 border-slate-200'     },
]

export default function StrategyPage() {
  const { data, loading, saving, init, save } = useStrategyStore()
  const { useCases } = useUseCasesStore()
  const user = useAuthStore((s) => s.user)
  const istDemo = useIsDemo()
  const mandantId = useMandantId()
  const { search } = useLocation()
  const fromWizard = new URLSearchParams(search).get('from') === 'wizard'
  const [suchParams] = useSearchParams()
  // Im geführten Modus heisst der Parameter 'step'. Die IDs sind bis auf
  // den Strategieschritt deckungsgleich — der zeigt auf die Schwerpunkte.
  // Stand des Reifegrads für die Kennzahl oben — dieselbe Quelle wie der Reiter
  const [reifeBeantwortet, setReifeBeantwortet] = useState(0)
  useEffect(() => {
    let aktiv = true
    if (istDemo) { setReifeBeantwortet(18); return }
    loadFor<Record<string, number>>('maturity', async () => {
      try {
        const { data } = await supabase.from('ai_maturity').select('scores').eq('id', 'singleton').single()
        return (data?.scores ?? {}) as Record<string, number>
      } catch { return {} }
    }, {}).then((sc) => {
      if (aktiv) setReifeBeantwortet(Object.values(sc).filter((v) => v > 0).length)
    })
    return () => { aktiv = false }
  }, [mandantId, istDemo])

  const roh = suchParams.get('tab') ?? suchParams.get('step')
  const gewuenscht = (roh === 'strategie' ? 'focus' : roh) as Tab | null
  const [tab, setTab] = useState<Tab>(
    gewuenscht && TABS.some((t) => t.id === gewuenscht) ? gewuenscht : 'vision',
  )

  // Im geführten Modus bleibt diese Seite montiert, während der Schritt
  // wechselt — ohne diesen Effekt bliebe der zuerst geöffnete Reiter stehen.
  useEffect(() => {
    if (gewuenscht && TABS.some((t) => t.id === gewuenscht)) setTab(gewuenscht)
  }, [gewuenscht])
  const [local, setLocal] = useState<StrategyData>(DEFAULT_STRATEGY)
  const [saved, setSaved] = useState(false)

  useEffect(() => { init() }, [init])
  useEffect(() => { if (!loading) setLocal(data) }, [data, loading])

  const handleSave = async () => {
    await save(local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const visionFilled  = local.vision.trim().length > 0
  const focusSet      = local.focusAreas.filter((f) => f.priority !== 'None').length
  const budgetSet     = local.budgetTotalK > 0
  const kpiCount      = local.kpis.length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">KI-Strategie</h1>
          <p className="text-sm text-slate-500 mt-0.5">SWOT · Vision · Reifegrad · Gap · Schwerpunkte — K7.0069</p>
        </div>
        {tab !== 'roadmap' && user && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors min-w-[90px]"
          >
            {saving ? 'Speichern…' : saved ? '✓ Gespeichert' : 'Speichern'}
          </button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard icon="🎯" label="Vision"        value={visionFilled ? '✓ Gesetzt' : '— Leer'} ok={visionFilled} />
        <KpiCard icon="📊" label="Reifegrad"     value={reifeBeantwortet > 0 ? `${reifeBeantwortet} / 18` : '— Offen'} ok={reifeBeantwortet >= 18} />
        <KpiCard icon="🎚️" label="Schwerpunkte" value={`${focusSet} / 8`}                    ok={focusSet >= 4} />
        <KpiCard icon="💶" label="Budget"        value={budgetSet ? `€${local.budgetTotalK.toLocaleString()}k` : '— Nicht gesetzt'} ok={budgetSet} />
        <KpiCard icon="📌" label="KPIs verfolgt" value={`${kpiCount}`}                        ok={kpiCount > 0} />
      </div>

      {/* Tabs */}
      <div className="space-y-1.5">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              {fromWizard && t.id === 'vision' && (
                <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">nötig</span>
              )}
            </button>
          ))}
        </div>
        {fromWizard && (
          <p className="text-[11px] text-slate-400">
            Für den Assistenten-Schritt zählt nur <strong className="text-slate-500">KI-Vision</strong>. Schwerpunkte, Timeline und Investitionen können Sie später ergänzen.
          </p>
        )}
      </div>

      {/* Tab content */}
      {tab === 'swot'       && <SwotTool />}
      {tab === 'maturity'   && <MaturityPage eingebettet />}
      {tab === 'gap'        && <GapAnalyse strategie={local} />}
      {tab === 'vision'     && <VisionTab     local={local} setLocal={setLocal} readonly={!user} />}
      {tab === 'focus'      && <FocusTab      local={local} setLocal={setLocal} readonly={!user} />}
      {tab === 'roadmap'    && <RoadmapTab    useCases={useCases} />}
      {tab === 'investment' && <InvestmentTab local={local} setLocal={setLocal} readonly={!user} useCases={useCases} />}
    </div>
  )
}

// ─── KPI strip card ───────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, ok }: { icon: string; label: string; value: string; ok: boolean }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-sm font-bold ${ok ? 'text-slate-800' : 'text-slate-400'}`}>{value}</p>
      </div>
    </div>
  )
}

// ─── Vision tab ───────────────────────────────────────────────────────────────
function VisionTab({ local, setLocal, readonly }: { local: StrategyData; setLocal: (d: StrategyData) => void; readonly: boolean }) {
  const upd = (patch: Partial<StrategyData>) => setLocal({ ...local, ...patch })

  // Solange nichts steht, führt der Assistent. Danach zeigt die Seite das
  // Ergebnis und lässt es überarbeiten oder von Hand nachschärfen.
  const leer = !local.vision.trim()
  const [assistentAn, setAssistentAn] = useState(leer)
  const [freiformAn, setFreiformAn] = useState(false)

  if (assistentAn && !readonly) {
    return (
      <VisionWizard
        data={local}
        onFertig={(patch) => { upd(patch); setAssistentAn(false) }}
        onAbbrechen={leer ? undefined : () => setAssistentAn(false)}
      />
    )
  }

  const filledObjectives = local.objectives.filter((o) => (o ?? '').trim().length > 0).length
  const required = [
    { label: 'Vision-Statement formuliert',        ok: local.vision.trim().length > 0 },
    { label: 'Strategischen Horizont gewählt',     ok: !!local.horizon },
    { label: 'Drei strategische Ziele benannt',    ok: filledObjectives >= 3, partial: `${filledObjectives}/3` },
    { label: 'Zentrale Herausforderung beschrieben', ok: local.challenge.trim().length > 0 },
  ]
  const openCount = required.filter((r) => !r.ok).length

  return (
    <div className="space-y-4">
      {/* Was dieser Schritt braucht */}
      <div className={`rounded-xl border-2 px-5 py-4 ${openCount === 0 ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50'}`}>
        <p className={`text-sm font-bold ${openCount === 0 ? 'text-green-800' : 'text-blue-800'}`}>
          {openCount === 0 ? '✓ Alles ausgefüllt — Schritt kann abgeschlossen werden' : `Für diesen Schritt auszufüllen — noch ${openCount} offen`}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 mt-2.5">
          {required.map((r) => (
            <div key={r.label} className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border ${
                r.ok ? 'bg-green-500 border-transparent' : 'border-slate-300 bg-white'
              }`}>
                {r.ok && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </span>
              <span className={`text-xs ${r.ok ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                {r.label}
                {!r.ok && r.partial && <span className="text-slate-400"> · {r.partial}</span>}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-2.5">
          Nicht vergessen: oben rechts <strong>Speichern</strong>.
        </p>
      </div>
      {/* Ergebnis des Assistenten */}
      <div className="bg-white rounded-xl shadow-md p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">KI-Vision</h3>
          {!readonly && (
            <button
              type="button"
              onClick={() => setAssistentAn(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-500 flex-shrink-0"
            >
              Mit dem Assistenten überarbeiten →
            </button>
          )}
        </div>
        <p className="text-base text-slate-800 leading-relaxed">{local.vision || '—'}</p>

        <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
          <span>Horizont: <strong className="text-slate-700">bis {new Date().getFullYear() + Number(local.horizon)}</strong></span>
          {local.ambition && (
            <span>Ambition: <strong className="text-slate-700">
              {local.ambition === 'anwender' ? 'Anwender' : local.ambition === 'integrator' ? 'Integrator' : 'Entwickler'}
            </strong></span>
          )}
          {local.treiber && local.treiber.length > 0 && (
            <span>Auslöser: <strong className="text-slate-700">{local.treiber.length}</strong></span>
          )}
        </div>

        {!readonly && (
          <button
            type="button"
            onClick={() => setFreiformAn((v) => !v)}
            className="text-[11px] text-slate-400 hover:text-slate-600"
          >
            {freiformAn ? 'Direktbearbeitung ausblenden' : 'Satz von Hand nachschärfen'}
          </button>
        )}
        {freiformAn && !readonly && (
          <textarea
            rows={4}
            value={local.vision}
            onChange={(e) => upd({ vision: e.target.value })}
            className={textareaCls}
          />
        )}
      </div>

      {/* Horizon */}
      <div className="bg-white rounded-xl shadow-md p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Strategischer Horizont</h3>
        <div className="flex gap-2">
          {(['1', '2', '3', '5'] as const).map((y) => (
            <button
              key={y}
              disabled={readonly}
              onClick={() => upd({ horizon: y })}
              className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                local.horizon === y
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
              }`}
            >
              {y} J.
            </button>
          ))}
        </div>
      </div>

      {/* 3 Objectives */}
      <div className="bg-white rounded-xl shadow-md p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Top 3 Strategische Ziele</h3>
        <p className="text-xs text-slate-400">Konkrete, messbare Ziele, die KI innerhalb des Horizonts erreichen soll.</p>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <input
                type="text"
                disabled={readonly}
                value={local.objectives[i] ?? ''}
                onChange={(e) => {
                  const next = [...local.objectives]
                  next[i] = e.target.value
                  upd({ objectives: next })
                }}
                placeholder={[
                  'z.B. 30% der operativen Prozesse bis Jahresende automatisieren',
                  'z.B. KI in 3 kundenseitigen Touchpoints einsetzen',
                  'z.B. €2M jährliche Einsparungen durch KI-Effizienz erzielen',
                ][i]}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Challenge */}
      <div className="bg-white rounded-xl shadow-md p-5 space-y-2">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Zentrale Herausforderung / Handlungsdruck</h3>
        <p className="text-xs text-slate-400">Welcher Geschäftsdruck oder Wettbewerbsdruck macht die KI-Einführung dringend?</p>
        <textarea
          rows={3}
          disabled={readonly}
          value={local.challenge}
          onChange={(e) => upd({ challenge: e.target.value })}
          placeholder="z.B. Wettbewerber hat in Q1 einen KI-Service eingeführt und unseren Marktanteil um 8% reduziert…"
          className={textareaCls}
        />
      </div>
    </div>
  )
}

// ─── Focus Areas tab ──────────────────────────────────────────────────────────
function FocusTab({ local, setLocal, readonly }: { local: StrategyData; setLocal: (d: StrategyData) => void; readonly: boolean }) {
  const updArea = (i: number, patch: Partial<StrategyFocusArea>) => {
    const next = local.focusAreas.map((a, idx) => idx === i ? { ...a, ...patch } : a)
    setLocal({ ...local, focusAreas: next })
  }

  const highCount = local.focusAreas.filter((a) => a.priority === 'High').length
  const medCount  = local.focusAreas.filter((a) => a.priority === 'Medium').length

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Strategische Schwerpunkte</h3>
            <p className="text-xs text-slate-400 mt-0.5">Bewerten Sie jedes Thema danach, wie zentral es für Ihre KI-Strategie ist.</p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-semibold">{highCount} High</span>
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold">{medCount} Medium</span>
          </div>
        </div>

        <div className="space-y-2">
          {local.focusAreas.map((area, i) => (
            <div key={area.theme} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              area.priority === 'High'   ? 'bg-red-50 border-red-200'    :
              area.priority === 'Medium' ? 'bg-amber-50 border-amber-200' :
              area.priority === 'Low'    ? 'bg-slate-50 border-slate-100' :
              'bg-white border-slate-100'
            }`}>
              <span className="text-xl w-8 text-center flex-shrink-0">{FOCUS_ICONS[area.theme]}</span>
              <span className="w-44 text-sm font-semibold text-slate-700 flex-shrink-0">{area.theme}</span>
              <div className="flex gap-1 flex-shrink-0">
                {PRIORITY_OPTS.map((opt) => (
                  <button
                    key={opt.value}
                    disabled={readonly}
                    onClick={() => updArea(i, { priority: opt.value })}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                      area.priority === opt.value ? opt.cls + ' ring-1 ring-offset-1 ring-current' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                disabled={readonly}
                value={area.note}
                onChange={(e) => updArea(i, { note: e.target.value })}
                placeholder="Notiz hinzufügen…"
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white disabled:bg-transparent disabled:border-transparent"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Roadmap tab ──────────────────────────────────────────────────────────────
function RoadmapTab({ useCases }: { useCases: AIUseCase[] }) {
  const navigate = useNavigate()

  const byQuarter = QUARTERS.reduce<Record<string, typeof useCases>>((acc, q) => {
    acc[q] = useCases.filter((uc) => QUARTER_MAP[uc.status as Status] === q)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Portfolio-Roadmap</h3>
            <p className="text-xs text-slate-400 mt-0.5">Anwendungsfälle nach erwartetem Produktionsquartal basierend auf der aktuellen Phase.</p>
          </div>
          <span className="text-xs text-slate-400 italic">Karte anklicken zum Öffnen</span>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            {QUARTERS.map((q) => {
              const isCurrent = q === CURRENT_Q
              const cases = byQuarter[q] ?? []
              return (
                <div key={q} className="w-52 flex-shrink-0">
                  {/* Quarter header */}
                  <div className={`rounded-t-lg px-3 py-2 mb-2 flex items-center justify-between ${
                    isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <span className="text-xs font-bold">{q}</span>
                    {isCurrent && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-semibold">JETZT</span>}
                    {!isCurrent && <span className="text-[10px] font-semibold">{cases.length}</span>}
                    {isCurrent && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-semibold">{cases.length}</span>}
                  </div>

                  {/* Cards */}
                  <div className="space-y-2 min-h-[80px]">
                    {cases.length === 0 && (
                      <div className="h-16 border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-slate-300">—</span>
                      </div>
                    )}
                    {cases.map((uc) => (
                      <div
                        key={uc.id}
                        onClick={() => navigate(`/canvas/${uc.id}`)}
                        className="bg-white border border-slate-100 rounded-lg p-2.5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
                      >
                        <p className="text-xs font-semibold text-slate-800 leading-snug mb-1.5 group-hover:text-blue-700 transition-colors line-clamp-2">
                          {uc.title}
                        </p>
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${DEPT_BG[uc.department] ?? DEPT_BG.Other}`}>
                            {uc.department}
                          </span>
                          <span className={`text-[10px] font-bold ${scoreColor(uc.priorityScore)}`}>
                            {uc.priorityScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Phase legend */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
          {(['Production', 'Evaluation & Testing', 'Modeling & Piloting', 'Data Exploration', 'Idea'] as Status[]).map((s) => (
            <span key={s} className={`text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_BG[s]}`}>
              {s} → {QUARTER_MAP[s]}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Investment tab ───────────────────────────────────────────────────────────
function InvestmentTab({ local, setLocal, readonly, useCases }: {
  local: StrategyData
  setLocal: (d: StrategyData) => void
  readonly: boolean
  useCases: AIUseCase[]
}) {
  const upd = (patch: Partial<StrategyData>) => setLocal({ ...local, ...patch })

  // Portfolio cost by department from actual use cases
  const costByDept = DEPARTMENTS.reduce<Record<string, number>>((acc, d) => {
    acc[d] = useCases.filter((uc) => uc.department === d).reduce((s, uc) => s + uc.estimatedCostK, 0)
    return acc
  }, {})
  const maxCost = Math.max(...Object.values(costByDept), 1)
  const totalPortfolioCost = useCases.reduce((s, uc) => s + uc.estimatedCostK, 0)
  const totalPortfolioBenefit = useCases.reduce((s, uc) => s + uc.expectedBenefitK, 0)

  const addKpi = () => {
    const kpi: StrategyKPI = { id: nanoid(), metric: '', current: '', target: '', deadline: '' }
    upd({ kpis: [...local.kpis, kpi] })
  }

  const updateKpi = (id: string, patch: Partial<StrategyKPI>) => {
    upd({ kpis: local.kpis.map((k) => k.id === id ? { ...k, ...patch } : k) })
  }

  const deleteKpi = (id: string) => upd({ kpis: local.kpis.filter((k) => k.id !== id) })

  return (
    <div className="space-y-4">
      {/* Budget inputs */}
      <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Budget & ROI-Ziele</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Gesamtes KI-Investitionsbudget (€k)</label>
            <input
              type="number"
              disabled={readonly}
              value={local.budgetTotalK || ''}
              onChange={(e) => upd({ budgetTotalK: Number(e.target.value) })}
              placeholder="z.B. 2000"
              className={inputCls}
            />
            {local.budgetTotalK > 0 && totalPortfolioCost > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Portfolio gebunden: €{totalPortfolioCost.toLocaleString()}k
                ({Math.round((totalPortfolioCost / local.budgetTotalK) * 100)}% des Budgets)
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Ziel-Portfolio-ROI (%)</label>
            <input
              type="number"
              disabled={readonly}
              value={local.targetRoiPct || ''}
              onChange={(e) => upd({ targetRoiPct: Number(e.target.value) })}
              placeholder="z.B. 250"
              className={inputCls}
            />
            {totalPortfolioCost > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Portfolio aktuell: {Math.round(((totalPortfolioBenefit * 3 - totalPortfolioCost) / totalPortfolioCost) * 100)}% 3-J. ROI
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Cost by department */}
      <div className="bg-white rounded-xl shadow-md p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Portfolio-Kosten nach Abteilung</h3>
        <p className="text-xs text-slate-400">Abgeleitet aus den geschätzten Kosten aller Anwendungsfälle.</p>
        <div className="space-y-2">
          {DEPARTMENTS.filter((d) => costByDept[d] > 0)
            .sort((a, b) => costByDept[b] - costByDept[a])
            .map((dept) => (
              <div key={dept} className="flex items-center gap-3">
                <span className="w-32 text-xs font-medium text-slate-600 flex-shrink-0">{dept}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(costByDept[dept] / maxCost) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-16 text-right">
                  €{costByDept[dept].toLocaleString()}k
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* KPI table */}
      <div className="bg-white rounded-xl shadow-md p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Strategische KPIs</h3>
            <p className="text-xs text-slate-400 mt-0.5">Definieren Sie Kennzahlen, die den Erfolg der KI-Strategie messen.</p>
          </div>
          {!readonly && (
            <button
              onClick={addKpi}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              + KPI hinzufügen
            </button>
          )}
        </div>

        {local.kpis.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {readonly ? 'Noch keine KPIs definiert.' : 'Ersten KPI hinzufügen, um den strategischen Fortschritt zu verfolgen.'}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[1fr_120px_120px_120px_32px] gap-2 px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              <span>Kennzahl</span>
              <span>Aktuell</span>
              <span>Ziel</span>
              <span>Frist</span>
              <span />
            </div>
            {local.kpis.map((kpi) => (
              <div key={kpi.id} className="grid grid-cols-[1fr_120px_120px_120px_32px] gap-2 items-center bg-slate-50 rounded-lg px-2 py-1.5">
                <input
                  disabled={readonly}
                  value={kpi.metric}
                  onChange={(e) => updateKpi(kpi.id, { metric: e.target.value })}
                  placeholder="z.B. Anwendungsfälle in Produktion"
                  className="text-xs border-0 bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-300 w-full"
                />
                <input
                  disabled={readonly}
                  value={kpi.current}
                  onChange={(e) => updateKpi(kpi.id, { current: e.target.value })}
                  placeholder="e.g. 5"
                  className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-transparent disabled:border-transparent"
                />
                <input
                  disabled={readonly}
                  value={kpi.target}
                  onChange={(e) => updateKpi(kpi.id, { target: e.target.value })}
                  placeholder="e.g. 12"
                  className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-transparent disabled:border-transparent"
                />
                <input
                  disabled={readonly}
                  value={kpi.deadline}
                  onChange={(e) => updateKpi(kpi.id, { deadline: e.target.value })}
                  placeholder="e.g. Q4 2026"
                  className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-transparent disabled:border-transparent"
                />
                {!readonly && (
                  <button
                    onClick={() => deleteKpi(kpi.id)}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
