import { create } from 'zustand'
import { AIRisk } from '../types'
import { seedRisks } from '../data/riskData'
import { nanoid } from 'nanoid'
import { getDemoMode } from './demoStore'

const LS_KEY = 'ai_user_risks_v1' // separate key from demo data

function lsLoad(): AIRisk[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function lsSave(risks: AIRisk[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(risks)) } catch {}
}

interface RiskStore {
  risks: AIRisk[]
  init: () => void
  add: (r: Omit<AIRisk, 'id'>) => void
  update: (r: AIRisk) => void
  remove: (id: string) => void
}

export const useRiskStore = create<RiskStore>()((set, get) => ({
  risks: getDemoMode() ? seedRisks : (lsLoad() ?? []),

  init: () => {
    if (getDemoMode()) {
      set({ risks: seedRisks })
    } else {
      set({ risks: lsLoad() ?? [] })
    }
  },

  add: (r) => {
    if (getDemoMode()) return
    const next = [...get().risks, { ...r, id: nanoid() }]
    lsSave(next)
    set({ risks: next })
  },

  update: (r) => {
    if (getDemoMode()) {
      set({ risks: get().risks.map((x) => (x.id === r.id ? r : x)) })
      return
    }
    const next = get().risks.map((x) => (x.id === r.id ? r : x))
    lsSave(next)
    set({ risks: next })
  },

  remove: (id) => {
    if (getDemoMode()) return
    const next = get().risks.filter((x) => x.id !== id)
    lsSave(next)
    set({ risks: next })
  },
}))
