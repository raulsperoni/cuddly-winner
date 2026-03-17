import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { NavBar } from '../components/shared/NavBar'

interface AuditEvent {
  id: number
  event_type: string
  actor_username: string | null
  block_id: number | null
  data: Record<string, unknown>
  created_at: string
}

const EVENT_LABELS: Record<string, string> = {
  document_created: 'Document created',
  block_created: 'Block added',
  block_edited: 'Block edited',
  suggestion_created: 'AI suggestion requested',
  suggestion_accepted: 'AI suggestion accepted',
  suggestion_rejected: 'AI suggestion rejected',
  snapshot_created: 'Snapshot created',
  snapshot_exported: 'Snapshot exported to GitHub',
}

const EVENT_COLORS: Record<string, string> = {
  document_created: 'text-blue-400',
  block_created: 'text-zinc-400',
  block_edited: 'text-zinc-400',
  suggestion_created: 'text-amber-500',
  suggestion_accepted: 'text-green-400',
  suggestion_rejected: 'text-red-400',
  snapshot_created: 'text-purple-400',
  snapshot_exported: 'text-purple-400',
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DocumentHistory() {
  const { id } = useParams<{ id: string }>()
  const docId = parseInt(id ?? '0', 10)

  const [docTitle, setDocTitle] = useState('')
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    <div className="min-h-screen bg-zinc-950">
      <NavBar
        back={{ to: `/documents/${docId}/edit`, label: 'editor' }}
        title={docTitle || 'History'}
      />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-8">
          Audit timeline
        </h2>

        {loading && (
          <p className="text-sm font-mono text-zinc-600 animate-pulse">
            Loading…
          </p>
        )}

        {error && (
          <p className="text-sm font-mono text-red-400 border border-red-800/40 bg-red-950/20 rounded p-3">
            {error}
          </p>
        )}

        {!loading && events.length === 0 && (
          <p className="text-sm font-mono text-zinc-600">No events yet.</p>
        )}

        {events.length > 0 && (
          <ol className="relative border-l border-zinc-800/60 space-y-0">
            {events.map((event) => (
              <li key={event.id} className="ml-4 pb-6">
                <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700" />
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`text-xs font-mono ${
                      EVENT_COLORS[event.event_type] ?? 'text-zinc-400'
                    }`}
                  >
                    {EVENT_LABELS[event.event_type] ?? event.event_type}
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-600">
                    {event.actor_username && (
                      <span className="text-zinc-500">{event.actor_username}</span>
                    )}
                    <span>{formatTime(event.created_at)}</span>
                    {event.block_id && (
                      <span>block #{event.block_id}</span>
                    )}
                  </div>
                  {Object.keys(event.data).length > 0 && (
                    <pre className="mt-1 text-xs font-mono text-zinc-700 bg-zinc-900/40 rounded px-2 py-1 overflow-x-auto">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
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
