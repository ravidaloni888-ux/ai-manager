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
  init: () => Promise<void>
  addUseCase: (uc: AIUseCase) => void
  updateUseCase: (uc: AIUseCase) => void
  deleteUseCase: (id: string) => void
  duplicateUseCase: (id: string) => void
  getById: (id: string) => AIUseCase | undefined
}

export const useUseCasesStore = create<UseCasesStore>()((set, get) => ({
  useCases: [],
  loading: true,

  init: async () => {
    // Demo mode — serve seed data in-memory, skip all network calls
    if (getDemoMode()) {
      set({ useCases: dummyData, loading: false })
      return
    }

    // Real workspace — load from Supabase, exclude dummy-seeded records
    let { data, error } = await supabase
      .from('ai_use_cases')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      set({ useCases: [], loading: false })
      return
    }

    // Filter out the pre-seeded dummy records so the real workspace starts clean
    const userRows = data.filter((row) => !DUMMY_IDS.has(row.id as string))
    set({ useCases: userRows.map(rowToUseCase), loading: false })
  },

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
