import { useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { DiffView } from './DiffView'
import { api } from '../../api/client'
import { useDocumentStore } from '../../stores/document'
import type { Block, Suggestion } from '../../api/types'
import { useLocale } from '../../lib/i18n'

interface Props {
  block: Block
  documentId: number
  suggestions: Suggestion[]
  canDecide?: boolean
}

export function SuggestionPanel({
  block,
  documentId,
  suggestions,
  canDecide = true,
}: Props) {
  const { t } = useLocale()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editingAcceptance, setEditingAcceptance] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const updateBlock = useDocumentStore((s) => s.updateBlock)

  const suggestion = suggestions[currentIndex]

  const editEditor = useEditor(
    {
      extensions: [
        StarterKit,
        Markdown.configure({ html: false, transformPastedText: true }),
      ],
      content: suggestion?.text ?? '',
      editable: true,
    },
    [suggestion?.id],
  )

  if (!suggestion) return null

  const currentText = block.current_version?.text ?? ''

  const handleAccept = async () => {
    setLoading('accept')
    try {
      const updated = await api.acceptSuggestion(documentId, block.id, suggestion.id)
      updateBlock(updated)
    } catch (e) {
      console.error('Accept failed', e)
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    setLoading('reject')
    try {
      const updated = await api.rejectSuggestion(documentId, block.id, suggestion.id)
      updateBlock(updated)
    } catch (e) {
      console.error('Reject failed', e)
    } finally {
      setLoading(null)
    }
  }

  const handleSubmitEdits = async () => {
    if (!editEditor) return
    const text = editEditor.storage.markdown.getMarkdown()
    if (!text.trim()) return
    setLoading('edit-accept')
    try {
      const updated = await api.acceptWithEdits(
        documentId,
        block.id,
        suggestion.id,
        text,
      )
      updateBlock(updated)
      setEditingAcceptance(false)
    } catch (e) {
      console.error('Accept with edits failed', e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border [border-color:var(--border-subtle)] [background:var(--surface-1)]">
      <div className="flex items-center justify-between px-5 py-3 border-b [border-color:var(--border-subtle)] [background:var(--accent-soft)]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[var(--accent)]" />
          <span className="text-xs font-mono uppercase tracking-wider [color:var(--accent)]">
            {t('reviewDraft', {
              label:
                suggestion.suggestion_type === 'custom' && suggestion.instruction
                  ? suggestion.instruction
                  : suggestion.suggestion_type,
            })}
          </span>
        </div>
        {suggestions.length > 1 && (
          <div className="flex items-center gap-2 text-xs font-mono [color:var(--text-subtle)]">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="transition-colors hover:[color:var(--text-main)] disabled:opacity-30"
            >
              ‹
            </button>
            <span>
              {currentIndex + 1} / {suggestions.length}
            </span>
            <button
              onClick={() =>
                setCurrentIndex((i) => Math.min(suggestions.length - 1, i + 1))
              }
              disabled={currentIndex === suggestions.length - 1}
              className="transition-colors hover:[color:var(--text-main)] disabled:opacity-30"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {!editingAcceptance ? (
        <div className="grid grid-cols-2 divide-x [divide-color:var(--border-subtle)]">
          <div className="p-4">
            <div className="text-xs font-mono mb-3 uppercase tracking-wider [color:var(--text-subtle)]">
              {t('currentParagraph')}
            </div>
            <div className="prose-font text-[15px] leading-relaxed [color:var(--text-muted)]">
              {currentText || (
                <span className="italic [color:var(--text-subtle)]">{t('empty')}</span>
              )}
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs font-mono mb-3 uppercase tracking-wider [color:var(--text-subtle)]">
              {t('proposedRevision')}
            </div>
            <DiffView original={currentText} modified={suggestion.text} />
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="text-xs font-mono mb-3 uppercase tracking-wider [color:var(--text-subtle)]">
            {t('reviseBeforeApproval')}
          </div>
          <div className="rounded p-3 focus-within:[border-color:var(--border-strong)] [border:1px_solid_var(--border-subtle)] [background:var(--app-bg-soft)]">
            <EditorContent
              editor={editEditor}
              className="prose-font text-[15px] leading-relaxed min-h-[4em] [color:var(--text-main)]"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3 border-t [border-color:var(--border-subtle)] [background:var(--surface-2)]">
        {!canDecide ? (
          <span className="text-xs font-mono [color:var(--text-subtle)]">
            <a href="/accounts/login/" className="underline [color:var(--text-muted)] hover:[color:var(--text-main)]">
              Sign in
            </a>{' '}
            to approve or reject this suggestion.
          </span>
        ) : !editingAcceptance ? (
          <>
            <button
              onClick={handleAccept}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-mono rounded-sm border disabled:opacity-50 transition-colors [background:var(--accent)] [border-color:var(--accent)] text-white hover:opacity-90"
            >
              {loading === 'accept' ? '…' : t('approve')}
            </button>
            <button
              onClick={() => setEditingAcceptance(true)}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-mono rounded-sm border disabled:opacity-50 transition-colors [background:var(--surface-1)] [border-color:var(--border-subtle)] [color:var(--text-main)] hover:[border-color:var(--border-strong)]"
            >
              {t('reviseAndApprove')}
            </button>
            <button
              onClick={handleReject}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-mono rounded-sm border disabled:opacity-50 transition-colors [border-color:var(--border-subtle)] [color:var(--text-subtle)] hover:[border-color:var(--danger)] hover:[color:var(--danger)] hover:[background:var(--danger-soft)]"
            >
              {loading === 'reject' ? '…' : t('reject')}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSubmitEdits}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-mono rounded-sm border disabled:opacity-50 transition-colors [background:var(--success)] [border-color:var(--success)] text-white hover:opacity-90"
            >
              {loading === 'edit-accept' ? '…' : t('approveRevision')}
            </button>
            <button
              onClick={() => setEditingAcceptance(false)}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-mono rounded-sm border disabled:opacity-50 transition-colors [border-color:var(--border-subtle)] [color:var(--text-subtle)] hover:[color:var(--text-main)]"
            >
              {t('cancel')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
