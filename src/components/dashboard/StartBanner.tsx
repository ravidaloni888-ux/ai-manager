import { useNavigate } from 'react-router-dom'
import { loadProgress } from '../../store/wizardStore'

const TOTAL = 12

export default function StartBanner() {
  const navigate = useNavigate()
  const done = loadProgress()
  const count = done.size

  if (count >= TOTAL) return null

  const pct = Math.round((count / TOTAL) * 100)

  return (
    <div className="flex items-center gap-4 bg-blue-600 text-white rounded-xl px-5 py-3.5 shadow-md">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">
          Einstieg — {count} von {TOTAL} Schritten abgeschlossen
        </p>
        <div className="mt-1.5 h-1.5 bg-blue-500/50 rounded-full overflow-hidden w-full max-w-xs">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button
        onClick={() => navigate('/start')}
        className="flex-shrink-0 text-xs font-semibold bg-white text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
      >
        Weiter →
      </button>
    </div>
  )
}
