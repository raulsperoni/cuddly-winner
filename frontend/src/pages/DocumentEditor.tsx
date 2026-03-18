import { Suspense, lazy, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useDocumentStore } from '../stores/document'
import { BlockList } from '../components/editor/BlockList'
import { NavBar } from '../components/shared/NavBar'
import type { Member } from '../api/types'
import { usePageTitle } from '../hooks/usePageTitle'
import { useLocale } from '../lib/i18n'

const SnapshotPanel = lazy(() =>
  import('../components/snapshots/SnapshotPanel').then((mod) => ({
    default: mod.SnapshotPanel,
  })),
)

export function DocumentEditor() {
  const { t } = useLocale()
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
      ? t('joinJoined')
      : joinStatus === 'already-has-access'
        ? t('joinAlreadyHasAccess')
        : null

  const dismissJoinMessage = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('join_status')
    setSearchParams(next, { replace: true })
  }

  usePageTitle(document?.title ? `${document.title} · ${t('editor')}` : t('editor'))

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="max-w-md rounded-2xl p-4 text-sm font-mono [color:var(--danger)] [border:1px_solid_var(--danger-soft)] [background:var(--danger-soft)]">
          {t('failedToLoadDocument', { error })}
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <span className="text-sm font-mono animate-pulse [color:var(--text-subtle)]">
          {t('loading')}
        </span>
      </div>
    )
  }

  const pendingCount = blocks.reduce(
    (sum, b) => sum + (b.pending_suggestions?.length ?? 0),
    0,
  )
  const isOnboardingGuest = document.access_role === 'onboarding_guest'

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-main)]">
      <NavBar
        back={{ to: '/', label: t('documents') }}
        title={document.title}
        share={
          isOnboardingGuest
            ? undefined
            : {
                readOnlyPath: `/p/${document.public_token}/`,
                invitePath: `/join/${document.invite_token}/`,
                members,
                canManageMembers: document.access_role === 'owner',
                onRemoveMember:
                  document.access_role === 'owner' ? handleRemoveMember : undefined,
              }
        }
        actions={
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="text-xs font-mono [color:var(--accent)]">
                {t('awaitingReview', { count: pendingCount })}
              </span>
            )}
            <a
              href={`/documents/${documentId}/history/`}
              className="hidden sm:inline text-xs font-mono transition-colors [color:var(--text-subtle)] hover:[color:var(--text-main)]"
            >
              {t('activity')}
            </a>
            <span
              className={`hidden sm:inline px-1.5 py-0.5 text-xs font-mono rounded-sm border ${
                document.status === 'published'
                  ? '[border-color:var(--success)] [color:var(--success)]'
                  : '[border-color:var(--border-subtle)] [color:var(--text-subtle)]'
              }`}
            >
              {document.status === 'published' ? t('statusPublished') : t('statusDraft')}
            </span>
            <span
              className={`hidden sm:inline px-1.5 py-0.5 text-xs font-mono rounded-sm border ${
                document.access_role === 'owner'
                  ? '[border-color:var(--border-strong)] [color:var(--text-muted)]'
                  : isOnboardingGuest
                    ? '[border-color:var(--border-subtle)] [color:var(--text-subtle)]'
                    : '[border-color:var(--accent)] [color:var(--accent)]'
              }`}
            >
              {document.access_role === 'owner'
                ? t('owner')
                : isOnboardingGuest
                  ? t('guest')
                  : t('collaborator')}
            </span>
            <span className="hidden sm:inline text-xs font-mono [color:var(--text-subtle)]">
              {t('paragraphsCount', { count: blocks.length })}
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
              {t('dismiss')}
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

      {isOnboardingGuest && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3 [border:1px_solid_var(--border-subtle)] [background:var(--surface-2)]">
            <span className="text-xs font-mono [color:var(--text-muted)]">
              {t('onboardingGuestIntro')}
            </span>
            {!window.CURRENT_USER?.username ? (
              <a
                href="/accounts/login/"
                className="flex-shrink-0 px-3 py-1.5 text-xs font-mono rounded-sm border transition-colors [background:var(--text-main)] [border-color:var(--text-main)] text-[var(--app-bg)] hover:opacity-90"
              >
                {t('signIn')}
              </a>
            ) : null}
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 py-8">
        <BlockList
          blocks={blocks}
          documentId={documentId}
          canEdit={document.can_edit}
          canDecide={document.can_decide}
          canSuggest={document.can_request_suggestions}
        />
      </main>

      {document.access_role === 'owner' ? (
        <Suspense
          fallback={
            <div className="mt-8 border-t [border-color:var(--border-subtle)]">
              <div className="mx-auto max-w-4xl px-6 py-4 text-xs font-mono animate-pulse [color:var(--text-subtle)]">
                {t('revisionsLoading')}
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
