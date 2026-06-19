import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { AIUseCase } from '../types'
import { supabase, rowToUseCase, useCaseToRow } from '../lib/supabase'
import { dummyData } from '../data/dummyData'

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
    let { data, error } = await supabase
      .from('ai_use_cases')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.error('Supabase load error:', error)
      set({ useCases: dummyData, loading: false })
      return
    }

    if (data.length === 0) {
      // First run — seed dummy data into the database
      await supabase.from('ai_use_cases').insert(dummyData.map(useCaseToRow))
      set({ useCases: dummyData, loading: false })
    } else {
      // Patch any existing records missing eu_ai_act_risk or motivation from dummy defaults
      const dummyMap = new Map(dummyData.map((d) => [d.id, d]))
      const toUpdate = data.filter((row) => {
        const d = dummyMap.get(row.id as string)
        return d && (!row.eu_ai_act_risk || !row.motivation)
      })
      if (toUpdate.length > 0) {
        const patchIds = new Set(toUpdate.map((r) => r.id as string))
        await Promise.all(
          toUpdate.map((row) => {
            const d = dummyMap.get(row.id as string)!
            return supabase
              .from('ai_use_cases')
              .update({ eu_ai_act_risk: d.euAiActRisk, motivation: d.motivation ?? null })
              .eq('id', row.id as string)
          })
        )
        // merge patched values into in-memory rows
        data = data.map((row) => {
          if (!patchIds.has(row.id as string)) return row
          const d = dummyMap.get(row.id as string)!
          return { ...row, eu_ai_act_risk: d.euAiActRisk, motivation: d.motivation ?? null }
        })
      }
      set({ useCases: data.map(rowToUseCase), loading: false })
    }
  },

  addUseCase: (uc) => {
    set((state) => ({ useCases: [...state.useCases, uc] }))
    supabase.from('ai_use_cases').insert(useCaseToRow(uc)).then(({ error }) => {
      if (error) console.error('Failed to save:', error)
    })
  },

  updateUseCase: (uc) => {
    set((state) => ({ useCases: state.useCases.map((u) => (u.id === uc.id ? uc : u)) }))
    supabase.from('ai_use_cases').update(useCaseToRow(uc)).eq('id', uc.id).then(({ error }) => {
      if (error) console.error('Failed to update:', error)
    })
  },

  deleteUseCase: (id) => {
    set((state) => ({ useCases: state.useCases.filter((u) => u.id !== id) }))
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
    supabase.from('ai_use_cases').insert(useCaseToRow(copy)).then(({ error }) => {
      if (error) console.error('Failed to duplicate:', error)
    })
  },

  getById: (id) => get().useCases.find((u) => u.id === id),
}))

export function newId() {
  return nanoid()
}
