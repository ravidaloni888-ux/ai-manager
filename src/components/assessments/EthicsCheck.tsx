import { useState } from 'react'
import { Pruefblock, Fazit } from '../ui/Pruefung'

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
    <Pruefblock
      titel="Ethik — FAST-Bewertung"
      hinweis="Fairness · Accountability · Sustainability · Transparency. Die Analyse liest die Fallbeschreibung und benennt die betroffenen Dimensionen."
      stand={result
        ? <span className="text-[11px] text-slate-400 flex-shrink-0">bewertet</span>
        : undefined}
    >
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Fall beschreiben</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
          placeholder="Was macht das System? Welche Daten nutzt es? Wer ist betroffen? Welche Entscheidungen trifft es automatisch?&#10;&#10;Oder eine vorhandene Fallbeschreibung hineinkopieren — etwa aus einem Projektdokument."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-400 leading-relaxed"
        />
        <p className="text-[11px] text-slate-400 mt-1">Je mehr Kontext, desto präziser — Datenquellen, Entscheidungslogik, Zielgruppe.</p>
      </div>

      <button type="button"
        onClick={analyze}
        disabled={loading || !text.trim()}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Analysiere…
          </>
        ) : 'Ethisch bewerten'}
      </button>

      {error && (
        <Fazit ton="stopp" titel="Die Analyse ist fehlgeschlagen">{error}</Fazit>
      )}

      {/* Ergebnis */}
      {result && verdictStyle && (
        <div className={`rounded-lg border ${verdictStyle.border} ${verdictStyle.bg} overflow-hidden divide-y divide-inherit`}>
          <div className="px-4 py-3 flex items-start gap-3">
            <span className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded flex-shrink-0 mt-0.5 ${verdictStyle.badge}`}>
              {result.verdict}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${verdictStyle.text} leading-snug`}>{result.verdictReason}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <SeverityBadge s={result.severity} />
                <span className="text-[11px] text-slate-500 font-mono">Zone: <strong>{result.zone}</strong></span>
              </div>
            </div>
          </div>

          {result.fastDimensions.length > 0 && (
            <div className="px-4 py-3 space-y-2">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Betroffene FAST-Dimensionen</p>
              <div className="flex flex-wrap gap-2">
                {result.fastDimensions.map(d => <FastBadge key={d} dim={d} />)}
              </div>
              <div className="space-y-1.5 pt-1">
                {result.fastDimensions.map(d => result.fastExplanations[d] && (
                  <div key={d} className="flex gap-2 text-[12px]">
                    <span className="font-bold text-slate-600 flex-shrink-0 w-4">{d}</span>
                    <span className="text-slate-700 leading-relaxed">{result.fastExplanations[d]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 py-3 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Zentrale Schwachstelle</p>
            <p className="text-[12px] text-slate-800 leading-relaxed">{result.mainRisk}</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">{result.zoneExplanation}</p>
          </div>

          <div className="px-4 py-3 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Empfehlung für den KIB</p>
            <p className="text-[12px] text-slate-800 leading-relaxed">{result.recommendation}</p>
          </div>
        </div>
      )}
    </Pruefblock>
  )
}
