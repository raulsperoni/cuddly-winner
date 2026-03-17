interface Props {
  authorType: 'human' | 'ai'
}

export function AuthorshipBadge({ authorType }: Props) {
  if (authorType === 'ai') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono tracking-tight rounded-sm border border-amber-700/50 bg-amber-950/30 text-amber-400 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
        AI accepted
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono tracking-tight rounded-sm border border-blue-800/50 bg-blue-950/20 text-blue-400 select-none">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
      Human
    </span>
  )
}
