export function LoadingScreen({
  label = 'Loading…',
}: {
  label?: string
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg)]">
      <span className="text-sm font-mono animate-pulse [color:var(--text-subtle)]">
        {label}
      </span>
    </div>
  )
}
