import { useState } from 'react'
import { BlockEditor } from './BlockEditor'
import { SuggestionPanel } from '../suggestions/SuggestionPanel'
import { LineagePanel } from '../lineage/LineagePanel'
import { AuthorshipBadge } from '../shared/AuthorshipBadge'
import { api } from '../../api/client'
import { useDocumentStore } from '../../stores/document'
import { useUIStore } from '../../stores/ui'
import type { Block } from '../../api/types'

const SUGGESTION_TYPES = [
  { key: 'improve', label: 'Improve' },
  { key: 'rewrite', label: 'Rewrite' },
  { key: 'shorten', label: 'Shorten' },
  { key: 'expand', label: 'Expand' },
] as const

interface Props {
  block: Block
  documentId: number
}

export function BlockItem({ block, documentId }: Props) {
  const [hovered, setHovered] = useState(false)
  const { updateBlock, addSuggestionToBlock } = useDocumentStore()
  const {
    editingBlockId,
    loadingBlockIds,
    lineageOpenIds,
    setEditingBlock,
    setBlockLoading,
    toggleLineage,
  } = useUIStore()

  const isEditing = editingBlockId === block.id
  const isLoading = loadingBlockIds.has(block.id)
  const isLineageOpen = lineageOpenIds.has(block.id)
  const pendingSuggestions = block.pending_suggestions ?? []
  const hasPending = pendingSuggestions.length > 0

  const handleSave = async (text: string) => {
    const updated = await api.patchBlock(documentId, block.id, text)
    updateBlock(updated)
    setEditingBlock(null)
  }

  const handleCancel = () => setEditingBlock(null)

  const handleRequestSuggestion = async (type: string) => {
    if (isLoading || isEditing) return
    setBlockLoading(block.id, true)
    try {
      const suggestion = await api.createSuggestion(documentId, block.id, type)
      addSuggestionToBlock(block.id, suggestion)
    } catch (e) {
      console.error('Suggestion request failed', e)
    } finally {
      setBlockLoading(block.id, false)
    }
  }

  return (
    <div
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`rounded-md border transition-colors duration-150 ${
          isEditing
            ? 'border-zinc-600 bg-zinc-900'
            : hasPending
              ? 'border-amber-800/50 bg-zinc-900/80'
              : 'border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60'
        }`}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/40 min-h-[36px]">
          <div className="flex items-center gap-2">
            {block.current_version && (
              <AuthorshipBadge authorType={block.current_version.author_type} />
            )}
            {hasPending && (
              <span className="text-xs font-mono text-amber-500/80">
                {pendingSuggestions.length} pending
              </span>
            )}
          </div>

          <div
            className={`flex items-center gap-0.5 transition-opacity duration-150 ${
              hovered && !isEditing && !isLoading
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            {SUGGESTION_TYPES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleRequestSuggestion(key)}
                className="px-2 py-0.5 text-xs font-mono rounded-sm text-zinc-500 hover:text-amber-400 hover:bg-amber-950/30 border border-transparent hover:border-amber-800/40 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-b-md z-10">
              <span className="text-xs font-mono text-amber-400 animate-pulse">
                Requesting AI suggestion…
              </span>
            </div>
          )}
          <BlockEditor
            blockId={block.id}
            text={block.current_version?.text ?? ''}
            isEditing={isEditing}
            onStartEdit={() => setEditingBlock(block.id)}
            onSave={handleSave}
            onCancel={handleCancel}
            hasPendingSuggestions={hasPending}
          />
        </div>

        {/* Lineage toggle */}
        <div className="px-4 pb-3">
          <LineagePanel
            blockId={block.id}
            documentId={documentId}
            isOpen={isLineageOpen}
            onToggle={() => toggleLineage(block.id)}
          />
        </div>
      </div>

      {hasPending && (
        <SuggestionPanel
          block={block}
          documentId={documentId}
          suggestions={pendingSuggestions}
        />
      )}
    </div>
  )
}
