import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { STEPS } from '../../pages/StartPage'
import { useWizardStore } from '../../store/wizardStore'

export default function WizardBanner() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(search)
  const fromWizard = params.get('from') === 'wizard'
  const stepId = params.get('step')
  const [dismissed, setDismissed] = useState(false)
  const { done, toggle } = useWizardStore()

  if (!fromWizard || dismissed) return null

  const currentStep = STEPS.find((s) => s.id === stepId)
  const currentIdx  = currentStep ? STEPS.indexOf(currentStep) : -1
  const nextStep    = STEPS[currentIdx + 1] ?? null
  const isComplete  = currentStep ? done.has(currentStep.id) : false

  if (!currentStep) return null

  const markAndNext = () => {
    if (!isComplete) toggle(currentStep.id)
    if (nextStep) navigate(`${nextStep.to}?from=wizard&step=${nextStep.id}`)
    else navigate('/start')
  }

  return (
    <div className="flex-shrink-0 bg-blue-600 text-white px-5 py-3 flex items-center gap-4 no-print">
      {/* Step context */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 text-xs font-bold flex items-center justify-center">
          {currentStep.num}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight truncate">{currentStep.title}</p>
          <p className="text-[10px] text-blue-200 leading-tight">{currentStep.effort}</p>
        </div>
      </div>

      <div className="h-4 w-px bg-white/20 flex-shrink-0" />

      {/* Progress */}
      <p className="text-xs text-blue-100 flex-shrink-0 hidden sm:block">
        Step {currentStep.num} of {STEPS.length}
      </p>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {nextStep ? (
          <button
            onClick={markAndNext}
            className="flex items-center gap-1.5 bg-white text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {isComplete ? '' : '✓ Done — '}Next: {nextStep.title} →
          </button>
        ) : (
          <button
            onClick={() => { if (!isComplete) toggle(currentStep.id); navigate('/start') }}
            className="flex items-center gap-1.5 bg-white text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            ✓ Finish wizard
          </button>
        )}
        <button
          onClick={() => navigate('/start')}
          className="text-xs text-blue-200 hover:text-white transition-colors px-2 py-1.5"
        >
          Back to wizard
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-300 hover:text-white transition-colors p-1"
          title="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
