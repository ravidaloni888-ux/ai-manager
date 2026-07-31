import { useState } from 'react'

// Die ethische Bewertung braucht eine konkrete Fallbeschreibung — gehört an den Fall.

interface AnalysisResult {
  verdict: 'JA' | 'NEIN' | 'UNKLAR'
  verdictReason: string
  fastDimensions: ('F' | 'A' | 'S' | 'T')[]
  fastExplanations: Partial<Record<'F' | 'A' | 'S' | 'T', string>>
  zone: string
  zoneExplanation: string
  mainRisk: string
  recommendation: string
  severity: 'Hoch' | 'Mittel' | 'Niedrig'
}

const FAST = [
  {
    key: 'F' as const,
    label: 'Fairness',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    dot: 'bg-blue-500',
    desc: 'Kein KI-System darf Einzelpersonen oder Gruppen unzulässig benachteiligen. Inklusives Design, faire Algorithmen, disaggregierte Metriken.',
  },
  {
    key: 'A' as const,
    label: 'Accountability',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    dot: 'bg-amber-500',
    desc: 'Klare Verantwortlichkeiten für KI-Entscheidungen. Auditierbarkeit, Dokumentation, menschliche Aufsicht (Art. 14 KI-VO).',
  },
  {
    key: 'S' as const,
    label: 'Sustainability',
    color: 'bg-green-50 border-green-200 text-green-800',
    dot: 'bg-green-500',
    desc: 'Langfristige gesellschaftliche, ökonomische und ökologische Verträglichkeit. Arbeitsmarkt-Folgen, Sozialverträglichkeit.',
  },
  {
    key: 'T' as const,
    label: 'Transparency',
    color: 'bg-teal-50 border-teal-200 text-teal-800',
    dot: 'bg-teal-500',
    desc: 'Entscheidungen, Daten und Prozesse nachvollziehbar und kommunizierbar machen. Erklärbarkeit, Art. 13/26/50 KI-VO.',
  },
]

function FastBadge({ dim }: { dim: 'F' | 'A' | 'S' | 'T' }) {
  const f = FAST.find(x => x.key === dim)!
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${f.color}`}>
      <span className={`w-2 h-2 rounded-full ${f.dot}`} />
      {dim} — {f.label}
    </span>
  )
}

function SeverityBadge({ s }: { s: 'Hoch' | 'Mittel' | 'Niedrig' }) {
  const cls = s === 'Hoch' ? 'bg-red-100 text-red-700 border-red-200'
    : s === 'Mittel' ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-green-100 text-green-700 border-green-200'
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cls}`}>{s}</span>
}

// ── Wizard ────────────────────────────────────────────────────────────────────

export interface EthicsState {
  text: string
  result: AnalysisResult | null
}

export const EMPTY_ETHICS: EthicsState = { text: '', result: null }

export default function EthicsCheck({ value, onChange }: {
  value: EthicsState
  onChange: (fn: (prev: EthicsState) => EthicsState) => void
}) {
  const text = value.text
  const result = value.result
  const setText   = (v: string) => onChange(p => ({ ...p, text: v }))
  const setResult = (r: AnalysisResult | null) => onChange(p => ({ ...p, result: r }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyze = async () => {
    if (!text.trim()) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch('/api/ethics-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseText: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setResult(data as AnalysisResult)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const verdictStyle = result
    ? result.verdict === 'JA'
      ? { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-600 text-white' }
      : result.verdict === 'NEIN'
      ? { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-600 text-white' }
      : { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-500 text-white' }
    : null

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
      {/* Wizard header */}
      <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-0.5">KI-Ethik · Zweistufige Bewertung</p>
          <h2 className="text-white font-semibold text-base">Fall analysieren</h2>
        </div>
        <span className="text-2xl">⚖️</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Fall beschreiben
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            placeholder="Beschreibe den KI-Anwendungsfall: Was macht das System? Welche Daten nutzt es? Wer ist betroffen? Welche Entscheidungen trifft es automatisch?&#10;&#10;Oder kopiere einfach eine Fallbeschreibung rein — z.B. aus einem Projektdokument oder Pressebericht."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none placeholder:text-slate-400 leading-relaxed"
          />
          <p className="text-xs text-slate-400 mt-1">Je mehr Kontext, desto präziser die Analyse — Datenquellen, Entscheidungslogik, Zielgruppe.</p>
        </div>

        <button type="button"
          onClick={analyze}
          disabled={loading || !text.trim()}
          className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Analysiere…
            </>
          ) : '⚖️ Ethisch bewerten'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <strong>Fehler:</strong> {error}
          </div>
        )}

        {/* Result */}
        {result && verdictStyle && (
          <div className={`rounded-xl border ${verdictStyle.border} ${verdictStyle.bg} overflow-hidden`}>
            {/* Verdict strip */}
            <div className="px-5 py-4 flex items-start gap-4 border-b border-inherit">
              <span className={`text-xs font-black tracking-widest px-3 py-1.5 rounded-lg flex-shrink-0 mt-0.5 ${verdictStyle.badge}`}>
                {result.verdict}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${verdictStyle.text} leading-snug`}>{result.verdictReason}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <SeverityBadge s={result.severity} />
                  <span className="text-xs text-slate-500 font-mono">Zone: <strong>{result.zone}</strong></span>
                </div>
              </div>
            </div>

            {/* FAST dimensions */}
            {result.fastDimensions.length > 0 && (
              <div className="px-5 py-4 border-b border-inherit space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Betroffene FAST-Dimensionen</p>
                <div className="flex flex-wrap gap-2">
                  {result.fastDimensions.map(d => <FastBadge key={d} dim={d} />)}
                </div>
                <div className="space-y-2 mt-2">
                  {result.fastDimensions.map(d => result.fastExplanations[d] && (
                    <div key={d} className="flex gap-2 text-sm">
                      <span className="font-bold text-slate-600 flex-shrink-0 w-4">{d}</span>
                      <span className="text-slate-700">{result.fastExplanations[d]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main risk + zone */}
            <div className="px-5 py-4 border-b border-inherit space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Zentrale Schwachstelle</p>
              <p className="text-sm text-slate-800">{result.mainRisk}</p>
              <p className="text-xs text-slate-500 mt-1">{result.zoneExplanation}</p>
            </div>

            {/* Recommendation */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Empfehlung für den KIB</p>
              <p className="text-sm text-slate-800 leading-relaxed">{result.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
