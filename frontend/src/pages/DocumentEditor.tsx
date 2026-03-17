import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useDocumentStore } from '../stores/document'
import { BlockList } from '../components/editor/BlockList'
import { NavBar } from '../components/shared/NavBar'
import { SnapshotPanel } from '../components/snapshots/SnapshotPanel'
import type { Member } from '../api/types'

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
      ? 'You joined as a collaborator.'
      : joinStatus === 'already-has-access'
        ? 'You already have access to this document.'
        : null

  const dismissJoinMessage = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('join_status')
    setSearchParams(next, { replace: true })
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm font-mono text-red-400 border border-red-800/40 bg-red-950/20 rounded-md p-4 max-w-md">
          Failed to load document: {error}
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm font-mono text-zinc-600 animate-pulse">
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
    <div className="min-h-screen bg-zinc-950">
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
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="text-xs font-mono text-amber-400">
                {pendingCount} pending
              </span>
            )}
            <a
              href={`/documents/${documentId}/history/`}
              className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              history
            </a>
            <span
              className={`px-1.5 py-0.5 text-xs font-mono rounded-sm border ${
                document.status === 'published'
                  ? 'border-green-800/50 text-green-500'
                  : 'border-zinc-700/50 text-zinc-500'
              }`}
            >
              {document.status}
            </span>
            <span
              className={`px-1.5 py-0.5 text-xs font-mono rounded-sm border ${
                document.access_role === 'owner'
                  ? 'border-blue-800/50 text-blue-400'
                  : 'border-amber-800/50 text-amber-400'
              }`}
            >
              {document.access_role}
            </span>
            <span className="text-xs font-mono text-zinc-600">
              {blocks.length} block{blocks.length !== 1 ? 's' : ''}
            </span>
          </div>
        }
      />

      {joinMessage && (
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <div className="flex items-center justify-between gap-4 rounded border border-emerald-800/50 bg-emerald-950/30 px-4 py-3">
            <span className="text-xs font-mono text-emerald-300">{joinMessage}</span>
            <button
              onClick={dismissJoinMessage}
              className="text-xs font-mono text-emerald-500 hover:text-emerald-300 transition-colors"
            >
              dismiss
            </button>
          </div>
        </div>
      )}

      {document.description && (
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-2">
          <p className="prose-font text-sm text-zinc-500 leading-relaxed">
            {document.description}
          </p>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 py-8">
        <BlockList blocks={blocks} documentId={documentId} />
      </main>

      {document.access_role === 'owner' ? (
        <SnapshotPanel
          documentId={documentId}
          isOpen={snapshotOpen}
          onToggle={() => setSnapshotOpen((o) => !o)}
        />
      ) : null}

      <div className="pb-16" />
    </div>
  )
}
