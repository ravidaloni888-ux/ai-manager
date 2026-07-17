import { useDemoStore } from '../../store/demoStore'
import { useUseCasesStore } from '../../store/useCasesStore'
import { useStrategyStore } from '../../store/strategyStore'
import { useRiskStore } from '../../store/riskStore'
import { useGovernanceStore } from '../../store/governanceStore'
import { useEnablementStore } from '../../store/enablementStore'
import { useMeetingsStore } from '../../store/meetingsStore'

export default function DemoToggle() {
  const { demoMode, setDemoMode } = useDemoStore()
  const initCases      = useUseCasesStore((s) => s.init)
  const initStrategy   = useStrategyStore((s) => s.init)
  const initRisks      = useRiskStore((s) => s.init)
  const initGovernance = useGovernanceStore((s) => s.init)
  const initEnablement = useEnablementStore((s) => s.init)
  const initMeetings   = useMeetingsStore((s) => s.init)

  const switchTo = (demo: boolean) => {
    setDemoMode(demo)
    setTimeout(() => {
      initCases()
      initStrategy()
      initRisks()
      initGovernance()
      initEnablement()
      initMeetings()
    }, 0)
  }

  return (
    <div className="flex items-center gap-1.5 bg-white/10 rounded-lg p-1">
      <button
        onClick={() => switchTo(true)}
        className={`text-xs font-semibold px-3 py-1 rounded-md transition-colors ${
          demoMode
            ? 'bg-amber-400 text-amber-900'
            : 'text-white/50 hover:text-white/80'
        }`}
      >
        Demo
      </button>
      <button
        onClick={() => switchTo(false)}
        className={`text-xs font-semibold px-3 py-1 rounded-md transition-colors ${
          !demoMode
            ? 'bg-green-400 text-green-900'
            : 'text-white/50 hover:text-white/80'
        }`}
      >
        Mein Bereich
      </button>
    </div>
  )
}
