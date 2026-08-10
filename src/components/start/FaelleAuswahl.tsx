import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUseCasesStore } from '../../store/useCasesStore'
import { getMandantType } from '../../store/mandantStore'
import { scopedGet } from '../../lib/mandantData'
import { loadAllCaseChecks } from '../../lib/supabase'
import type { CaseChecks } from '../compliance/CaseComplianceChecks'
import type { StepId } from '../../store/wizardStore'

// ─────────────────────────────────────────────────────────────────────────
// Vier Schritte des Programms sind Arbeit je Anwendungsfall. Statt den
// Nutzer auf die Liste zu werfen, zeigt dieser Block seine Fälle mit dem
// Stand genau dieser Prüfung — ein Klick springt an die richtige Stelle
// im Canvas.
// ─────────────────────────────────────────────────────────────────────────

/** Welcher Wizard-Schritt prüft was, und wo im Canvas liegt das? */
const ZIEL: Record<string, { check: string; label: string }> = {
  'usecases':     { check: '',           label: 'Anwendungsfälle' },
  'data-quality': { check: 'datengrundlage',  label: 'Datengrundlage' },
  'score':        { check: 'bewertung',  label: 'Bewertung' },
  'eu-act':       { check: 'risiko',     label: 'Risikoklasse' },
  'project-plan': { check: 'plan',       label: 'To-do-Plan' },
}

/** Ist die Prüfung für diesen Fall erledigt? */
function istErledigt(step: StepId, checks: CaseChecks | undefined, uc: { businessImpact?: number }): boolean {
  // Beim Inventarisieren zählt allein, dass der Fall existiert
  if (step === 'usecases') return true
  if (step === 'score') return typeof uc.businessImpact === 'number'
  if (!checks) return false
  switch (step) {
    case 'data-quality':
      return Object.values(checks.dataQuality?.dims ?? {}).filter((d) => d.rating !== null).length === 6
    case 'eu-act':
      return !!checks.riskClass?.done
    case 'project-plan':
      // Der Plan entsteht aus den Prüfungen — er gilt als angegangen,
      // sobald die Risikoklasse steht.
      return !!checks.riskClass?.done
    default:
      return false
  }
}

interface Props {
  step: StepId
  /** Im geführten Modus: Fall im Rahmen öffnen statt wegzunavigieren */
  onFallWaehlen?: (id: string, check: string) => void
  /** Im geführten Modus: Anlage-Wizard im Rahmen öffnen */
  onNeu?: () => void
}

export default function FaelleAuswahl({ step, onFallWaehlen, onNeu }: Props) {
  const navigate = useNavigate()
  const { useCases } = useUseCasesStore()
  const [alleChecks, setAlleChecks] = useState<Record<string, CaseChecks>>({})
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    let aktiv = true
    const lokal = () => scopedGet<Record<string, CaseChecks>>('casechecks', {})

    if (getMandantType() === 'internal') {
      loadAllCaseChecks().then((remote) => {
        if (!aktiv) return
        // Lokales als Rückfall, falls die Tabelle noch nicht eingespielt ist
        setAlleChecks({ ...lokal(), ...(remote as Record<string, CaseChecks>) })
        setGeladen(true)
      })
    } else {
      setAlleChecks(lokal())
      setGeladen(true)
    }
    return () => { aktiv = false }
  }, [step])

  const ziel = ZIEL[step]
  if (!ziel) return null

  const fertig = useCases.filter((uc) => istErledigt(step, alleChecks[uc.id], uc))
  const offen  = useCases.filter((uc) => !istErledigt(step, alleChecks[uc.id], uc))

  return (
    <div className="px-6 pt-5 max-w-3xl">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">
              {step === 'usecases' ? 'Erfasste Anwendungsfälle' : `${ziel.label} je Anwendungsfall`}
            </p>
            {useCases.length > 0 && (
              <span className="text-xs font-semibold text-blue-600 flex-shrink-0">
                {step === 'usecases' ? `${useCases.length} erfasst` : `${fertig.length}/${useCases.length} erledigt`}
              </span>
            )}
          </div>
          {useCases.length > 0 && step !== 'usecases' && (
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
                   style={{ width: `${Math.round((fertig.length / useCases.length) * 100)}%` }} />
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-2">
            {step === 'usecases'
              ? 'Jede KI-Initiative gehört hier hinein — auch laufende und nur angedachte.'
              : 'Ein Klick öffnet den Fall direkt an dieser Prüfung.'}
          </p>
        </div>

        {useCases.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-slate-500">Noch kein Anwendungsfall erfasst.</p>
            <button
              type="button"
              onClick={() => (onNeu ? onNeu() : navigate('/canvas/new'))}
              className="mt-3 text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              Ersten Anwendungsfall anlegen →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {[...offen, ...fertig].map((uc) => {
              const done = istErledigt(step, alleChecks[uc.id], uc)
              return (
                <button
                  key={uc.id}
                  type="button"
                  onClick={() => onFallWaehlen
                    ? onFallWaehlen(uc.id, ziel.check)
                    : navigate(`/canvas/${uc.id}${ziel.check ? `?check=${ziel.check}` : ''}`)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold ${
                    done ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {done ? '✓' : '·'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-tight truncate ${done ? 'text-slate-400' : 'font-medium text-slate-800'}`}>
                      {uc.title}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      {uc.department} · {uc.status}
                    </p>
                  </div>
                  <span className="text-xs text-slate-300 flex-shrink-0">→</span>
                </button>
              )
            })}
          </div>
        )}

        {useCases.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => (onNeu ? onNeu() : navigate('/canvas/new'))}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              + Weiteren Anwendungsfall anlegen
            </button>
          </div>
        )}

        {!geladen && (
          <p className="px-5 py-2 text-[11px] text-slate-400">Stand wird geladen…</p>
        )}
      </div>
    </div>
  )
}
