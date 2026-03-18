import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import { NavBar } from '../components/shared/NavBar'
import { usePageTitle } from '../hooks/usePageTitle'
import { useLocale } from '../lib/i18n'

interface AuditEvent {
  id: number
  event_type: string
  actor_username: string | null
  block_id: number | null
  data: Record<string, unknown>
  created_at: string
}

const EVENT_COLORS: Record<string, string> = {
  document_created: '[color:var(--success)]',
  block_created: '[color:var(--text-muted)]',
  block_edited: '[color:var(--text-muted)]',
  suggestion_created: '[color:var(--accent)]',
  suggestion_accepted: '[color:var(--success)]',
  suggestion_rejected: '[color:var(--danger)]',
  snapshot_created: '[color:var(--accent)]',
  snapshot_exported: '[color:var(--accent)]',
}

function describeEvent(
  event: AuditEvent,
  t: (key: Parameters<ReturnType<typeof useLocale>['t']>[0], params?: Record<string, string | number>) => string,
): string | null {
  if (event.event_type === 'suggestion_created') {
    const suggestionType = event.data.suggestion_type
    return suggestionType
      ? t('requestedAiDraftType', { type: String(suggestionType) })
      : t('requestedAiDraft')
  }
  if (event.event_type === 'suggestion_accepted') {
    const decisionType = event.data.decision_type
    if (decisionType === 'accept_with_edits') {
      return t('approvedAiDraftAfterRevision')
    }
    return t('approvedAiWording')
  }
  if (event.event_type === 'suggestion_rejected') {
    return t('rejectedAiWording')
  }
  if (event.event_type === 'snapshot_created') {
    const version = event.data.version_number ?? event.data.version
    return version ? t('savedSnapshotVersion', { version: String(version) }) : t('savedSnapshot')
  }
  if (event.event_type === 'snapshot_exported') {
    const repo = event.data.github_repo ?? event.data.repo
    return repo ? t('exportedSnapshotRepo', { repo: String(repo) }) : t('exportedSnapshot')
  }
  if (event.event_type === 'block_edited') {
    return t('savedParagraphRevision')
  }
  if (event.event_type === 'block_created') {
    return t('addedNewParagraph')
  }
  if (event.event_type === 'document_created') {
    return t('openedNewDocument')
  }
  return null
}

export function DocumentHistory() {
  const { t, formatDate } = useLocale()
  const { id } = useParams<{ id: string }>()
  const docId = parseInt(id ?? '0', 10)

  const [docTitle, setDocTitle] = useState('')
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  usePageTitle(docTitle ? `${docTitle} · ${t('activity')}` : t('activity'))

  useEffect(() => {
    Promise.all([
      api.getDocument(docId),
      api.getHistory(docId),
    ])
      .then(([doc, history]) => {
        setDocTitle(doc.title)
        setEvents(history)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [docId])

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-main)]">
      <NavBar
        back={{ to: `/documents/${docId}/edit`, label: t('editor') }}
        title={docTitle || t('activity')}
      />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-xs font-mono uppercase tracking-widest mb-8 [color:var(--text-subtle)]">
          {t('documentActivity')}
        </h2>

        {loading && (
          <p className="text-sm font-mono animate-pulse [color:var(--text-subtle)]">
            {t('loading')}
          </p>
        )}

        {error && (
          <p className="text-sm font-mono rounded-xl p-3 [color:var(--danger)] [border:1px_solid_var(--danger-soft)] [background:var(--danger-soft)]">
            {error}
          </p>
        )}

        {!loading && events.length === 0 && (
          <p className="text-sm font-mono [color:var(--text-subtle)]">{t('noActivityYet')}</p>
        )}

        {events.length > 0 && (
          <ol className="relative border-l space-y-0 [border-color:var(--border-subtle)]">
            {events.map((event) => (
              <li key={event.id} className="ml-4 pb-6">
                <span className="absolute -left-1.5 w-3 h-3 rounded-full [background:var(--surface-2)] [border:1px_solid_var(--border-strong)]" />
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`text-xs font-mono ${
                      EVENT_COLORS[event.event_type] ?? '[color:var(--text-muted)]'
                    }`}
                  >
                    {{
                      document_created: t('eventDocumentCreated'),
                      block_created: t('eventBlockCreated'),
                      block_edited: t('eventBlockEdited'),
                      suggestion_created: t('eventSuggestionCreated'),
                      suggestion_accepted: t('eventSuggestionAccepted'),
                      suggestion_rejected: t('eventSuggestionRejected'),
                      snapshot_created: t('eventSnapshotCreated'),
                      snapshot_exported: t('eventSnapshotExported'),
                    }[event.event_type] ?? event.event_type}
                  </span>
                  <div className="mt-1 text-sm leading-7 [color:var(--text-main)]">
                    {describeEvent(event, t)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono [color:var(--text-subtle)]">
                    {event.actor_username && (
                      <span>{event.actor_username}</span>
                    )}
                    <span>
                      {formatDate(event.created_at, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {event.block_id && (
                      <span>{t('paragraphNumber', { id: event.block_id })}</span>
                    )}
                  </div>
                  {Object.keys(event.data).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] font-mono uppercase tracking-[0.2em] [color:var(--text-subtle)]">
                        {t('rawEventData')}
                      </summary>
                      <pre className="mt-2 overflow-x-auto rounded-xl px-3 py-2 text-xs font-mono [color:var(--text-subtle)] [background:var(--surface-2)]">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  )
}
