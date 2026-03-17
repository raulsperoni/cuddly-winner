import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

function getErrorMessage(error: unknown): { title: string; detail: string } {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        title: 'Page not found',
        detail: 'The page or document route you requested could not be found.',
      }
    }
    return {
      title: `${error.status} ${error.statusText}`,
      detail:
        typeof error.data === 'string'
          ? error.data
          : 'The application could not complete this request.',
    }
  }

  if (error instanceof Error) {
    return {
      title: 'Something went wrong',
      detail: error.message,
    }
  }

  return {
    title: 'Something went wrong',
    detail: 'An unexpected application error occurred.',
  }
}

export function RouteErrorPage() {
  const error = useRouteError()
  const message = getErrorMessage(error)

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-main)]">
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
        <section className="w-full rounded-3xl border p-8 shadow-2xl shadow-black/10 [border-color:var(--border-subtle)] [background:var(--surface-1)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] [color:var(--text-subtle)]">
            Routing error
          </div>
          <h1 className="prose-font mt-4 text-3xl leading-tight [color:var(--text-strong)]">
            {message.title}
          </h1>
          <p className="mt-4 text-base leading-8 [color:var(--text-muted)]">
            {message.detail}
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link
              to="/"
              className="rounded-xl px-4 py-3 text-xs font-mono uppercase tracking-[0.2em] transition [background:var(--text-strong)] [color:var(--app-bg)] hover:opacity-90"
            >
              Go to documents
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-3 text-xs font-mono uppercase tracking-[0.2em] transition [color:var(--text-subtle)] hover:[color:var(--text-main)]"
            >
              Reload page
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
