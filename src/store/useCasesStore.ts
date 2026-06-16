import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { AIUseCase } from '../types'
import { dummyData } from '../data/dummyData'

interface UseCasesStore {
  useCases: AIUseCase[]
  addUseCase: (uc: AIUseCase) => void
  updateUseCase: (uc: AIUseCase) => void
  deleteUseCase: (id: string) => void
  duplicateUseCase: (id: string) => void
  getById: (id: string) => AIUseCase | undefined
}

export const useUseCasesStore = create<UseCasesStore>()(
  persist(
    (set, get) => ({
      useCases: dummyData,

      addUseCase: (uc) =>
        set((state) => ({ useCases: [...state.useCases, uc] })),

      updateUseCase: (uc) =>
        set((state) => ({
          useCases: state.useCases.map((u) => (u.id === uc.id ? uc : u)),
        })),

      deleteUseCase: (id) =>
        set((state) => ({
          useCases: state.useCases.filter((u) => u.id !== id),
        })),

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
      },

      getById: (id) => get().useCases.find((u) => u.id === id),
    }),
    { name: 'ai-manager-use-cases' },
  ),
)

export function newId() {
  return nanoid()
}
