import { create } from 'zustand'
import { getDemoMode } from './demoStore'

export type StepId =
  | 'vision' | 'maturity' | 'governance' | 'roles'
  | 'usecases' | 'score' | 'eu-act'
  | 'risks' | 'roadmap' | 'roi'
  | 'enablement' | 'meetings'

export const ALL_STEP_IDS: StepId[] = [
  'vision', 'maturity', 'governance', 'roles',
  'usecases', 'score', 'eu-act',
  'risks', 'roadmap', 'roi',
  'enablement', 'meetings',
]

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

const LS_KEY = 'ai_start_v1'

export function loadProgress(): Set<StepId> {
  try {
    if (getDemoMode()) return new Set(ALL_STEP_IDS)
    const raw = localStorage.getItem(LS_KEY)
    return raw ? new Set<StepId>(JSON.parse(raw)) : new Set(ALL_STEP_IDS)
  } catch { return new Set(ALL_STEP_IDS) }
}

export function saveProgress(done: Set<StepId>) {
  if (getDemoMode()) return
  try { localStorage.setItem(LS_KEY, JSON.stringify([...done])) } catch {}
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
