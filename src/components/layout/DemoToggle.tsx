import { useDemoStore } from '../../store/demoStore'
import { useUseCasesStore } from '../../store/useCasesStore'
import { useStrategyStore } from '../../store/strategyStore'
import { useRiskStore } from '../../store/riskStore'

export default function DemoToggle() {
  const { demoMode, setDemoMode } = useDemoStore()
  const initCases    = useUseCasesStore((s) => s.init)
  const initStrategy = useStrategyStore((s) => s.init)
  const initRisks    = useRiskStore((s) => s.init)

  const switchTo = (demo: boolean) => {
    setDemoMode(demo)
    // Re-initialise all data stores after the flag is written
    setTimeout(() => {
      initCases()
      initStrategy()
      initRisks()
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
        My Workspace
      </button>
    </div>
  )
}
