import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { useLocale } from '../../lib/i18n'

interface Props {
  blockId: number
  text: string
  isEditing: boolean
  onStartEdit: () => void
  onSave: (text: string) => Promise<void>
  onCancel: () => void
  hasPendingSuggestions: boolean
}

export function BlockEditor({
  blockId,
  text,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  hasPendingSuggestions,
}: Props) {
  const { t } = useLocale()
  const [saving, setSaving] = useState(false)
  const prevTextRef = useRef(text)

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Markdown.configure({ html: false, transformPastedText: true }),
      ],
      content: text,
      editable: isEditing,
    },
    [blockId],
  )

  useEffect(() => {
    if (!editor) return
    editor.setEditable(isEditing)
    if (!isEditing) {
      const md = editor.storage.markdown?.getMarkdown() ?? ''
      if (md !== text) {
        editor.commands.setContent(text || '')
      }
    }
  }, [isEditing, editor])

  useEffect(() => {
    if (!editor || isEditing || prevTextRef.current === text) return
    prevTextRef.current = text
    editor.commands.setContent(text || '')
  }, [text, editor, isEditing])

  const handleSave = async () => {
    if (!editor) return
    setSaving(true)
    try {
      const md = editor.storage.markdown.getMarkdown()
      await onSave(md)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isEditing) {
      onCancel()
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isEditing) {
      e.preventDefault()
      handleSave()
    }
  }

  const canStartEdit = !isEditing && !hasPendingSuggestions

  return (
    <div onKeyDown={handleKeyDown}>
      <div
        onClick={() => {
          if (canStartEdit) onStartEdit()
        }}
        className={canStartEdit ? 'cursor-text' : ''}
      >
        <EditorContent
          editor={editor}
          className={`prose-font text-[18px] leading-[1.85] ${
            isEditing ? '[color:var(--text-strong)]' : '[color:var(--text-main)]'
          }`}
        />
        {!text && !isEditing && (
          <span className="prose-font text-[18px] italic [color:var(--text-subtle)]">
            {t('emptyParagraphClick')}
          </span>
        )}
      </div>

      {isEditing && (
        <div className="mt-5 flex items-center gap-2 border-t pt-4 [border-color:var(--border-subtle)]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-sm border px-3 py-1.5 text-xs font-mono text-white transition-colors disabled:opacity-50 [background:var(--text-main)] [border-color:var(--text-main)] hover:opacity-90"
          >
            {saving ? t('saving') : t('saveRevision')}
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-mono transition-colors [color:var(--text-subtle)] hover:[color:var(--text-main)]"
          >
            {t('keepCurrentText')}
          </button>
          <span className="ml-auto text-xs font-mono [color:var(--text-subtle)]">
            {t('editorShortcuts')}
          </span>
        </div>
      )}
    </div>
  )
}
