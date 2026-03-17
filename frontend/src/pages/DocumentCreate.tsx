import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { NavBar } from '../components/shared/NavBar'

export function DocumentCreate() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [initialContent, setInitialContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const doc = await api.createDocument({
        title: title.trim(),
        description: description.trim(),
        initial_content: initialContent.trim(),
      })
      navigate(`/documents/${doc.id}/edit`)
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <NavBar back={{ to: '/', label: 'back' }} title="New document" />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-sm font-mono text-red-400 border border-red-800/40 bg-red-950/20 rounded p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder="Policy document title"
              className="w-full bg-zinc-900 border border-zinc-700/60 rounded px-3 py-2 text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              className="w-full bg-zinc-900 border border-zinc-700/60 rounded px-3 py-2 text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">
              Initial content
            </label>
            <p className="text-xs font-mono text-zinc-600 mb-2">
              Paste existing text. Blank lines between paragraphs create
              separate blocks.
            </p>
            <textarea
              value={initialContent}
              onChange={(e) => setInitialContent(e.target.value)}
              rows={10}
              placeholder="Paste your document text here…"
              className="w-full bg-zinc-900 border border-zinc-700/60 rounded px-3 py-2 text-sm prose-font text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-y"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-4 py-2 text-xs font-mono rounded-sm bg-zinc-200 hover:bg-white text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creating…' : 'Create document'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
