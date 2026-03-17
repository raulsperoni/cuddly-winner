import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { BlockVersion } from '../../api/types'

interface Props {
  blockId: number
  documentId: number
  isOpen: boolean
  onToggle: () => void
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function LineagePanel({ blockId, documentId, isOpen, onToggle }: Props) {
  const [versions, setVersions] = useState<BlockVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!isOpen || fetched) return
    setLoading(true)
    api
      .getVersions(documentId, blockId)
      .then((v) => {
        setVersions([...v].reverse())
        setFetched(true)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isOpen, blockId, documentId, fetched])

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        History
      </button>

      {isOpen && (
        <div className="mt-2 pl-3 border-l border-zinc-800">
          {loading ? (
            <div className="text-xs font-mono text-zinc-600 py-1">Loading…</div>
          ) : versions.length === 0 ? (
            <div className="text-xs font-mono text-zinc-600 py-1">No versions yet</div>
          ) : (
            <ol className="space-y-2">
              {versions.map((v, i) => (
                <li key={v.id} className="text-xs font-mono">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        v.is_current ? 'bg-zinc-300' : 'bg-zinc-700'
                      }`}
                    />
                    <div className="leading-relaxed">
                      <span className="text-zinc-500">
                        v{versions.length - i} —{' '}
                      </span>
                      {v.author_type === 'ai' ? (
                        <span className="text-amber-500">AI suggestion</span>
                      ) : (
                        <span className="text-blue-400">
                          {v.author_username ?? 'you'}
                        </span>
                      )}
                      <span className="text-zinc-600">
                        {' '}— {formatTime(v.created_at)}
                      </span>
                      {v.is_current && (
                        <span className="ml-1.5 text-zinc-600">[current]</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
