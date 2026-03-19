import { InputRule, type Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'

function normalizeLinkHref(value: string): string {
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) return value
  if (value.startsWith('#') || value.startsWith('/')) return value
  return `https://${value}`
}

const MarkdownLink = Link.extend({
  addInputRules() {
    return [
      ...this.parent?.() ?? [],
      new InputRule({
        find: /\[([^[\]]+)\]\(([^()\s]+(?:\([^()\s]*\)[^()\s]*)*)\)$/,
        handler: ({ state, range, match }) => {
          const label = match[1]
          const href = normalizeLinkHref(match[2])
          const { tr } = state

          tr.insertText(label, range.from, range.to)
          tr.addMark(
            range.from,
            range.from + label.length,
            this.type.create({ href }),
          )
          tr.removeStoredMark(this.type)
        },
      }),
    ]
  },
})

export function buildEditorExtensions(editable: boolean) {
  return [
    StarterKit,
    MarkdownLink.configure({
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
  const { from, to } = editor.state.selection
  const currentHref = editor.getAttributes('link').href as string | undefined
  const nextHref = window.prompt(promptLabel, currentHref ?? 'https://')

  if (nextHref === null) return

  const trimmedHref = nextHref.trim()
  const chain = editor
    .chain()
    .focus()
    .setTextSelection({ from, to })
    .extendMarkRange('link')

  if (!trimmedHref) {
    chain.unsetLink().run()
    return
  }

  chain.setLink({ href: normalizeLinkHref(trimmedHref) }).run()
}
