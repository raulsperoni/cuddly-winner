import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-main)]">
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
        <section className="w-full rounded-3xl border p-8 shadow-2xl shadow-black/10 [border-color:var(--border-subtle)] [background:var(--surface-1)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] [color:var(--text-subtle)]">
            Not found
          </div>
          <h1 className="prose-font mt-4 text-3xl leading-tight [color:var(--text-strong)]">
            This page does not exist.
          </h1>
          <p className="mt-4 text-base leading-8 [color:var(--text-muted)]">
            The document or route you requested could not be found.
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="rounded-xl px-4 py-3 text-xs font-mono uppercase tracking-[0.2em] transition [background:var(--text-strong)] [color:var(--app-bg)] hover:opacity-90"
            >
              Go to documents
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
