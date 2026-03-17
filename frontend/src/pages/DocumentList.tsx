import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { NavBar } from '../components/shared/NavBar'
import type { Document } from '../api/types'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function DocumentList() {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api
      .listDocuments()
      .then(setDocs)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-main)]">
      <NavBar
        actions={
          <Link
            to="/documents/new"
            className="rounded-sm border px-3 py-1.5 text-xs font-mono text-white transition-colors [background:var(--text-main)] [border-color:var(--text-main)] hover:opacity-90"
          >
            + New document
          </Link>
        }
      />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-xs font-mono uppercase tracking-widest mb-6 [color:var(--text-subtle)]">
          Documents
        </h2>

        {loading && (
          <p className="text-sm font-mono animate-pulse [color:var(--text-subtle)]">
            Loading…
          </p>
        )}

        {error && (
          <p className="text-sm font-mono rounded-xl p-3 [color:var(--danger)] [border:1px_solid_var(--danger-soft)] [background:var(--danger-soft)]">
            {error}
          </p>
        )}

        {!loading && !error && docs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm font-mono mb-4 [color:var(--text-subtle)]">
              No documents yet.
            </p>
            <Link
              to="/documents/new"
              className="text-xs font-mono transition-colors [color:var(--text-muted)] hover:[color:var(--text-main)]"
            >
              Create your first document →
            </Link>
          </div>
        )}

        {docs.length > 0 && (
          <div className="divide-y [border-color:var(--border-subtle)]">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => navigate(`/documents/${doc.id}/edit`)}
                className="w-full text-left py-5 flex items-start justify-between gap-6 hover:[background:var(--surface-3)] -mx-4 px-4 rounded-2xl transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base prose-font [color:var(--text-main)] group-hover:[color:var(--text-strong)] transition-colors truncate">
                      {doc.title}
                    </span>
                    <span
                      className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-mono rounded-sm border ${
                        doc.access_role === 'owner'
                          ? '[border-color:var(--border-strong)] [color:var(--text-muted)]'
                          : '[border-color:var(--accent)] [color:var(--accent)]'
                      }`}
                    >
                      {doc.access_role === 'owner' ? 'lead' : 'shared'}
                    </span>
                    <span
                      className={`flex-shrink-0 px-1.5 py-0.5 text-xs font-mono rounded-sm border ${
                        doc.status === 'published'
                          ? '[border-color:var(--success)] [color:var(--success)]'
                          : '[border-color:var(--border-subtle)] [color:var(--text-subtle)]'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="text-sm truncate [color:var(--text-muted)]">
                      {doc.description}
                    </p>
                  )}
                  {doc.access_role === 'collaborator' && (
                    <p className="mt-1 text-[11px] font-mono truncate [color:var(--text-subtle)]">
                      shared by {doc.owner_username}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs font-mono [color:var(--text-muted)]">
                    {doc.block_count} paragraph{doc.block_count !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs font-mono mt-0.5 [color:var(--text-subtle)]">
                    {formatDate(doc.updated_at)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
