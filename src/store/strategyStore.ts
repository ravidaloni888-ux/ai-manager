import { create } from 'zustand'
import { StrategyData, DEFAULT_STRATEGY } from '../types'
import { supabase } from '../lib/supabase'
import { getDemoMode } from './demoStore'

const BLANK_STRATEGY: StrategyData = {
  vision: '',
  horizon: '3',
  objectives: ['', '', ''],
  challenge: '',
  focusAreas: DEFAULT_STRATEGY.focusAreas.map((f) => ({ ...f, priority: 'None' as const, note: '' })),
  budgetTotalK: 0,
  targetRoiPct: 0,
  kpis: [],
}

interface StrategyStore {
  data: StrategyData
  loading: boolean
  saving: boolean
  init: () => Promise<void>
  save: (d: StrategyData) => Promise<void>
}

export const useStrategyStore = create<StrategyStore>()((set) => ({
  data: BLANK_STRATEGY,
  loading: true,
  saving: false,

  init: async () => {
    if (getDemoMode()) {
      set({ data: DEFAULT_STRATEGY, loading: false })
      return
    }
    // My Workspace — load from Supabase, start blank for new users
    try {
      const { data, error } = await supabase
        .from('ai_strategy')
        .select('*')
        .eq('id', 'singleton')
        .single()
      if (!error && data?.strategy_data) {
        set({ data: { ...BLANK_STRATEGY, ...data.strategy_data }, loading: false })
        return
      }
    } catch {}
    set({ data: BLANK_STRATEGY, loading: false })
  },

  save: async (d: StrategyData) => {
    set({ saving: true, data: d })
    if (!getDemoMode()) {
      try {
        await supabase.from('ai_strategy').upsert({
          id: 'singleton',
          strategy_data: d,
          updated_at: new Date().toISOString(),
        })
      } catch {}
    }
    set({ saving: false })
  },
}))
