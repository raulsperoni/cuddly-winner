import { useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { DiffView } from './DiffView'
import { api } from '../../api/client'
import { useDocumentStore } from '../../stores/document'
import type { Block, Suggestion } from '../../api/types'

interface Props {
  block: Block
  documentId: number
  suggestions: Suggestion[]
}

export function SuggestionPanel({ block, documentId, suggestions }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editingAcceptance, setEditingAcceptance] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const updateBlock = useDocumentStore((s) => s.updateBlock)

  const suggestion = suggestions[currentIndex]

  const editEditor = useEditor(
    {
      extensions: [
        StarterKit,
        Markdown.configure({ html: false, transformPastedText: true }),
      ],
      content: suggestion?.text ?? '',
      editable: true,
    },
    [suggestion?.id],
  )

  if (!suggestion) return null

  const currentText = block.current_version?.text ?? ''

  const handleAccept = async () => {
    setLoading('accept')
    try {
      const updated = await api.acceptSuggestion(documentId, block.id, suggestion.id)
      updateBlock(updated)
    } catch (e) {
      console.error('Accept failed', e)
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    setLoading('reject')
    try {
      const updated = await api.rejectSuggestion(documentId, block.id, suggestion.id)
      updateBlock(updated)
    } catch (e) {
      console.error('Reject failed', e)
    } finally {
      setLoading(null)
    }
  }

  const handleSubmitEdits = async () => {
    if (!editEditor) return
    const text = editEditor.storage.markdown.getMarkdown()
    if (!text.trim()) return
    setLoading('edit-accept')
    try {
      const updated = await api.acceptWithEdits(
        documentId,
        block.id,
        suggestion.id,
        text,
      )
      updateBlock(updated)
      setEditingAcceptance(false)
    } catch (e) {
      console.error('Accept with edits failed', e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-1 border border-amber-800/40 rounded-md overflow-hidden bg-zinc-900/60">
      <div className="flex items-center justify-between px-4 py-2 border-b border-amber-800/30 bg-amber-950/20">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">
            AI suggestion — {suggestion.suggestion_type}
          </span>
        </div>
        {suggestions.length > 1 && (
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="hover:text-zinc-300 disabled:opacity-30"
            >
              ‹
            </button>
            <span>
              {currentIndex + 1} / {suggestions.length}
            </span>
            <button
              onClick={() =>
                setCurrentIndex((i) => Math.min(suggestions.length - 1, i + 1))
              }
              disabled={currentIndex === suggestions.length - 1}
              className="hover:text-zinc-300 disabled:opacity-30"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {!editingAcceptance ? (
        <div className="grid grid-cols-2 divide-x divide-zinc-800/60">
          <div className="p-4">
            <div className="text-xs font-mono text-zinc-500 mb-3 uppercase tracking-wider">
              Current
            </div>
            <div className="prose-font text-[15px] leading-relaxed text-zinc-400">
              {currentText || (
                <span className="italic text-zinc-600">empty</span>
              )}
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs font-mono text-zinc-500 mb-3 uppercase tracking-wider">
              Suggestion
            </div>
            <DiffView original={currentText} modified={suggestion.text} />
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="text-xs font-mono text-zinc-500 mb-3 uppercase tracking-wider">
            Edit before accepting
          </div>
          <div className="border border-zinc-700/60 rounded p-3 bg-zinc-950/50 focus-within:border-zinc-600">
            <EditorContent
              editor={editEditor}
              className="prose-font text-[15px] leading-relaxed text-zinc-200 min-h-[4em]"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-800/60 bg-zinc-950/30">
        {!editingAcceptance ? (
          <>
            <button
              onClick={handleAccept}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-mono rounded-sm bg-amber-700/80 hover:bg-amber-600/80 text-amber-100 border border-amber-600/50 disabled:opacity-50 transition-colors"
            >
              {loading === 'accept' ? '…' : 'Accept'}
            </button>
            <button
              onClick={() => setEditingAcceptance(true)}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-mono rounded-sm bg-zinc-700/60 hover:bg-zinc-600/60 text-zinc-200 border border-zinc-600/50 disabled:opacity-50 transition-colors"
            >
              Edit & Accept
            </button>
            <button
              onClick={handleReject}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-mono rounded-sm text-zinc-500 hover:text-red-400 hover:bg-red-950/30 border border-zinc-700/40 hover:border-red-800/50 disabled:opacity-50 transition-colors"
            >
              {loading === 'reject' ? '…' : 'Reject'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSubmitEdits}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-mono rounded-sm bg-teal-700/80 hover:bg-teal-600/80 text-teal-100 border border-teal-600/50 disabled:opacity-50 transition-colors"
            >
              {loading === 'edit-accept' ? '…' : 'Accept with edits'}
            </button>
            <button
              onClick={() => setEditingAcceptance(false)}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-mono rounded-sm text-zinc-500 hover:text-zinc-300 border border-zinc-700/40 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
