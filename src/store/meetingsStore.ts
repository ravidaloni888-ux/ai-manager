import { create } from 'zustand'
import { MeetingsData, MeetingConfig } from '../types'
import { loadMeetings, saveMeetings } from '../lib/supabase'

interface MeetingsStore {
  data: MeetingsData
  loading: boolean
  saving: boolean
  init: () => Promise<void>
  updateConfig: (id: string, cfg: MeetingConfig) => void
  save: () => Promise<void>
}

export const useMeetingsStore = create<MeetingsStore>()((set, get) => ({
  data: { configs: {} },
  loading: true,
  saving: false,
  init: async () => {
    const data = await loadMeetings()
    set({ data, loading: false })
  },
  updateConfig: (id, cfg) => {
    set({ data: { configs: { ...get().data.configs, [id]: cfg } } })
  },
  save: async () => {
    set({ saving: true })
    await saveMeetings(get().data)
    set({ saving: false })
  },
}))
