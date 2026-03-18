import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { BlockVersion } from '../../api/types'
import { useLocale } from '../../lib/i18n'

interface Props {
  blockId: number
  documentId: number
  isOpen: boolean
  onToggle: () => void
}

export function LineagePanel({ blockId, documentId, isOpen, onToggle }: Props) {
  const { t, formatRelativeTime } = useLocale()
  const [versions, setVersions] = useState<BlockVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!isOpen || fetched) return
    setLoading(true)
    api
      .getVersions(documentId, blockId)
      .then((v) => {
        setVersions([...v].reverse())
        setFetched(true)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isOpen, blockId, documentId, fetched])

  return (
    <div>
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {t('viewHistory')}
      </button>

      {isOpen && (
        <div className="mt-2 border-l pl-3 [border-color:var(--border-subtle)]">
          {loading ? (
            <div className="text-xs font-mono py-1 [color:var(--text-subtle)]">{t('loading')}</div>
          ) : versions.length === 0 ? (
            <div className="text-xs font-mono py-1 [color:var(--text-subtle)]">{t('noRevisionsYet')}</div>
          ) : (
            <ol className="space-y-2">
              {versions.map((v, i) => (
                <li key={v.id} className="text-xs font-mono">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        v.is_current ? 'bg-[var(--text-main)]' : 'bg-[var(--text-subtle)]'
                      }`}
                    />
                    <div className="leading-relaxed">
                      <span className="[color:var(--text-subtle)]">
                        {t('revision', { count: versions.length - i })}{' '}
                      </span>
                      {v.author_type === 'ai' ? (
                        <span className="[color:var(--accent)]">{t('aiApprovedDraft')}</span>
                      ) : (
                        <span className="[color:var(--text-main)]">
                          {v.author_username ?? 'you'}
                        </span>
                      )}
                      <span className="[color:var(--text-subtle)]">
                        {' '}· {formatRelativeTime(v.created_at)}
                      </span>
                      {v.is_current && (
                        <span className="ml-1.5 [color:var(--text-subtle)]">{t('current')}</span>
                      )}
                      {v.author_type === 'ai' && v.decision && (
                        <div className="mt-1 text-[11px] [color:var(--text-subtle)]">
                          {t('approvedBy', { name: v.decision.decided_by_username })}
                          {v.decision.decision_type === 'accept_with_edits'
                            ? ` ${t('afterRevision')}`
                            : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
