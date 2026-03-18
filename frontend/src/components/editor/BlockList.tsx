import type { Block } from '../../api/types'
import { BlockItem } from './BlockItem'

interface Props {
  blocks: Block[]
  documentId: number
  canEdit?: boolean
  canDecide?: boolean
  canSuggest?: boolean
}

export function BlockList({
  blocks,
  documentId,
  canEdit = true,
  canDecide = true,
  canSuggest = true,
}: Props) {
  if (blocks.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm font-mono [color:var(--text-subtle)]">Start writing or paste your document here.</p>
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
    </div>
  )
}
