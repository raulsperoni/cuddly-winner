import { Link } from 'react-router-dom'
import { NavBar } from '../components/shared/NavBar'
import { BRAND_DOMAIN } from '../lib/brand'
import { usePageTitle } from '../hooks/usePageTitle'
import { useLocale } from '../lib/i18n'

export function AboutPage() {
  const { t } = useLocale()

  usePageTitle(`${t('aboutHeading')} · DraftingDocs`)

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-main)]">
      <NavBar
        back={{ to: '/', label: t('documents') }}
      />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <section className="rounded-[2rem] border p-6 md:p-10 [border-color:var(--border-subtle)] [background:var(--surface-1)]">
          <div className="mb-3 text-[11px] font-mono uppercase tracking-[0.25em] [color:var(--text-subtle)]">
            {BRAND_DOMAIN}
          </div>
          <h1 className="max-w-2xl text-3xl prose-font leading-tight [color:var(--text-strong)]">
            {t('aboutHeading')}
          </h1>

          <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1.7fr)_minmax(14rem,0.9fr)] md:items-start">
            <div className="space-y-5">
              <p className="max-w-2xl text-lg leading-8 [color:var(--text-main)]">
                {t('aboutVisionIntro')}
              </p>
              <p className="max-w-2xl text-sm leading-7 [color:var(--text-muted)]">
                {t('aboutVisionBody')}
              </p>
              <p className="max-w-2xl text-sm font-mono leading-7 [color:var(--accent)]">
                {t('aboutVisionRule')}
              </p>
            </div>

            <aside className="rounded-2xl border p-4 [border-color:var(--border-subtle)] [background:var(--surface-2)]">
              <div className="mb-3 text-[11px] font-mono uppercase tracking-[0.2em] [color:var(--text-subtle)]">
                {t('aboutLinksLabel')}
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href="https://raulsperoni.me/"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border px-3 py-2 text-sm transition-colors [border-color:var(--border-subtle)] [color:var(--text-main)] hover:[border-color:var(--border-strong)] hover:[background:var(--surface-1)]"
                >
                  {t('aboutBlog')}
                </a>
                <a
                  href="https://github.com/raulsperoni/cuddly-winner"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border px-3 py-2 text-sm transition-colors [border-color:var(--border-subtle)] [color:var(--text-main)] hover:[border-color:var(--border-strong)] hover:[background:var(--surface-1)]"
                >
                  {t('aboutGitHub')}
                </a>
                <a
                  href="https://bsky.app/profile/raulsperoni.me"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border px-3 py-2 text-sm transition-colors [border-color:var(--border-subtle)] [color:var(--text-main)] hover:[border-color:var(--border-strong)] hover:[background:var(--surface-1)]"
                >
                  {t('aboutBluesky')}
                </a>
              </div>
            </aside>
          </div>

          <div className="mt-10 border-t pt-5 [border-color:var(--border-subtle)]">
            <Link
              to="/"
              className="text-xs font-mono transition-colors [color:var(--text-subtle)] hover:[color:var(--text-main)]"
            >
              {t('goToDocuments')}
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
