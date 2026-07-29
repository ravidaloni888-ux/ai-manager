import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { AIUseCase } from '../types'
import { supabase, rowToUseCase, useCaseToRow } from '../lib/supabase'
import { dummyData } from '../data/dummyData'
import { getMandantType, getActiveMandantId } from './mandantStore'
import { scopedGet, scopedSet } from '../lib/mandantData'

const DUMMY_IDS = new Set(dummyData.map((d) => d.id))
const BUCKET = 'usecases'

interface UseCasesStore {
  useCases: AIUseCase[]
  loading: boolean
  /** Mandanten-ID, für die der Store zuletzt geladen wurde */
  initializedFor: string | null
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
    const mandantId = getActiveMandantId()
    const type = getMandantType()

    // Bereits für diesen Mandanten geladen — nicht erneut überschreiben
    if (get().initializedFor === mandantId) return

    if (type === 'demo') {
      set({ useCases: dummyData, loading: false, initializedFor: mandantId })
      return
    }

    if (type === 'client') {
      set({ useCases: scopedGet<AIUseCase[]>(BUCKET, []), loading: false, initializedFor: mandantId })
      return
    }

    // AI Hub — aus Supabase laden, Demo-Datensätze ausschliessen
    const { data, error } = await supabase
      .from('ai_use_cases')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      set({ useCases: [], loading: false, initializedFor: mandantId })
      return
    }

    const userRows = data.filter((row) => !DUMMY_IDS.has(row.id as string))
    set({ useCases: userRows.map(rowToUseCase), loading: false, initializedFor: mandantId })
  },

  resetStore: () => set({ useCases: [], loading: true, initializedFor: null }),

  addUseCase: (uc) => {
    set((state) => ({ useCases: [...state.useCases, uc] }))
    const type = getMandantType()
    if (type === 'demo') return
    if (type === 'client') { scopedSet(BUCKET, get().useCases); return }
    supabase.from('ai_use_cases').insert(useCaseToRow(uc)).then(({ error }) => {
      if (error) console.error('Failed to save:', error)
    })
  },

  updateUseCase: (uc) => {
    set((state) => ({ useCases: state.useCases.map((u) => (u.id === uc.id ? uc : u)) }))
    const type = getMandantType()
    if (type === 'demo') return
    if (type === 'client') { scopedSet(BUCKET, get().useCases); return }
    supabase.from('ai_use_cases').update(useCaseToRow(uc)).eq('id', uc.id).then(({ error }) => {
      if (error) console.error('Failed to update:', error)
    })
  },

  deleteUseCase: (id) => {
    set((state) => ({ useCases: state.useCases.filter((u) => u.id !== id) }))
    const type = getMandantType()
    if (type === 'demo') return
    if (type === 'client') { scopedSet(BUCKET, get().useCases); return }
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
    const type = getMandantType()
    if (type === 'demo') return
    if (type === 'client') { scopedSet(BUCKET, get().useCases); return }
    supabase.from('ai_use_cases').insert(useCaseToRow(copy)).then(({ error }) => {
      if (error) console.error('Failed to duplicate:', error)
    })
  },

  getById: (id) => get().useCases.find((u) => u.id === id),
}))

export function newId() {
  return nanoid()
}
