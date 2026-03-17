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
        <p className="text-sm font-mono text-zinc-600">No blocks yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {blocks.map((block) => (
        <BlockItem key={block.id} block={block} documentId={documentId} />
      ))}
    </div>
  )
}
