import { create } from 'zustand'
import type { Block, Document, Suggestion } from '../api/types'

interface DocumentState {
  document: Document | null
  blocks: Block[]
  error: string | null
  setDocument: (doc: Document) => void
  updateBlock: (block: Block) => void
  addSuggestionToBlock: (blockId: number, suggestion: Suggestion) => void
  setError: (e: string | null) => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  document: null,
  blocks: [],
  error: null,

  setDocument: (doc) =>
    set({
      document: doc,
      blocks: [...(doc.blocks ?? [])].sort((a, b) => a.position - b.position),
    }),

  updateBlock: (block) =>
    set((state) => ({
      blocks: state.blocks.map((b) => (b.id === block.id ? block : b)),
    })),

  addSuggestionToBlock: (blockId, suggestion) =>
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === blockId
          ? { ...b, pending_suggestions: [...b.pending_suggestions, suggestion] }
          : b,
      ),
    })),

  setError: (error) => set({ error }),
}))
