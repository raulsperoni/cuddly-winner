import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'

function normalizeLinkHref(value: string): string {
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) return value
  if (value.startsWith('#') || value.startsWith('/')) return value
  return `https://${value}`
}

export function buildEditorExtensions(editable: boolean) {
  return [
    StarterKit,
    Link.configure({
      autolink: true,
      linkOnPaste: true,
      openOnClick: !editable,
      HTMLAttributes: {
        rel: 'noopener noreferrer nofollow',
        target: '_blank',
      },
    }),
    Markdown.configure({
      html: false,
      linkify: true,
      transformPastedText: true,
    }),
  ]
}

export function promptForLink(editor: Editor, promptLabel: string): void {
  const currentHref = editor.getAttributes('link').href as string | undefined
  const nextHref = window.prompt(promptLabel, currentHref ?? 'https://')

  if (nextHref === null) return

  const trimmedHref = nextHref.trim()
  const chain = editor.chain().focus().extendMarkRange('link')

  if (!trimmedHref) {
    chain.unsetLink().run()
    return
  }

  chain.setLink({ href: normalizeLinkHref(trimmedHref) }).run()
}
