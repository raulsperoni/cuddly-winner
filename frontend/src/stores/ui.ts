import { create } from 'zustand'

interface UIState {
  editingBlockId: number | null
  loadingBlockIds: Set<number>
  lineageOpenIds: Set<number>
  setEditingBlock: (id: number | null) => void
  setBlockLoading: (id: number, loading: boolean) => void
  toggleLineage: (id: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  editingBlockId: null,
  loadingBlockIds: new Set(),
  lineageOpenIds: new Set(),

  setEditingBlock: (id) => set({ editingBlockId: id }),

  setBlockLoading: (id, loading) =>
    set((state) => {
      const next = new Set(state.loadingBlockIds)
      loading ? next.add(id) : next.delete(id)
      return { loadingBlockIds: next }
    }),

  toggleLineage: (id) =>
    set((state) => {
      const next = new Set(state.lineageOpenIds)
      next.has(id) ? next.delete(id) : next.add(id)
      return { lineageOpenIds: next }
    }),
}))
