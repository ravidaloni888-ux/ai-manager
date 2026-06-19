import { create } from 'zustand'
import { MeetingsData, MeetingConfig } from '../types'
import { loadMeetings, saveMeetings } from '../lib/supabase'
import { getDemoMode } from './demoStore'

export const DEMO_MEETINGS: MeetingsData = {
  configs: {
    trend_scouting:     { status: 'active',  dayOfWeek: 0, startHour: 9,  startMinute: 0 },
    use_case_review:    { status: 'active',  dayOfWeek: 2, startHour: 14, startMinute: 0 },
    governance_review:  { status: 'active',  dayOfWeek: 1, startHour: 10, startMinute: 0 },
    tech_scouting_sync: { status: 'active',  dayOfWeek: 0, startHour: 13, startMinute: 0 },
    ki_schulung:        { status: 'active',  dayOfWeek: 4, startHour: 14, startMinute: 0 },
    ki_strategie:       { status: 'active',  dayOfWeek: 3, startHour: 10, startMinute: 0 },
    policy_review:      { status: 'pending', dayOfWeek: 2, startHour: 11, startMinute: 0 },
  },
}

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
    if (getDemoMode()) {
      set({ data: DEMO_MEETINGS, loading: false })
      return
    }
    const data = await loadMeetings()
    set({ data, loading: false })
  },

  updateConfig: (id, cfg) => {
    set({ data: { configs: { ...get().data.configs, [id]: cfg } } })
  },

  save: async () => {
    set({ saving: true })
    if (!getDemoMode()) await saveMeetings(get().data)
    set({ saving: false })
  },
}))
