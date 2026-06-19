import { create } from 'zustand'
import { AIRisk } from '../types'
import { seedRisks } from '../data/riskData'
import { nanoid } from 'nanoid'
import { getDemoMode } from './demoStore'
import { loadRisks, saveRisks } from '../lib/supabase'

interface RiskStore {
  risks: AIRisk[]
  init: () => Promise<void>
  add: (r: Omit<AIRisk, 'id'>) => Promise<void>
  update: (r: AIRisk) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useRiskStore = create<RiskStore>()((set, get) => ({
  risks: [],

  init: async () => {
    if (getDemoMode()) {
      set({ risks: seedRisks })
      return
    }
    const risks = await loadRisks()
    set({ risks })
  },

  add: async (r) => {
    const next = [...get().risks, { ...r, id: nanoid() }]
    set({ risks: next })
    if (!getDemoMode()) await saveRisks(next)
  },

  update: async (r) => {
    const next = get().risks.map((x) => (x.id === r.id ? r : x))
    set({ risks: next })
    if (!getDemoMode()) await saveRisks(next)
  },

  remove: async (id) => {
    const next = get().risks.filter((x) => x.id !== id)
    set({ risks: next })
    if (!getDemoMode()) await saveRisks(next)
  },
}))
