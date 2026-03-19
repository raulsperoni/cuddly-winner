import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { useLocale } from '../../lib/i18n'
import { buildEditorExtensions, promptForLink } from '../../lib/editor'

interface Props {
  blockId: number
  text: string
  isEditing: boolean
  onStartEdit: () => void
  onSave: (text: string) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
  hasPendingSuggestions: boolean
}

export function BlockEditor({
  blockId,
  text,
  isEditing,
  onStartEdit,
  onSave,
  onDelete,
  onCancel,
  hasPendingSuggestions,
}: Props) {
  const { t } = useLocale()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const prevTextRef = useRef(text)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [menuState, setMenuState] = useState({
    visible: false,
    left: 0,
    top: 0,
  })

  const editor = useEditor(
    {
      extensions: buildEditorExtensions(true),
      content: text,
      editable: isEditing,
    },
    [blockId],
  )

  const setMarkdownContent = (content: string) => {
    if (!editor) return
    editor.commands.setContent(content || '')
  }

  useEffect(() => {
    if (!editor) return
    editor.setEditable(isEditing)
    if (!isEditing) {
      const md = editor.storage.markdown?.getMarkdown() ?? ''
      if (md !== text) {
        setMarkdownContent(text)
      }
    }
  }, [isEditing, editor])

  useEffect(() => {
    if (!editor || isEditing || prevTextRef.current === text) return
    prevTextRef.current = text
    setMarkdownContent(text)
  }, [text, editor, isEditing])

  useEffect(() => {
    if (!editor || !isEditing) {
      setMenuState((current) => ({ ...current, visible: false }))
      return
    }

    const updateMenu = () => {
      const host = containerRef.current
      const { from, to } = editor.state.selection

      if (!host || from === to || !editor.isEditable) {
        setMenuState((current) => ({ ...current, visible: false }))
        return
      }

      const start = editor.view.coordsAtPos(from)
      const end = editor.view.coordsAtPos(to)
      const hostRect = host.getBoundingClientRect()
      const centerX = (start.left + end.right) / 2

      setMenuState({
        visible: true,
        left: Math.max(24, Math.min(centerX - hostRect.left, hostRect.width - 24)),
        top: Math.max(0, Math.min(start.top - hostRect.top - 52, hostRect.height - 40)),
      })
    }

    const hideMenu = () => {
      setMenuState((current) => ({ ...current, visible: false }))
    }

    updateMenu()
    editor.on('selectionUpdate', updateMenu)
    editor.on('focus', updateMenu)
    editor.on('blur', hideMenu)

    return () => {
      editor.off('selectionUpdate', updateMenu)
      editor.off('focus', updateMenu)
      editor.off('blur', hideMenu)
    }
  }, [editor, isEditing])

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

  const handleDelete = async () => {
    if (!onDelete || deleting) return
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  const canStartEdit = !isEditing && !hasPendingSuggestions
  const menuButton = (
    active: boolean,
    onClick: () => void,
    label: string,
    children: React.ReactNode,
  ) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[12px] font-mono transition-colors ${
        active
          ? '[background:var(--text-main)] text-[var(--app-bg)]'
          : '[color:var(--text-subtle)] hover:[background:var(--surface-1)] hover:[color:var(--text-main)]'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className="relative">
      {isEditing && editor && menuState.visible ? (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            left: `${menuState.left}px`,
            top: `${menuState.top}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="pointer-events-auto flex items-center gap-1 rounded-xl border px-1.5 py-1 shadow-lg backdrop-blur-sm [border-color:var(--border-subtle)] [background:color-mix(in_srgb,var(--surface-elevated)_92%,transparent)]">
            {menuButton(
              editor.isActive('bold'),
              () => editor.chain().focus().toggleBold().run(),
              t('toolbarBold'),
              <span className="text-[13px] font-black">B</span>,
            )}
            {menuButton(
              editor.isActive('italic'),
              () => editor.chain().focus().toggleItalic().run(),
              t('toolbarItalic'),
              <span className="text-[13px] italic">I</span>,
            )}
            {menuButton(
              editor.isActive('bulletList'),
              () => editor.chain().focus().toggleBulletList().run(),
              t('toolbarBullets'),
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
                <circle cx="3" cy="4" r="1.2" />
                <circle cx="3" cy="8" r="1.2" />
                <circle cx="3" cy="12" r="1.2" />
                <rect x="6" y="3.25" width="7" height="1.5" rx="0.75" />
                <rect x="6" y="7.25" width="7" height="1.5" rx="0.75" />
                <rect x="6" y="11.25" width="7" height="1.5" rx="0.75" />
              </svg>,
            )}
            {menuButton(
              editor.isActive('orderedList'),
              () => editor.chain().focus().toggleOrderedList().run(),
              t('toolbarNumbers'),
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
                <path d="M1.9 3.2h1V1.8h-.8L1.3 2.4v.9l.6-.5ZM1.2 8.8h1.9v-.7H2.2l.5-.5a1.3 1.3 0 0 0 .5-1c0-.8-.6-1.3-1.5-1.3-.6 0-1 .2-1.5.6l.4.7c.3-.3.6-.4.9-.4.4 0 .7.2.7.5 0 .2-.1.4-.4.7l-1.1 1v.4Zm.6 4.1c.6 0 1.1-.2 1.4-.5.2-.2.3-.5.3-.8 0-.6-.4-1-1-1.1.5-.2.8-.6.8-1 0-.8-.7-1.3-1.7-1.3-.5 0-1 .1-1.4.4l.3.7c.3-.2.6-.3 1-.3.5 0 .8.2.8.5 0 .4-.4.6-1 .6h-.3v.7h.3c.7 0 1.1.2 1.1.6 0 .3-.3.5-.8.5-.4 0-.8-.1-1.2-.4l-.3.7c.4.4 1 .7 1.7.7Z" />
                <rect x="6" y="3.25" width="7" height="1.5" rx="0.75" />
                <rect x="6" y="7.25" width="7" height="1.5" rx="0.75" />
                <rect x="6" y="11.25" width="7" height="1.5" rx="0.75" />
              </svg>,
            )}
            <div className="mx-1 h-5 w-px [background:var(--border-subtle)]" />
            {menuButton(
              editor.isActive('link'),
              () => promptForLink(editor, t('toolbarLinkPrompt')),
              t('toolbarLink'),
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
                <path d="M6.2 4.5a2.7 2.7 0 0 1 3.8 0l.7.7-.9.9-.7-.7a1.5 1.5 0 1 0-2.1 2.1l.7.7-.9.9-.7-.7a2.7 2.7 0 0 1 0-3.9Zm3.6 1.6.9-.9.7.7a2.7 2.7 0 1 1-3.8 3.8l-.7-.7.9-.9.7.7a1.5 1.5 0 0 0 2.1-2.1l-.7-.7ZM5.8 8.7l2.9-2.9.9.9-2.9 2.9-.9-.9Z" />
              </svg>,
            )}
          </div>
        </div>
      ) : null}

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
          {onDelete ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-xs font-mono transition-colors disabled:opacity-50 [color:var(--danger)] hover:opacity-80"
            >
              {deleting ? t('deleting') : t('deleteParagraph')}
            </button>
          ) : null}
          <span className="ml-auto text-xs font-mono [color:var(--text-subtle)]">
            {t('editorShortcuts')}
          </span>
        </div>
      )}
    </div>
  )
}
