import { Suspense, lazy, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useDocumentStore } from '../stores/document'
import { BlockList } from '../components/editor/BlockList'
import { NavBar } from '../components/shared/NavBar'
import type { Member } from '../api/types'

const SnapshotPanel = lazy(() =>
  import('../components/snapshots/SnapshotPanel').then((mod) => ({
    default: mod.SnapshotPanel,
  })),
)

export function DocumentEditor() {
  const { id } = useParams<{ id: string }>()
  const documentId = parseInt(id ?? '0', 10)
  const [searchParams, setSearchParams] = useSearchParams()

  const { document, blocks, error, setDocument, setError } = useDocumentStore()
  const [snapshotOpen, setSnapshotOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    if (!documentId) return
    api
      .getDocument(documentId)
      .then(setDocument)
      .catch((e: Error) => setError(e.message))
  }, [documentId, setDocument, setError])

  useEffect(() => {
    if (!documentId || document?.access_role !== 'owner') return
    api
      .listMembers(documentId)
      .then(setMembers)
      .catch(() => setMembers([]))
  }, [documentId, document?.access_role])

  const handleRemoveMember = async (userId: number) => {
    await api.removeMember(documentId, userId)
    setMembers((current) => current.filter((member) => member.user_id !== userId))
  }

  const joinStatus = searchParams.get('join_status')
  const joinMessage =
    joinStatus === 'joined'
      ? 'You can now review and edit this document.'
      : joinStatus === 'already-has-access'
        ? 'You already have editing access to this document.'
        : null

  const dismissJoinMessage = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('join_status')
    setSearchParams(next, { replace: true })
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="max-w-md rounded-2xl p-4 text-sm font-mono [color:var(--danger)] [border:1px_solid_var(--danger-soft)] [background:var(--danger-soft)]">
          Failed to load document: {error}
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <span className="text-sm font-mono animate-pulse [color:var(--text-subtle)]">
          Loading…
        </span>
      </div>
    )
  }

  const pendingCount = blocks.reduce(
    (sum, b) => sum + (b.pending_suggestions?.length ?? 0),
    0,
  )

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-main)]">
      <NavBar
        back={{ to: '/', label: 'documents' }}
        title={document.title}
        share={{
          readOnlyPath: `/p/${document.public_token}/`,
          invitePath: `/join/${document.invite_token}/`,
          members,
          canManageMembers: document.access_role === 'owner',
          onRemoveMember:
            document.access_role === 'owner' ? handleRemoveMember : undefined,
        }}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {pendingCount > 0 && (
              <span className="text-xs font-mono [color:var(--accent)]">
                {pendingCount} awaiting review
              </span>
            )}
            <a
              href={`/documents/${documentId}/history/`}
              className="text-xs font-mono transition-colors [color:var(--text-subtle)] hover:[color:var(--text-main)]"
            >
              activity
            </a>
            <span
              className={`px-1.5 py-0.5 text-xs font-mono rounded-sm border ${
                document.status === 'published'
                  ? '[border-color:var(--success)] [color:var(--success)]'
                  : '[border-color:var(--border-subtle)] [color:var(--text-subtle)]'
              }`}
            >
              {document.status}
            </span>
            <span
              className={`px-1.5 py-0.5 text-xs font-mono rounded-sm border ${
                document.access_role === 'owner'
                  ? '[border-color:var(--border-strong)] [color:var(--text-muted)]'
                  : '[border-color:var(--accent)] [color:var(--accent)]'
              }`}
            >
              {document.access_role === 'owner' ? 'lead' : 'collaborator'}
            </span>
            <span className="text-xs font-mono [color:var(--text-subtle)]">
              {blocks.length} paragraph{blocks.length !== 1 ? 's' : ''}
            </span>
          </div>
        }
      />

      {joinMessage && (
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3 [border:1px_solid_var(--success-soft)] [background:var(--success-soft)]">
            <span className="text-xs font-mono [color:var(--success)]">{joinMessage}</span>
            <button
              onClick={dismissJoinMessage}
              className="text-xs font-mono transition-colors [color:var(--success)] hover:opacity-80"
            >
              dismiss
            </button>
          </div>
        </div>
      )}

      {document.description && (
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-2">
          <p className="prose-font text-base leading-relaxed [color:var(--text-muted)]">
            {document.description}
          </p>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 py-8">
        <BlockList blocks={blocks} documentId={documentId} />
      </main>

      {document.access_role === 'owner' ? (
        <Suspense
          fallback={
            <div className="mt-8 border-t [border-color:var(--border-subtle)]">
              <div className="mx-auto max-w-4xl px-6 py-4 text-xs font-mono animate-pulse [color:var(--text-subtle)]">
                Loading revisions…
              </div>
            </div>
          }
        >
          <SnapshotPanel
            documentId={documentId}
            isOpen={snapshotOpen}
            onToggle={() => setSnapshotOpen((o) => !o)}
          />
        </Suspense>
      ) : null}

      <div className="pb-16" />
    </div>
  )
}
