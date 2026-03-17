import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { api } from '../api/client'
import type { PublicBlock, PublicDocument as PublicDocumentType } from '../api/types'

function PublicBlockView({ block }: { block: PublicBlock }) {
  const content = block.current_version?.text ?? ''
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Markdown.configure({ html: false, transformPastedText: true }),
      ],
      content,
      editable: false,
    },
    [block.id],
  )

  useEffect(() => {
    if (!editor) return
    editor.commands.setContent(content || '')
  }, [editor, content])

  return (
    <article className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 md:grid-cols-[3.5rem_minmax(0,1fr)] md:gap-4">
      <div className="pt-1 text-right">
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] [color:var(--text-subtle)]">
          ¶ {block.position + 1}
        </span>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          {block.current_version ? (
            <span
              className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-mono ${
                block.current_version.author_type === 'ai'
                  ? '[border-color:var(--accent)] [background:var(--accent-soft)] [color:var(--accent)]'
                  : '[border-color:var(--border-subtle)] [background:var(--surface-1)] [color:var(--text-muted)]'
              }`}
            >
              {block.current_version.author_type === 'ai' ? 'Approved AI draft' : 'Human draft'}
            </span>
          ) : null}
        </div>
        {block.current_version ? (
          <EditorContent
            editor={editor}
            className="prose-font text-[20px] leading-[1.95] [color:var(--text-main)]"
          />
        ) : (
          <p className="prose-font text-[20px] italic [color:var(--text-subtle)]">Empty paragraph</p>
        )}
      </div>
    </article>
  )
}

export function PublicDocument() {
  const { token } = useParams<{ token: string }>()
  const [document, setDocument] = useState<PublicDocumentType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api
      .getPublicDocument(token)
      .then(setDocument)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-main)]">
      <header className="border-b backdrop-blur-sm [border-color:var(--border-subtle)] [background:var(--surface-elevated)]">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4 px-6 py-5">
          <div className="max-w-2xl">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] [color:var(--text-subtle)]">
              Shared drafting copy
            </div>
            {document ? (
              <h1 className="mt-2 text-3xl prose-font leading-tight [color:var(--text-strong)]">{document.title}</h1>
            ) : (
              <h1 className="mt-2 text-3xl prose-font leading-tight [color:var(--text-strong)]">Shared document</h1>
            )}
            <p className="mt-3 max-w-xl text-sm leading-7 [color:var(--text-muted)]">
              This link is for reading and circulation. Sign in to join the drafting team when you have an editing invite.
            </p>
          </div>
          <a
            href="/accounts/login/"
            className="rounded-xl border px-3 py-2 text-[11px] font-mono uppercase tracking-[0.2em] transition-colors [border-color:var(--border-subtle)] [color:var(--text-muted)] hover:[border-color:var(--border-strong)] hover:[color:var(--text-main)]"
          >
            Sign in
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {loading ? (
          <p className="text-sm font-mono animate-pulse [color:var(--text-subtle)]">Loading…</p>
        ) : null}

        {error ? (
          <div className="rounded-xl p-4 text-sm font-mono [color:var(--danger)] [border:1px_solid_var(--danger-soft)] [background:var(--danger-soft)]">
            Failed to load public document: {error}
          </div>
        ) : null}

        {document ? (
          <div className="rounded-[2rem] border px-6 py-8 md:px-10 md:py-12 [border-color:var(--border-subtle)] [background:var(--surface-1)]">
            {document.description ? (
              <p className="mx-auto max-w-3xl prose-font text-lg leading-8 [color:var(--text-muted)]">
                {document.description}
              </p>
            ) : null}
            {document.blocks.length > 0 ? (
              <div className="mx-auto mt-8 max-w-3xl space-y-10">
                {document.blocks.map((block) => (
                  <PublicBlockView key={block.id} block={block} />
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm font-mono [color:var(--text-subtle)]">No paragraphs yet.</p>
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}
