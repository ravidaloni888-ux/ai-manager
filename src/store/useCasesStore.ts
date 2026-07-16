import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { AIUseCase } from '../types'
import { supabase, rowToUseCase, useCaseToRow } from '../lib/supabase'
import { dummyData } from '../data/dummyData'
import { getDemoMode } from './demoStore'

const DUMMY_IDS = new Set(dummyData.map((d) => d.id))

interface UseCasesStore {
  useCases: AIUseCase[]
  loading: boolean
  initializedFor: 'demo' | 'workspace' | null
  init: () => Promise<void>
  resetStore: () => void
  addUseCase: (uc: AIUseCase) => void
  updateUseCase: (uc: AIUseCase) => void
  deleteUseCase: (id: string) => void
  duplicateUseCase: (id: string) => void
  getById: (id: string) => AIUseCase | undefined
}

export const useUseCasesStore = create<UseCasesStore>()((set, get) => ({
  useCases: [],
  loading: true,
  initializedFor: null,

  init: async () => {
    const mode = getDemoMode() ? 'demo' : 'workspace'

    // Skip if already initialized for this mode — prevents wiping in-memory cases
    if (get().initializedFor === mode) return

    if (mode === 'demo') {
      set({ useCases: dummyData, loading: false, initializedFor: 'demo' })
      return
    }

    // Real workspace — load from Supabase, exclude dummy-seeded records
    const { data, error } = await supabase
      .from('ai_use_cases')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      set({ useCases: [], loading: false, initializedFor: 'workspace' })
      return
    }

    const userRows = data.filter((row) => !DUMMY_IDS.has(row.id as string))
    set({ useCases: userRows.map(rowToUseCase), loading: false, initializedFor: 'workspace' })
  },

  resetStore: () => set({ useCases: [], loading: true, initializedFor: null }),

  addUseCase: (uc) => {
    set((state) => ({ useCases: [...state.useCases, uc] }))
    if (getDemoMode()) return
    supabase.from('ai_use_cases').insert(useCaseToRow(uc)).then(({ error }) => {
      if (error) console.error('Failed to save:', error)
    })
  },

  updateUseCase: (uc) => {
    set((state) => ({ useCases: state.useCases.map((u) => (u.id === uc.id ? uc : u)) }))
    if (getDemoMode()) return
    supabase.from('ai_use_cases').update(useCaseToRow(uc)).eq('id', uc.id).then(({ error }) => {
      if (error) console.error('Failed to update:', error)
    })
  },

  deleteUseCase: (id) => {
    set((state) => ({ useCases: state.useCases.filter((u) => u.id !== id) }))
    if (getDemoMode()) return
    supabase.from('ai_use_cases').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Failed to delete:', error)
    })
  },

  duplicateUseCase: (id) => {
    const original = get().useCases.find((u) => u.id === id)
    if (!original) return
    const copy: AIUseCase = {
      ...original,
      id: nanoid(),
      title: `${original.title} (Copy)`,
      status: 'Idea',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((state) => ({ useCases: [...state.useCases, copy] }))
    if (getDemoMode()) return
    supabase.from('ai_use_cases').insert(useCaseToRow(copy)).then(({ error }) => {
      if (error) console.error('Failed to duplicate:', error)
    })
  },

  getById: (id) => get().useCases.find((u) => u.id === id),
}))

export function newId() {
  return nanoid()
}
