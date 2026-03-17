import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Snapshot } from '../../api/types'

interface Props {
  documentId: number
  isOpen: boolean
  onToggle: () => void
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ExportForm({
  docId,
  snapshot,
  onExported,
}: {
  docId: number
  snapshot: Snapshot
  onExported: (s: Snapshot) => void
}) {
  const [open, setOpen] = useState(false)
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (snapshot.github_commit_sha) {
    return (
      <span className="text-xs font-mono text-zinc-600">
        exported →{' '}
        <span className="text-purple-400 font-mono">
          {snapshot.github_repo}
        </span>{' '}
        <span className="text-zinc-700">
          ({snapshot.github_commit_sha.slice(0, 7)})
        </span>
      </span>
    )
  }

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repo.trim()) return
    setLoading(true)
    setError(null)
    try {
      const updated = await api.exportSnapshot(
        docId,
        snapshot.id,
        repo.trim(),
        token.trim() || undefined,
      )
      onExported(updated)
      setOpen(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-mono text-zinc-600 hover:text-purple-400 transition-colors"
      >
        export to GitHub
      </button>
    )
  }

  return (
    <form onSubmit={handleExport} className="mt-2 space-y-2">
      {error && (
        <p className="text-xs font-mono text-red-400">{error}</p>
      )}
      <input
        type="text"
        value={repo}
        onChange={(e) => setRepo(e.target.value)}
        placeholder="owner/repo"
        required
        className="w-full bg-zinc-950 border border-zinc-700/60 rounded px-2 py-1 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
      />
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="GitHub token (optional if GITHUB_TOKEN set)"
        className="w-full bg-zinc-950 border border-zinc-700/60 rounded px-2 py-1 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !repo.trim()}
          className="px-3 py-1 text-xs font-mono rounded-sm bg-purple-900/60 hover:bg-purple-800/60 text-purple-200 border border-purple-800/50 disabled:opacity-40 transition-colors"
        >
          {loading ? '…' : 'Export'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          cancel
        </button>
      </div>
    </form>
  )
}

export function SnapshotPanel({ documentId, isOpen, onToggle }: Props) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!isOpen || fetched) return
    setLoading(true)
    api
      .listSnapshots(documentId)
      .then((s) => {
        setSnapshots([...s].sort((a, b) => b.version_number - a.version_number))
        setFetched(true)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isOpen, documentId, fetched])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const snap = await api.createSnapshot(documentId)
      setSnapshots((prev) => [snap, ...prev])
    } catch (e) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  const handleExported = (updated: Snapshot) => {
    setSnapshots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
  }

  return (
    <div className="border-t border-zinc-800/60 mt-8">
      <div className="max-w-4xl mx-auto px-6 py-4">
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          Snapshots
          {snapshots.length > 0 && (
            <span className="text-zinc-700">({snapshots.length})</span>
          )}
        </button>

        {isOpen && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-zinc-600 uppercase tracking-wider">
                Version history
              </span>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-3 py-1 text-xs font-mono rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 disabled:opacity-50 transition-colors"
              >
                {creating ? '…' : '+ Create snapshot'}
              </button>
            </div>

            {loading ? (
              <p className="text-xs font-mono text-zinc-600 animate-pulse">
                Loading…
              </p>
            ) : snapshots.length === 0 ? (
              <p className="text-xs font-mono text-zinc-700">
                No snapshots yet.
              </p>
            ) : (
              <div className="space-y-3">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="border border-zinc-800/60 rounded p-3 bg-zinc-900/30"
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-xs font-mono text-zinc-300">
                        v{snap.version_number}
                      </span>
                      <span className="text-xs font-mono text-zinc-600">
                        {formatTime(snap.created_at)}
                      </span>
                    </div>
                    <ExportForm
                      docId={documentId}
                      snapshot={snap}
                      onExported={handleExported}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
