import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { NavBar } from '../components/shared/NavBar'
import { usePageTitle } from '../hooks/usePageTitle'
import { useLocale } from '../lib/i18n'

export function DocumentCreate() {
  const { t } = useLocale()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [initialContent, setInitialContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  usePageTitle(t('createDocument'))

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
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-main)]">
      <NavBar back={{ to: '/', label: t('documents') }} title={t('createDocument')} />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-sm font-mono rounded-xl p-3 [color:var(--danger)] [border:1px_solid_var(--danger-soft)] [background:var(--danger-soft)]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-2 [color:var(--text-subtle)]">
              {t('title')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder={t('titlePlaceholder')}
              className="w-full rounded-xl px-4 py-3 text-sm font-mono transition-colors [background:var(--surface-1)] [border:1px_solid_var(--border-subtle)] [color:var(--text-main)] placeholder:[color:var(--text-subtle)] focus:outline-none focus:[border-color:var(--border-strong)]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-2 [color:var(--text-subtle)]">
              {t('description')}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              className="w-full rounded-xl px-4 py-3 text-sm transition-colors [background:var(--surface-1)] [border:1px_solid_var(--border-subtle)] [color:var(--text-main)] placeholder:[color:var(--text-subtle)] focus:outline-none focus:[border-color:var(--border-strong)]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-2 [color:var(--text-subtle)]">
              {t('initialContent')}
            </label>
            <p className="text-xs font-mono mb-2 [color:var(--text-subtle)]">
              {t('initialContentHelp')}
            </p>
            <textarea
              value={initialContent}
              onChange={(e) => setInitialContent(e.target.value)}
              rows={10}
              placeholder={t('initialContentPlaceholder')}
              className="w-full rounded-2xl px-4 py-4 text-base prose-font transition-colors resize-y [background:var(--surface-1)] [border:1px_solid_var(--border-subtle)] [color:var(--text-main)] placeholder:[color:var(--text-subtle)] focus:outline-none focus:[border-color:var(--border-strong)]"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-4 py-3 text-xs font-mono rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors [background:var(--text-strong)] [color:var(--app-bg)] hover:opacity-90"
            >
              {submitting ? t('creating') : t('createDocument')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 text-xs font-mono transition-colors [color:var(--text-subtle)] hover:[color:var(--text-main)]"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
