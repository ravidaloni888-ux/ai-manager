import { create } from 'zustand'
import { getDemoMode } from './demoStore'

export type StepId =
  // Phase 1 · Fundament
  | 'vision' | 'maturity'
  // Phase 2 · Rechtsrahmen & Ethik
  | 'eu-act-basics' | 'dsgvo' | 'ethics'
  // Phase 3 · Governance & Stakeholder
  | 'governance' | 'roles' | 'stakeholders'
  // Phase 4 · Portfolio & Priorisierung
  | 'usecases' | 'data-quality' | 'score' | 'eu-act' | 'project-plan'
  // Phase 5 · Risiko & Investition
  | 'risks' | 'vendors' | 'roadmap' | 'roi'
  // Phase 6 · Umsetzung & Betrieb
  | 'qa' | 'change' | 'enablement' | 'meetings'

export const ALL_STEP_IDS: StepId[] = [
  'vision', 'maturity',
  'eu-act-basics', 'dsgvo', 'ethics',
  'governance', 'roles', 'stakeholders',
  'usecases', 'data-quality', 'score', 'eu-act', 'project-plan',
  'risks', 'vendors', 'roadmap', 'roi',
  'qa', 'change', 'enablement', 'meetings',
]

// Which step IDs cover each route (a route is "done" if ANY of its steps is done)
export const ROUTE_STEPS: Record<string, StepId[]> = {
  '/strategy':     ['vision'],
  '/maturity':     ['maturity'],
  '/eu-ai-act':    ['eu-act-basics'],
  '/dsgvo':        ['dsgvo'],
  '/ethik':        ['ethics'],
  '/governance':   ['governance', 'roles'],
  '/stakeholders': ['stakeholders'],
  '/use-cases':    ['usecases', 'score', 'eu-act'],
  '/data':         ['data-quality'],
  '/project-plan': ['project-plan'],
  '/risk':         ['risks'],
  '/vendors':      ['vendors'],
  '/roadmap':      ['roadmap'],
  '/roi':          ['roi'],
  '/qa':           ['qa'],
  '/change':       ['change'],
  '/enablement':   ['enablement'],
  '/meetings':     ['meetings'],
}

const LS_KEY = 'ai_start_v1'

export function loadProgress(): Set<StepId> {
  try {
    if (getDemoMode()) return new Set(ALL_STEP_IDS)
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return new Set()
    // drop unknown ids (e.g. from an older wizard version)
    const parsed: string[] = JSON.parse(raw)
    return new Set(parsed.filter((id): id is StepId => (ALL_STEP_IDS as string[]).includes(id)))
  } catch { return new Set() }
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
