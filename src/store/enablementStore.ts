import { create } from 'zustand'
import { EnablementData, TrainingTopicKey, TrainingStatus } from '../types'
import { loadEnablement, saveEnablement } from '../lib/supabase'

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
    await saveEnablement(get().data)
    set({ saving: false })
  },
}))
