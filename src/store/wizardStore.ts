import { create } from 'zustand'
import { getDemoMode } from './demoStore'
import { scopedGet, scopedSet, migrateLegacyKeys } from '../lib/mandantData'

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

// Fortschritt wird je Mandant getrennt gespeichert
const BUCKET = 'wizard'

export function loadProgress(): Set<StepId> {
  migrateLegacyKeys()
  if (getDemoMode()) return new Set(ALL_STEP_IDS)
  // unbekannte IDs verwerfen (z. B. aus einer älteren Wizard-Version)
  const stored = scopedGet<string[]>(BUCKET, [])
  return new Set(stored.filter((id): id is StepId => (ALL_STEP_IDS as string[]).includes(id)))
}

export function saveProgress(done: Set<StepId>) {
  if (getDemoMode()) return
  scopedSet(BUCKET, [...done])
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
