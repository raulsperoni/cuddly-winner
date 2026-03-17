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
    <div className="min-h-screen bg-zinc-950">
      <NavBar
        actions={
          <Link
            to="/documents/new"
            className="px-3 py-1.5 text-xs font-mono rounded-sm bg-zinc-700/80 hover:bg-zinc-600 text-zinc-100 border border-zinc-600/50 transition-colors"
          >
            + New document
          </Link>
        }
      />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">
          Documents
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

        {!loading && !error && docs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm font-mono text-zinc-600 mb-4">
              No documents yet.
            </p>
            <Link
              to="/documents/new"
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Create your first document →
            </Link>
          </div>
        )}

        {docs.length > 0 && (
          <div className="divide-y divide-zinc-800/60">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => navigate(`/documents/${doc.id}/edit`)}
                className="w-full text-left py-4 flex items-start justify-between gap-6 hover:bg-zinc-900/40 -mx-4 px-4 rounded transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-zinc-200 group-hover:text-white transition-colors truncate">
                      {doc.title}
                    </span>
                    <span
                      className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-mono rounded-sm border ${
                        doc.access_role === 'owner'
                          ? 'border-blue-800/50 text-blue-400'
                          : 'border-amber-800/50 text-amber-400'
                      }`}
                    >
                      {doc.access_role === 'owner' ? 'owned' : 'shared'}
                    </span>
                    <span
                      className={`flex-shrink-0 px-1.5 py-0.5 text-xs font-mono rounded-sm border ${
                        doc.status === 'published'
                          ? 'border-green-800/50 text-green-500'
                          : 'border-zinc-700/50 text-zinc-500'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="text-xs font-mono text-zinc-600 truncate">
                      {doc.description}
                    </p>
                  )}
                  {doc.access_role === 'collaborator' && (
                    <p className="mt-1 text-[11px] font-mono text-zinc-700 truncate">
                      owned by {doc.owner_username}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs font-mono text-zinc-600">
                    {doc.block_count} block{doc.block_count !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs font-mono text-zinc-700 mt-0.5">
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
