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
    <div className="rounded-md border border-zinc-800/60 bg-zinc-900/40 px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-600">
          Block {block.position + 1}
        </span>
        {block.current_version ? (
          <span
            className={`px-1.5 py-0.5 text-[10px] font-mono rounded-sm border ${
              block.current_version.author_type === 'ai'
                ? 'border-amber-800/50 text-amber-400'
                : 'border-zinc-700/50 text-zinc-500'
            }`}
          >
            {block.current_version.author_type}
          </span>
        ) : null}
      </div>
      {block.current_version ? (
        <EditorContent
          editor={editor}
          className="prose-font text-[15px] leading-relaxed text-zinc-300"
        />
      ) : (
        <p className="prose-font text-[15px] italic text-zinc-600">Empty block</p>
      )}
    </div>
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
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500">
              Public read-only document
            </div>
            {document ? (
              <h1 className="mt-2 text-lg font-mono text-zinc-100">{document.title}</h1>
            ) : (
              <h1 className="mt-2 text-lg font-mono text-zinc-100">Shared document</h1>
            )}
          </div>
          <a
            href="/accounts/login/"
            className="text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            Login
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-sm font-mono text-zinc-600 animate-pulse">Loading…</p>
        ) : null}

        {error ? (
          <div className="rounded border border-red-800/40 bg-red-950/20 p-4 text-sm font-mono text-red-400">
            Failed to load public document: {error}
          </div>
        ) : null}

        {document ? (
          <div className="space-y-6">
            {document.description ? (
              <p className="prose-font text-sm leading-relaxed text-zinc-500">
                {document.description}
              </p>
            ) : null}
            {document.blocks.length > 0 ? (
              <div className="space-y-3">
                {document.blocks.map((block) => (
                  <PublicBlockView key={block.id} block={block} />
                ))}
              </div>
            ) : (
              <p className="text-sm font-mono text-zinc-600">No content yet.</p>
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}
