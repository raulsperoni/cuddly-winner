import { useLocale } from '../../lib/i18n'

export function LoadingScreen({
  label,
}: {
  label?: string
}) {
  const { t } = useLocale()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg)]">
      <span className="text-sm font-mono animate-pulse [color:var(--text-subtle)]">
        {label ?? t('loading')}
      </span>
    </div>
  )
}
