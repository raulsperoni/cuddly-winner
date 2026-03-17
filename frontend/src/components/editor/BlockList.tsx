import type { Block } from '../../api/types'
import { BlockItem } from './BlockItem'

interface Props {
  blocks: Block[]
  documentId: number
}

export function BlockList({ blocks, documentId }: Props) {
  if (blocks.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm font-mono [color:var(--text-subtle)]">No paragraphs yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <BlockItem key={block.id} block={block} documentId={documentId} />
      ))}
    </div>
  )
}
