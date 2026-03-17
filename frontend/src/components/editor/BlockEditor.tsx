import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

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
          className={`prose-font text-[15px] leading-relaxed ${
            isEditing ? 'text-zinc-100' : 'text-zinc-300'
          }`}
        />
        {!text && !isEditing && (
          <span className="prose-font text-[15px] text-zinc-600 italic">
            Empty — click to edit
          </span>
        )}
      </div>

      {isEditing && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800/40">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-mono rounded-sm bg-zinc-700/80 hover:bg-zinc-600 text-zinc-100 border border-zinc-600/50 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
          <span className="text-xs font-mono text-zinc-700 ml-auto">
            ⌘↵ save · Esc cancel
          </span>
        </div>
      )}
    </div>
  )
}
