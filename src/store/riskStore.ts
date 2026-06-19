import { create } from 'zustand'
import { AIRisk } from '../types'
import { seedRisks } from '../data/riskData'
import { nanoid } from 'nanoid'

const LS_KEY = 'ai_risks_v1'

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
  add: (r: Omit<AIRisk, 'id'>) => void
  update: (r: AIRisk) => void
  remove: (id: string) => void
}

const initial = lsLoad() ?? seedRisks

export const useRiskStore = create<RiskStore>()((set, get) => ({
  risks: initial,

  add: (r) => {
    const next = [...get().risks, { ...r, id: nanoid() }]
    lsSave(next)
    set({ risks: next })
  },

  update: (r) => {
    const next = get().risks.map((x) => (x.id === r.id ? r : x))
    lsSave(next)
    set({ risks: next })
  },

  remove: (id) => {
    const next = get().risks.filter((x) => x.id !== id)
    lsSave(next)
    set({ risks: next })
  },
}))
