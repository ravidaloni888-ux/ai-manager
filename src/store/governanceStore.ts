import { create } from 'zustand'
import { GovernanceData } from '../types'
import { loadGovernance, saveGovernance } from '../lib/supabase'

interface GovernanceStore {
  data: GovernanceData | null
  loading: boolean
  saving: boolean
  init: () => Promise<void>
  save: (data: GovernanceData) => Promise<void>
}

export const useGovernanceStore = create<GovernanceStore>()((set) => ({
  data: null,
  loading: true,
  saving: false,

  init: async () => {
    const data = await loadGovernance()
    set({ data, loading: false })
  },

  save: async (data) => {
    set({ saving: true })
    await saveGovernance(data)
    set({ data, saving: false })
  },
}))
