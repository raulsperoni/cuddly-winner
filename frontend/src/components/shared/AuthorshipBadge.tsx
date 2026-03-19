import { useLocale } from '../../lib/i18n'

interface Props {
  authorType: 'human' | 'ai'
  approvedBy?: string | null
  decisionType?: 'accept' | 'reject' | 'accept_with_edits' | null
}

export function AuthorshipBadge({ authorType, approvedBy, decisionType }: Props) {
  const { t } = useLocale()

  if (decisionType === 'accept_with_edits') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono tracking-tight rounded-sm border [border-color:var(--accent)] [background:var(--accent-soft)] [color:var(--accent)] select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
        {approvedBy
          ? t('aiRevisedBy', { name: approvedBy })
          : t('aiRevisedDraft')}
      </span>
    )
  }

  if (authorType === 'ai') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono tracking-tight rounded-sm border [border-color:var(--accent)] [background:var(--accent-soft)] [color:var(--accent)] select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
        {approvedBy
          ? t('approvedBy', { name: approvedBy })
          : t('aiApprovedDraft')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono tracking-tight rounded-sm border [border-color:var(--border-subtle)] [background:var(--surface-1)] [color:var(--text-muted)] select-none">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-subtle)] flex-shrink-0" />
      {t('humanDraft')}
    </span>
  )
}
