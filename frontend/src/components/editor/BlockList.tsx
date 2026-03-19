import type { Block } from '../../api/types'
import { BlockItem } from './BlockItem'

interface Props {
  blocks: Block[]
  documentId: number
  canEdit?: boolean
  canDecide?: boolean
  canSuggest?: boolean
  onAddParagraph?: () => void
  addingParagraph?: boolean
  addParagraphLabel?: string
  emptyStateLabel?: string
}

export function BlockList({
  blocks,
  documentId,
  canEdit = true,
  canDecide = true,
  canSuggest = true,
  onAddParagraph,
  addingParagraph = false,
  addParagraphLabel = '+ Add paragraph',
  emptyStateLabel = 'Start writing or paste your document here.',
}: Props) {
  if (blocks.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm font-mono [color:var(--text-subtle)]">{emptyStateLabel}</p>
        {onAddParagraph ? (
          <button
            type="button"
            onClick={onAddParagraph}
            disabled={addingParagraph}
            className="mt-5 rounded-sm border px-3 py-1.5 text-xs font-mono transition-colors disabled:opacity-50 [background:var(--text-main)] [border-color:var(--text-main)] text-[var(--app-bg)] hover:opacity-90"
          >
            {addingParagraph ? '…' : addParagraphLabel}
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <BlockItem
          key={block.id}
          block={block}
          documentId={documentId}
          canEdit={canEdit}
          canDecide={canDecide}
          canSuggest={canSuggest}
        />
      ))}
      {onAddParagraph ? (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAddParagraph}
            disabled={addingParagraph}
            className="rounded-sm border px-3 py-1.5 text-xs font-mono transition-colors disabled:opacity-50 [border-color:var(--border-subtle)] [color:var(--text-subtle)] hover:[border-color:var(--text-main)] hover:[color:var(--text-main)]"
          >
            {addingParagraph ? '…' : addParagraphLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}
