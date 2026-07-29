import { create } from 'zustand'
import { StrategyData, DEFAULT_STRATEGY } from '../types'
import { supabase } from '../lib/supabase'
import { loadFor, saveFor } from '../lib/mandantData'
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
    const loaded = await loadFor('strategy', async () => {
      try {
        const { data, error } = await supabase
          .from('ai_strategy')
          .select('*')
          .eq('id', 'singleton')
          .single()
        if (!error && data?.strategy_data) return { ...BLANK_STRATEGY, ...data.strategy_data }
      } catch {}
      return BLANK_STRATEGY
    }, BLANK_STRATEGY)
    set({ data: loaded, loading: false })
  },

  save: async (d: StrategyData) => {
    set({ saving: true, data: d })
    await saveFor('strategy', async (v) => {
      try {
        await supabase.from('ai_strategy').upsert({
          id: 'singleton',
          strategy_data: v,
          updated_at: new Date().toISOString(),
        })
      } catch {}
    }, d)
    set({ saving: false })
  },
}))
