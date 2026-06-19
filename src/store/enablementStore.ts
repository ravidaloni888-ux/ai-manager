import { create } from 'zustand'
import { EnablementData, TrainingTopicKey, TrainingStatus } from '../types'
import { loadEnablement, saveEnablement } from '../lib/supabase'
import { getDemoMode } from './demoStore'

const D = 'done' as const, P = 'planned' as const, O = 'open' as const

export const DEMO_ENABLEMENT: EnablementData = {
  trainingMap: {
    IT:                  { fundamentals: D, ai_types: D, data_safety: D, opportunities: D, prompting: D, compliance: D, use_cases: P },
    Sales:               { fundamentals: D, ai_types: P, data_safety: D, opportunities: D, prompting: D, compliance: P, use_cases: P },
    Operations:          { fundamentals: D, ai_types: D, data_safety: D, opportunities: P, prompting: P, compliance: D, use_cases: O },
    'Customer Service':  { fundamentals: D, ai_types: O, data_safety: D, opportunities: P, prompting: D, compliance: P, use_cases: O },
    Finance:             { fundamentals: D, ai_types: P, data_safety: D, opportunities: D, prompting: P, compliance: D, use_cases: O },
    HR:                  { fundamentals: D, ai_types: O, data_safety: D, opportunities: P, prompting: O, compliance: D, use_cases: O },
    Legal:               { fundamentals: D, ai_types: O, data_safety: D, opportunities: O, prompting: O, compliance: D, use_cases: O },
    Marketing:           { fundamentals: P, ai_types: O, data_safety: P, opportunities: P, prompting: O, compliance: O, use_cases: O },
    Logistics:           { fundamentals: P, ai_types: O, data_safety: O, opportunities: O, prompting: O, compliance: O, use_cases: O },
  },
}

interface EnablementStore {
  data: EnablementData
  loading: boolean
  saving: boolean
  init: () => Promise<void>
  setStatus: (dept: string, topic: TrainingTopicKey, status: TrainingStatus) => void
  save: () => Promise<void>
}

export const useEnablementStore = create<EnablementStore>()((set, get) => ({
  data: { trainingMap: {} },
  loading: true,
  saving: false,

  init: async () => {
    if (getDemoMode()) {
      set({ data: DEMO_ENABLEMENT, loading: false })
      return
    }
    const data = await loadEnablement()
    set({ data, loading: false })
  },

  setStatus: (dept, topic, status) => {
    const { trainingMap } = get().data
    set({
      data: {
        trainingMap: {
          ...trainingMap,
          [dept]: { ...(trainingMap[dept] ?? {}), [topic]: status },
        },
      },
    })
  },

  save: async () => {
    set({ saving: true })
    if (!getDemoMode()) await saveEnablement(get().data)
    set({ saving: false })
  },
}))
