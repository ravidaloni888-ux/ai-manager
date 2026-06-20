import { create } from 'zustand'
import { StepId, loadProgress, saveProgress } from '../pages/StartPage'
import { getDemoMode } from './demoStore'

// Which step IDs cover each route (a route is "done" if ANY of its steps is done)
export const ROUTE_STEPS: Record<string, StepId[]> = {
  '/strategy':   ['vision'],
  '/maturity':   ['maturity'],
  '/governance': ['governance', 'roles'],
  '/use-cases':  ['usecases', 'score', 'eu-act'],
  '/risk':       ['risks'],
  '/roadmap':    ['roadmap'],
  '/roi':        ['roi'],
  '/enablement': ['enablement'],
  '/meetings':   ['meetings'],
}

interface WizardStore {
  done: Set<StepId>
  init: () => void
  toggle: (id: StepId) => void
}

export const useWizardStore = create<WizardStore>()((set, get) => ({
  done: loadProgress(),

  init: () => {
    set({ done: loadProgress() })
  },

  toggle: (id) => {
    const next = new Set(get().done)
    next.has(id) ? next.delete(id) : next.add(id)
    saveProgress(next)
    set({ done: next })
  },
}))
