import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Snapshot } from '../../api/types'
import { useLocale } from '../../lib/i18n'

interface Props {
  documentId: number
  isOpen: boolean
  onToggle: () => void
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
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (snapshot.github_commit_sha) {
    return (
      <span className="text-xs font-mono [color:var(--text-subtle)]">
        {t('exportedToGitHub', {
          repo: snapshot.github_repo,
          sha: snapshot.github_commit_sha.slice(0, 7),
        })}
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
        className="text-xs font-mono transition-colors [color:var(--text-subtle)] hover:[color:var(--accent)]"
      >
        {t('exportToGitHub')}
      </button>
    )
  }

  return (
    <form onSubmit={handleExport} className="mt-2 space-y-2">
      {error && (
        <p className="text-xs font-mono [color:var(--danger)]">{error}</p>
      )}
      <input
        type="text"
        value={repo}
        onChange={(e) => setRepo(e.target.value)}
        placeholder={t('ownerRepoPlaceholder')}
        required
        className="w-full rounded px-2 py-1 text-xs font-mono focus:outline-none [background:var(--app-bg-soft)] [border:1px_solid_var(--border-subtle)] [color:var(--text-main)] placeholder:[color:var(--text-subtle)] focus:[border-color:var(--border-strong)]"
      />
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder={t('githubTokenPlaceholder')}
        className="w-full rounded px-2 py-1 text-xs font-mono focus:outline-none [background:var(--app-bg-soft)] [border:1px_solid_var(--border-subtle)] [color:var(--text-main)] placeholder:[color:var(--text-subtle)] focus:[border-color:var(--border-strong)]"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !repo.trim()}
          className="px-3 py-1 text-xs font-mono rounded-sm border disabled:opacity-40 transition-colors [background:var(--accent)] [border-color:var(--accent)] text-white hover:opacity-90"
        >
          {loading ? '…' : t('export')}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-mono transition-colors [color:var(--text-subtle)] hover:[color:var(--text-main)]"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  )
}

export function SnapshotPanel({ documentId, isOpen, onToggle }: Props) {
  const { t, formatDate } = useLocale()
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
    <div className="border-t mt-8 [border-color:var(--border-subtle)]">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-xs font-mono transition-colors [color:var(--text-subtle)] hover:[color:var(--text-main)]"
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
          {t('snapshots')}
          {snapshots.length > 0 && (
            <span className="[color:var(--text-subtle)]">({snapshots.length})</span>
          )}
        </button>

        {isOpen && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-wider [color:var(--text-subtle)]">
                {t('publishedRevisions')}
              </span>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-3 py-1 text-xs font-mono rounded-sm border disabled:opacity-50 transition-colors [background:var(--surface-1)] [border-color:var(--border-subtle)] [color:var(--text-main)] hover:[border-color:var(--border-strong)]"
              >
                {creating ? '…' : t('saveSnapshot')}
              </button>
            </div>

            {loading ? (
              <p className="text-xs font-mono animate-pulse [color:var(--text-subtle)]">
                {t('loading')}
              </p>
            ) : snapshots.length === 0 ? (
              <p className="text-xs font-mono [color:var(--text-subtle)]">
                {t('noSnapshotsYet')}
              </p>
            ) : (
              <div className="space-y-3">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="rounded p-3 [border:1px_solid_var(--border-subtle)] [background:var(--surface-2)]"
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-xs font-mono [color:var(--text-main)]">
                        v{snap.version_number}
                      </span>
                      <span className="text-xs font-mono [color:var(--text-subtle)]">
                        {formatDate(snap.created_at, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
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
