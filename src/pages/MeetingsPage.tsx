import { useEffect, useState } from 'react'
import { useMeetingsStore } from '../store/meetingsStore'
import { useAuthStore } from '../store/authStore'
import { MeetingConfig, MeetingStatus, MeetingsData } from '../types'

// ── Static data ─────────────────────────────────────────────────────────────
const SLOT_H = 30          // px per 30-min slot
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8)  // 8..18
const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr']
const DAY_NAMES  = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']
const TIME_OPTS  = Array.from({ length: 20 }, (_, i) => {
  const h = 8 + Math.floor(i / 2), m = i % 2 === 0 ? 0 : 30
  return { h, m, v: `${h}:${m.toString().padStart(2, '0')}` }
})

interface Def {
  id: string; name: string
  cadence: 'weekly' | 'biweekly' | 'monthly' | 'quarterly'
  cadenceLabel: string; durationMin: number; participants: string; description: string
  bg: string; text: string; border: string; badge: string; badgeText: string
  defaultDay: number; defaultHour: number
}

const DEFS: Def[] = [
  {
    id: 'trend_scouting', name: 'Trend Scouting',
    cadence: 'weekly', cadenceLabel: 'Wöchentlich', durationMin: 30,
    participants: 'KI-Manager (+ IT)', description: 'Neue KI-Tools, Papers und Wettbewerber screenen',
    bg: '#dbeafe', text: '#1e40af', border: '#3b82f6', badge: '#bfdbfe', badgeText: '#1d4ed8',
    defaultDay: 0, defaultHour: 9,
  },
  {
    id: 'use_case_review', name: 'Use Case Review',
    cadence: 'biweekly', cadenceLabel: '2-wöchentlich', durationMin: 60,
    participants: 'KI-Manager + Projektteams', description: 'Status aktiver Use Cases, Pilot-Fortschritt, Blocker',
    bg: '#dcfce7', text: '#14532d', border: '#22c55e', badge: '#bbf7d0', badgeText: '#166534',
    defaultDay: 2, defaultHour: 14,
  },
  {
    id: 'governance_review', name: 'Governance Review',
    cadence: 'monthly', cadenceLabel: 'Monatlich', durationMin: 90,
    participants: 'KI-Manager + DPO + Security', description: 'KI-Richtlinie, Compliance-Status, Rollen prüfen',
    bg: '#ffedd5', text: '#7c2d12', border: '#f97316', badge: '#fed7aa', badgeText: '#c2410c',
    defaultDay: 1, defaultHour: 10,
  },
  {
    id: 'tech_scouting_sync', name: 'Tech Scouting Sync',
    cadence: 'monthly', cadenceLabel: 'Monatlich', durationMin: 60,
    participants: 'KI-Manager + IT', description: 'Neue Technologien bewerten, Radar aktualisieren',
    bg: '#ccfbf1', text: '#134e4a', border: '#14b8a6', badge: '#99f6e4', badgeText: '#0f766e',
    defaultDay: 0, defaultHour: 13,
  },
  {
    id: 'ki_schulung', name: 'KI-Schulung / Enablement',
    cadence: 'monthly', cadenceLabel: 'Monatlich', durationMin: 120,
    participants: 'Alle relevanten Teams', description: 'Thema aus Topic Library · Workshop oder E-Learning',
    bg: '#f3e8ff', text: '#581c87', border: '#a855f7', badge: '#e9d5ff', badgeText: '#7e22ce',
    defaultDay: 4, defaultHour: 14,
  },
  {
    id: 'ki_strategie', name: 'KI-Strategie Jour Fixe',
    cadence: 'quarterly', cadenceLabel: 'Quartalsweise', durationMin: 120,
    participants: 'C-Level + KI-Manager', description: 'Roadmap, KPIs, strategische Ausrichtung',
    bg: '#1e293b', text: '#f8fafc', border: '#475569', badge: '#334155', badgeText: '#e2e8f0',
    defaultDay: 3, defaultHour: 10,
  },
]

const STATUS_NEXT: Record<MeetingStatus, MeetingStatus> = {
  active: 'pending', pending: 'skip', skip: 'active',
}
const STATUS_LABEL: Record<MeetingStatus, string> = {
  active: '✓ Eingerichtet', pending: '⏳ Ausstehend', skip: '— Nicht relevant',
}
const STATUS_CLS: Record<MeetingStatus, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  skip: 'bg-slate-100 text-slate-400',
}

function effCfg(data: MeetingsData, def: Def): MeetingConfig {
  return data.configs[def.id] ?? {
    status: 'pending', dayOfWeek: def.defaultDay, startHour: def.defaultHour, startMinute: 0,
  }
}

// ── Week view ────────────────────────────────────────────────────────────────
function WeekView({ data }: { data: MeetingsData }) {
  const totalH = 20 * SLOT_H  // 8:00–18:00

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(5, 1fr)' }}
        className="bg-slate-50 border-b border-slate-100">
        <div />
        {DAY_LABELS.map(d => (
          <div key={d} className="py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      {/* Scrollable calendar body */}
      <div style={{ overflowY: 'auto', maxHeight: 460 }}>
        <div style={{ display: 'flex', height: totalH }}>
          {/* Time labels */}
          <div style={{ width: 48, flexShrink: 0, position: 'relative', borderRight: '1px solid #f1f5f9' }}>
            {HOURS.map(h => (
              <div key={h}
                style={{ position: 'absolute', top: (h - 8) * 2 * SLOT_H - 7, right: 8 }}
                className="text-[9px] text-slate-300 leading-none select-none">
                {h}:00
              </div>
            ))}
          </div>
          {/* Day columns */}
          {[0, 1, 2, 3, 4].map(day => {
            const dayDefs = DEFS.filter(def => {
              const cfg = effCfg(data, def)
              return cfg.dayOfWeek === day && cfg.status !== 'skip'
            })
            return (
              <div key={day} style={{
                flex: 1, position: 'relative',
                borderRight: day < 4 ? '1px solid #f1f5f9' : 'none',
              }}>
                {/* Grid lines */}
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} style={{
                    position: 'absolute', top: i * SLOT_H, left: 0, right: 0, height: 1,
                    background: i % 2 === 0 ? '#f1f5f9' : '#fafafa',
                  }} />
                ))}
                {/* Events */}
                {dayDefs.map(def => {
                  const cfg = effCfg(data, def)
                  const top = ((cfg.startHour - 8) * 2 + cfg.startMinute / 30) * SLOT_H
                  const height = (def.durationMin / 30) * SLOT_H
                  return (
                    <div key={def.id} style={{
                      position: 'absolute', top: top + 1, left: 2, right: 2, height: height - 2,
                      background: def.bg, color: def.text,
                      borderLeft: `3px solid ${def.border}`,
                      opacity: cfg.status === 'pending' ? 0.6 : 1,
                      borderRadius: 4, overflow: 'hidden', padding: '3px 6px', zIndex: 10,
                    }}>
                      <p style={{ fontSize: 9, fontWeight: 700, lineHeight: 1.3, margin: 0 }}
                        className="truncate">{def.name}</p>
                      {height > 38 && (
                        <p style={{ fontSize: 8, opacity: 0.75, margin: 0 }}>
                          {cfg.startHour}:{cfg.startMinute.toString().padStart(2, '0')} · {def.durationMin}min
                        </p>
                      )}
                      {height > 56 && (
                        <span style={{
                          background: def.badge, color: def.badgeText,
                          fontSize: 7, fontWeight: 700, padding: '1px 5px',
                          borderRadius: 8, display: 'inline-block', marginTop: 2,
                        }}>
                          {def.cadenceLabel}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Month view ───────────────────────────────────────────────────────────────
function MonthView({ data }: { data: MeetingsData }) {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const firstDow    = (new Date(year, month, 1).getDay() + 6) % 7  // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName   = new Date(year, month).toLocaleString('de-DE', { month: 'long', year: 'numeric' })
  const isQuarterMonth = [0, 3, 6, 9].includes(month) // Jan, Apr, Jul, Oct

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function dayMeetings(day: number) {
    const date    = new Date(year, month, day)
    const dow     = (date.getDay() + 6) % 7
    const weekNum = Math.ceil((day + firstDow) / 7)
    const isLast  = day + 7 > daysInMonth
    return DEFS.filter(def => {
      const cfg = effCfg(data, def)
      if (cfg.status === 'skip') return false
      if (cfg.dayOfWeek !== dow) return false
      if (def.cadence === 'weekly')   return true
      if (def.cadence === 'biweekly') return weekNum % 2 === 1
      if (def.cadence === 'monthly') {
        if (def.id === 'ki_schulung')       return isLast
        if (def.id === 'tech_scouting_sync') return weekNum === 2
        return weekNum === 1
      }
      if (def.cadence === 'quarterly') return isQuarterMonth && weekNum === 1
      return false
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800 capitalize">{monthName}</p>
        <p className="text-xs text-slate-400">Typischer Monatsüberblick</p>
      </div>
      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
        className="bg-slate-50 border-b border-slate-100">
        {['Mo','Di','Mi','Do','Fr','Sa','So'].map(d => (
          <div key={d} className="text-center py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, i) => {
          const isWe   = i % 7 >= 5
          const meetings = day && !isWe ? dayMeetings(day) : []
          return (
            <div key={i} style={{
              minHeight: 72, borderRight: '1px solid #f8fafc', borderBottom: '1px solid #f8fafc',
              padding: 6, background: (!day || isWe) ? '#fafafa' : 'white',
            }}>
              {day && (
                <>
                  <div style={{
                    width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', fontSize: 10, fontWeight: 600, marginBottom: 3,
                    background: day === today ? '#2563eb' : 'transparent',
                    color: day === today ? 'white' : '#cbd5e1',
                  }}>
                    {day}
                  </div>
                  {meetings.slice(0, 3).map(def => {
                    const cfg = effCfg(data, def)
                    return (
                      <div key={def.id} style={{
                        background: def.bg, color: def.text,
                        borderLeft: `2px solid ${def.border}`,
                        opacity: cfg.status === 'pending' ? 0.65 : 1,
                        fontSize: 8, fontWeight: 600, padding: '2px 4px',
                        borderRadius: 3, marginBottom: 2,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      }}>
                        {def.name}
                      </div>
                    )
                  })}
                  {meetings.length > 3 && (
                    <div style={{ fontSize: 8, color: '#94a3b8' }}>+{meetings.length - 3}</div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function MeetingsPage() {
  const [tab, setTab] = useState<'week' | 'month'>('week')
  const { data, loading, saving, init, updateConfig, save } = useMeetingsStore()
  const user = useAuthStore(s => s.user)

  useEffect(() => { init() }, [init])

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const activeCount = DEFS.filter(d => (data.configs[d.id]?.status ?? 'pending') === 'active').length

  function handleUpdate(def: Def, patch: Partial<MeetingConfig>) {
    const current = effCfg(data, def)
    updateConfig(def.id, { ...current, ...patch })
  }

  return (
    <div className="px-6 py-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Regeltermine</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Wiederkehrende KI-Meetings konfigurieren und im Überblick behalten
          </p>
        </div>
        {user && (
          <button onClick={save} disabled={saving}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        )}
      </div>

      {/* KPI + legend row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Eingerichtet</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {activeCount}<span className="text-base font-normal text-slate-400">/{DEFS.length}</span>
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-green-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(activeCount / DEFS.length) * 100}%` }} />
          </div>
        </div>
        <div className="col-span-3 bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Alle Termine</p>
          <div className="flex flex-wrap gap-2">
            {DEFS.map(def => {
              const status = data.configs[def.id]?.status ?? 'pending'
              return (
                <span key={def.id} style={{
                  background: def.bg, color: def.text,
                  borderLeft: `3px solid ${def.border}`,
                  opacity: status === 'skip' ? 0.4 : 1,
                }} className="text-[10px] font-semibold px-2.5 py-1 rounded-r-md flex items-center gap-2">
                  {def.name}
                  <span style={{ background: def.badge, color: def.badgeText }}
                    className="text-[8px] font-bold px-1.5 rounded-full">{def.cadenceLabel}</span>
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['week', 'month'] as const).map(k => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {k === 'week' ? 'Wochenansicht' : 'Monatsansicht'}
          </button>
        ))}
      </div>

      {/* Calendar */}
      {tab === 'week' ? <WeekView data={data} /> : <MonthView data={data} />}

      {/* Config cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">Termindetails & Konfiguration</h2>
          {!user && <p className="text-xs text-amber-600">Anmelden zum Bearbeiten</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEFS.map(def => {
            const cfg    = effCfg(data, def)
            const status = cfg.status
            return (
              <div key={def.id}
                style={{ borderLeft: `4px solid ${def.border}`, opacity: status === 'skip' ? 0.5 : 1 }}
                className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-bold text-slate-900">{def.name}</span>
                      <span style={{ background: def.badge, color: def.badgeText }}
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {def.cadenceLabel} · {def.durationMin}min
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{def.description}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">👥 {def.participants}</p>
                  </div>
                  <button
                    onClick={() => user && handleUpdate(def, { status: STATUS_NEXT[status] })}
                    className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_CLS[status]} ${user ? 'cursor-pointer' : 'cursor-default'}`}>
                    {STATUS_LABEL[status]}
                  </button>
                </div>
                {user && status !== 'skip' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50 flex-wrap">
                    <span className="text-[10px] text-slate-400 flex-shrink-0">Zeitpunkt:</span>
                    <select
                      value={cfg.dayOfWeek}
                      onChange={e => handleUpdate(def, { dayOfWeek: Number(e.target.value) })}
                      className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                      {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                    <select
                      value={`${cfg.startHour}:${cfg.startMinute.toString().padStart(2, '0')}`}
                      onChange={e => {
                        const [h, m] = e.target.value.split(':').map(Number)
                        handleUpdate(def, { startHour: h, startMinute: m })
                      }}
                      className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                      {TIME_OPTS.map(({ v }) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
