import { Suspense, lazy, useState } from 'react'
import { BlockEditor } from './BlockEditor'
import { AuthorshipBadge } from '../shared/AuthorshipBadge'
import { api } from '../../api/client'
import { useDocumentStore } from '../../stores/document'
import { useUIStore } from '../../stores/ui'
import type { Block } from '../../api/types'
import { useLocale } from '../../lib/i18n'

const SuggestionPanel = lazy(() =>
  import('../suggestions/SuggestionPanel').then((mod) => ({
    default: mod.SuggestionPanel,
  })),
)

const LineagePanel = lazy(() =>
  import('../lineage/LineagePanel').then((mod) => ({
    default: mod.LineagePanel,
  })),
)

interface Props {
  block: Block
  documentId: number
  canEdit?: boolean
  canDecide?: boolean
  canSuggest?: boolean
}

export function BlockItem({
  block,
  documentId,
  canEdit = true,
  canDecide = true,
  canSuggest = true,
}: Props) {
  const { t } = useLocale()
  const [hovered, setHovered] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customInstruction, setCustomInstruction] = useState('')
  const { updateBlock, addSuggestionToBlock, removeBlock } = useDocumentStore()
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
  const suggestionTypes = [
    { key: 'improve', label: t('clarify') },
    { key: 'rewrite', label: t('rephrase') },
    { key: 'shorten', label: t('condense') },
    { key: 'expand', label: t('expand') },
  ] as const

  const handleSave = async (text: string) => {
    const updated = await api.patchBlock(documentId, block.id, text)
    updateBlock(updated)
    setEditingBlock(null)
  }

  const handleCancel = () => setEditingBlock(null)

  const handleDelete = async () => {
    await api.deleteBlock(documentId, block.id)
    removeBlock(block.id)
    setEditingBlock(null)
  }

  const handleRequestSuggestion = async (
    type: string,
    instruction = '',
  ) => {
    if (isLoading || isEditing) return
    setBlockLoading(block.id, true)
    try {
      const suggestion = await api.createSuggestion(
        documentId, block.id, type, instruction,
      )
      addSuggestionToBlock(block.id, suggestion)
    } catch (e) {
      console.error('Suggestion request failed', e)
    } finally {
      setBlockLoading(block.id, false)
    }
  }

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customInstruction.trim()) return
    setCustomOpen(false)
    await handleRequestSuggestion('custom', customInstruction.trim())
    setCustomInstruction('')
  }

  return (
    <div
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 items-start">
        <div className="pt-4 text-right">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] [color:var(--text-subtle)]">
            ¶ {block.position + 1}
          </div>
        </div>
        <div
          className={`rounded-2xl px-1 transition-colors duration-150 ${
            isEditing
              ? '[background:var(--surface-2)]'
              : hasPending
                ? '[background:var(--accent-soft)]'
                : 'bg-transparent'
          }`}
        >
          <div className="flex items-center justify-between py-2 min-h-[36px]">
            <div className="flex items-center gap-2">
              {block.current_version && (
                <AuthorshipBadge
                  authorType={block.current_version.author_type}
                  approvedBy={block.current_version.decision?.decided_by_username ?? null}
                  decisionType={block.current_version.decision?.decision_type ?? null}
                />
              )}
              {hasPending && (
                <span className="text-[11px] font-mono [color:var(--accent)]">
                  {t('pendingReview', { count: pendingSuggestions.length })}
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
              {canSuggest
                ? suggestionTypes.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleRequestSuggestion(key)}
                      className="px-2 py-0.5 text-[11px] font-mono rounded-sm transition-colors [color:var(--text-subtle)] hover:[color:var(--accent)] hover:[background:var(--accent-soft)]"
                    >
                      {label}
                    </button>
                  ))
                : null}
              {canSuggest ? (
                <button
                  onClick={() => setCustomOpen((v) => !v)}
                  className="px-2 py-0.5 text-[11px] font-mono rounded-sm transition-colors [color:var(--text-subtle)] hover:[color:var(--accent)] hover:[background:var(--accent-soft)]"
                >
                  {t('askAi')}
                </button>
              ) : null}
            </div>
          </div>

          {canSuggest && customOpen && !isEditing && (
            <form
              onSubmit={handleCustomSubmit}
              className="mb-2 flex items-center gap-2"
            >
              <input
                autoFocus
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder={t('customInstructionPlaceholder')}
                className="flex-1 rounded px-2 py-1 text-xs font-mono focus:outline-none [background:var(--app-bg-soft)] [border:1px_solid_var(--border-subtle)] [color:var(--text-main)] placeholder:[color:var(--text-subtle)] focus:[border-color:var(--accent)]"
              />
              <button
                type="submit"
                disabled={!customInstruction.trim()}
                className="px-2 py-1 text-[11px] font-mono rounded-sm border disabled:opacity-40 transition-colors [background:var(--accent)] [border-color:var(--accent)] text-white"
              >
                {t('ask')}
              </button>
              <button
                type="button"
                onClick={() => { setCustomOpen(false); setCustomInstruction('') }}
                className="text-[11px] font-mono [color:var(--text-subtle)] hover:[color:var(--text-main)]"
              >
                {t('cancel')}
              </button>
            </form>
          )}

          <div className="relative py-1">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl [background:color-mix(in_srgb,var(--app-bg)_78%,transparent)]">
                <span className="text-xs font-mono animate-pulse [color:var(--accent)]">
                  {t('preparingReviewDraft')}
                </span>
              </div>
            )}
            <BlockEditor
              blockId={block.id}
              text={block.current_version?.text ?? ''}
              isEditing={isEditing && canEdit}
              onStartEdit={() => canEdit && setEditingBlock(block.id)}
              onSave={handleSave}
              onDelete={canEdit ? handleDelete : undefined}
              onCancel={handleCancel}
              hasPendingSuggestions={hasPending}
            />
          </div>

          <div className="pb-2 pt-3">
            <Suspense
              fallback={
                <div className="text-xs font-mono [color:var(--text-subtle)]">
                  {t('loadingHistory')}
                </div>
              }
            >
              <LineagePanel
                blockId={block.id}
                documentId={documentId}
                isOpen={isLineageOpen}
                onToggle={() => toggleLineage(block.id)}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {hasPending && (
        <Suspense
          fallback={
            <div className="mt-4 text-xs font-mono animate-pulse [color:var(--text-subtle)]">
              {t('loadingReviewDraft')}
            </div>
          }
        >
          <SuggestionPanel
            block={block}
            documentId={documentId}
            suggestions={pendingSuggestions}
            canDecide={canDecide}
          />
        </Suspense>
      )}
    </div>
  )
}
