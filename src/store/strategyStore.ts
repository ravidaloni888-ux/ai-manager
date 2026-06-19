import { create } from 'zustand'
import { StrategyData, DEFAULT_STRATEGY } from '../types'
import { supabase } from '../lib/supabase'

const LS_KEY = 'ai_strategy_v1'

function lsLoad(): StrategyData | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return { ...DEFAULT_STRATEGY, ...JSON.parse(raw) }
  } catch { return null }
}

function lsSave(d: StrategyData) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)) } catch {}
}

interface StrategyStore {
  data: StrategyData
  loading: boolean
  saving: boolean
  init: () => Promise<void>
  save: (d: StrategyData) => Promise<void>
}

export const useStrategyStore = create<StrategyStore>()((set) => ({
  data: DEFAULT_STRATEGY,
  loading: true,
  saving: false,

  init: async () => {
    try {
      const { data, error } = await supabase
        .from('ai_strategy')
        .select('*')
        .eq('id', 'singleton')
        .single()
      if (!error && data?.strategy_data) {
        const merged: StrategyData = { ...DEFAULT_STRATEGY, ...data.strategy_data }
        if (!merged.kpis?.length) merged.kpis = DEFAULT_STRATEGY.kpis
        if (merged.focusAreas?.every((f) => f.priority === 'None' && !f.note)) merged.focusAreas = DEFAULT_STRATEGY.focusAreas
        if (!merged.vision) { merged.vision = DEFAULT_STRATEGY.vision; merged.objectives = DEFAULT_STRATEGY.objectives; merged.challenge = DEFAULT_STRATEGY.challenge }
        if (!merged.budgetTotalK) { merged.budgetTotalK = DEFAULT_STRATEGY.budgetTotalK; merged.targetRoiPct = DEFAULT_STRATEGY.targetRoiPct }
        lsSave(merged)
        set({ data: merged, loading: false })
        return
      }
    } catch {}
    const ls = lsLoad()
    if (ls) {
      if (!ls.kpis?.length) ls.kpis = DEFAULT_STRATEGY.kpis
      if (ls.focusAreas?.every((f) => f.priority === 'None' && !f.note)) ls.focusAreas = DEFAULT_STRATEGY.focusAreas
      if (!ls.vision) { ls.vision = DEFAULT_STRATEGY.vision; ls.objectives = DEFAULT_STRATEGY.objectives; ls.challenge = DEFAULT_STRATEGY.challenge }
      if (!ls.budgetTotalK) { ls.budgetTotalK = DEFAULT_STRATEGY.budgetTotalK; ls.targetRoiPct = DEFAULT_STRATEGY.targetRoiPct }
    }
    set({ data: ls ?? DEFAULT_STRATEGY, loading: false })
  },

  save: async (d: StrategyData) => {
    set({ saving: true })
    lsSave(d)
    set({ data: d })
    try {
      await supabase.from('ai_strategy').upsert({
        id: 'singleton',
        strategy_data: d,
        updated_at: new Date().toISOString(),
      })
    } catch {}
    set({ saving: false })
  },
}))
