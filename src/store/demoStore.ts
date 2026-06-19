import { create } from 'zustand'

const LS_KEY = 'ai_demo_mode_v1'

export function getDemoMode(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw === null ? true : JSON.parse(raw) // default true for new users
  } catch { return true }
}

interface DemoStore {
  demoMode: boolean
  setDemoMode: (v: boolean) => void
}

export const useDemoStore = create<DemoStore>()((set) => ({
  demoMode: getDemoMode(),
  setDemoMode: (v) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(v)) } catch {}
    set({ demoMode: v })
  },
}))
