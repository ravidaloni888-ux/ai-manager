import { useEffect, useState } from 'react'
import { useEnablementStore } from '../store/enablementStore'
import { useAuthStore } from '../store/authStore'
import { TRAINING_TOPICS, DEPARTMENTS, TrainingTopicKey, TrainingStatus, EnablementData } from '../types'

const NEXT: Record<TrainingStatus, TrainingStatus> = { open: 'planned', planned: 'done', done: 'open' }

const TOPIC_CLR: Record<string, { border: string; badge: string; badgeText: string }> = {
  blue:   { border: 'border-l-blue-500',   badge: 'bg-blue-100',   badgeText: 'text-blue-700' },
  indigo: { border: 'border-l-indigo-500', badge: 'bg-indigo-100', badgeText: 'text-indigo-700' },
  red:    { border: 'border-l-red-500',    badge: 'bg-red-100',    badgeText: 'text-red-700' },
  amber:  { border: 'border-l-amber-500',  badge: 'bg-amber-100',  badgeText: 'text-amber-700' },
  green:  { border: 'border-l-green-500',  badge: 'bg-green-100',  badgeText: 'text-green-700' },
  orange: { border: 'border-l-orange-500', badge: 'bg-orange-100', badgeText: 'text-orange-700' },
  purple: { border: 'border-l-purple-500', badge: 'bg-purple-100', badgeText: 'text-purple-700' },
}

function statusCls(s: TrainingStatus) {
  if (s === 'done')    return 'bg-green-100 text-green-700 font-semibold'
  if (s === 'planned') return 'bg-amber-100 text-amber-700'
  return 'text-slate-300'
}
function statusLabel(s: TrainingStatus) {
  if (s === 'done')    return '✓'
  if (s === 'planned') return 'Plan'
  return '—'
}

function getStatus(data: EnablementData, dept: string, key: TrainingTopicKey): TrainingStatus {
  return data.trainingMap[dept]?.[key] ?? 'open'
}

function computeStats(data: EnablementData) {
  const total = DEPARTMENTS.length * TRAINING_TOPICS.length
  let done = 0, topicsFull = 0, deptsFull = 0
  for (const dept of DEPARTMENTS) {
    const d = TRAINING_TOPICS.filter(t => getStatus(data, dept, t.key) === 'done').length
    if (d === TRAINING_TOPICS.length) deptsFull++
    done += d
  }
  for (const t of TRAINING_TOPICS) {
    if (DEPARTMENTS.every(d => getStatus(data, d, t.key) === 'done')) topicsFull++
  }
  return { pct: Math.round(done / total * 100), done, total, topicsFull, deptsFull }
}

export default function EnablementPage() {
  const [tab, setTab] = useState<'map' | 'library'>('map')
  const { data, loading, saving, init, setStatus, save } = useEnablementStore()
  const user = useAuthStore(s => s.user)

  useEffect(() => { init() }, [init])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stats = computeStats(data)

  return (
    <div className="px-6 py-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Enablement & Coaching</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Step 4 · Mitarbeitende schulen — 7 Kernthemen aus dem KI-Einführungsframework
          </p>
        </div>
        {tab === 'map' && user && (
          <button
            onClick={save}
            disabled={saving}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        )}
      </div>

      {/* KPIs */}
      {tab === 'map' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Gesamtbereitschaft</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">{stats.pct}%</span>
              <span className="text-xs text-slate-400 mb-1">{stats.done}/{stats.total} Schulungen</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${stats.pct}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Themen vollständig</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {stats.topicsFull}<span className="text-base font-normal text-slate-400">/{TRAINING_TOPICS.length}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">in allen Abteilungen abgeschlossen</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Abteilungen voll geschult</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {stats.deptsFull}<span className="text-base font-normal text-slate-400">/{DEPARTMENTS.length}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">alle 7 Themen abgeschlossen</p>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['map', 'library'] as const).map(key => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {key === 'map' ? 'Training Map' : 'Topic Library'}
          </button>
        ))}
      </div>

      {/* Training Map */}
      {tab === 'map' && (
        <div className="bg-white rounded-xl border border-slate-200">
          {!user && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 rounded-t-xl">
              Nur zum Lesen — bitte anmelden, um den Schulungsstatus zu bearbeiten.
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 border-b border-slate-100 min-w-[130px]">
                    Abteilung
                  </th>
                  {TRAINING_TOPICS.map(t => {
                    const clr = TOPIC_CLR[t.color]
                    return (
                      <th key={t.key} className="text-center px-2 py-3 border-b border-slate-100 min-w-[84px]">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${clr.badge} ${clr.badgeText}`}>
                          {t.short}
                        </span>
                      </th>
                    )
                  })}
                  <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 border-b border-slate-100 min-w-[88px]">
                    % Fertig
                  </th>
                </tr>
              </thead>
              <tbody>
                {DEPARTMENTS.map((dept, di) => {
                  const deptDone = TRAINING_TOPICS.filter(t => getStatus(data, dept, t.key) === 'done').length
                  const deptPct = Math.round(deptDone / TRAINING_TOPICS.length * 100)
                  const rowBg = di % 2 === 0 ? '#fff' : '#fafafa'
                  return (
                    <tr key={dept}>
                      <td className="sticky left-0 z-10 px-4 py-2 font-medium text-slate-700 border-b border-slate-50 text-sm" style={{ background: rowBg }}>
                        {dept}
                      </td>
                      {TRAINING_TOPICS.map(topic => {
                        const s = getStatus(data, dept, topic.key)
                        return (
                          <td key={topic.key} className="text-center px-1 py-1.5 border-b border-slate-50" style={{ background: rowBg }}>
                            <button
                              onClick={() => user && setStatus(dept, topic.key, NEXT[s])}
                              title={user ? `Status wechseln (aktuell: ${s})` : 'Anmelden zum Bearbeiten'}
                              className={`w-full px-2 py-1 rounded text-xs transition-all ${statusCls(s)} ${user ? 'hover:opacity-75 cursor-pointer' : 'cursor-default'}`}
                            >
                              {statusLabel(s)}
                            </button>
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 border-b border-slate-50" style={{ background: rowBg }}>
                        <div className="flex items-center gap-1.5 justify-end">
                          <div className="w-10 bg-slate-100 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${deptPct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 w-8 text-right">{deptPct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="sticky left-0 z-10 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide border-t border-slate-200">
                    % Fertig
                  </td>
                  {TRAINING_TOPICS.map(t => {
                    const done = DEPARTMENTS.filter(d => getStatus(data, d, t.key) === 'done').length
                    const pct = Math.round(done / DEPARTMENTS.length * 100)
                    return (
                      <td key={t.key} className="text-center px-1 py-2.5 bg-slate-50 border-t border-slate-200">
                        <span className={`text-xs font-semibold ${pct === 100 ? 'text-green-600' : pct > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                          {pct}%
                        </span>
                      </td>
                    )
                  })}
                  <td className="bg-slate-50 border-t border-slate-200" />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="text-slate-300 font-bold text-sm">—</span> Offen</span>
            <span className="flex items-center gap-1.5"><span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px]">Plan</span> Geplant</span>
            <span className="flex items-center gap-1.5"><span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">✓</span> Abgeschlossen</span>
            {user && <span className="ml-auto">Zelle anklicken zum Wechseln des Status</span>}
          </div>
        </div>
      )}

      {/* Topic Library */}
      {tab === 'library' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {TRAINING_TOPICS.map((topic, i) => {
            const clr = TOPIC_CLR[topic.color]
            return (
              <div key={topic.key} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${clr.border} p-5 space-y-3 flex flex-col`}>
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full ${clr.badge} ${clr.badgeText} text-xs font-bold flex items-center justify-center`}>
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">{topic.label}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{topic.description}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">👥 {topic.audience}</span>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">⏱ {topic.duration}</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-300 uppercase tracking-wide">Quelle: velpTEC K7.0069 · Strategische Planung</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
