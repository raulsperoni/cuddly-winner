import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Member } from '../../api/types'

interface ShareProps {
  readOnlyPath: string
  invitePath: string
  members?: Member[]
  canManageMembers?: boolean
  onRemoveMember?: (userId: number) => Promise<void>
}

interface Props {
  back?: { to: string; label: string }
  title?: string
  actions?: React.ReactNode
  share?: ShareProps
}

declare global {
  interface Window {
    __cwTheme?: string
    __setCwTheme?: (theme: string) => void
  }
}

function buildAbsoluteUrl(path: string): string {
  return `${window.location.origin}${path}`
}

function CopyField({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] [color:var(--text-subtle)]">
        {label}
      </div>
      <div className="rounded-xl border p-3 [border-color:var(--border-subtle)] [background:var(--app-bg-soft)]">
        <div className="break-all text-xs font-mono [color:var(--text-main)]">{value}</div>
        <div className="mt-2 flex items-center justify-between gap-3">
          {note ? (
            <div className="text-[11px] font-mono [color:var(--text-subtle)]">{note}</div>
          ) : (
            <span />
          )}
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-[11px] font-mono rounded-sm border transition-colors [border-color:var(--border-subtle)] [color:var(--text-muted)] hover:[border-color:var(--border-strong)] hover:[color:var(--text-main)]"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MemberList({
  members,
  canManageMembers,
  onRemoveMember,
}: {
  members: Member[]
  canManageMembers?: boolean
  onRemoveMember?: (userId: number) => Promise<void>
}) {
  const [removingUserId, setRemovingUserId] = useState<number | null>(null)

  if (members.length === 0) return null

  const handleRemove = async (userId: number) => {
    if (!onRemoveMember) return
    setRemovingUserId(userId)
    try {
      await onRemoveMember(userId)
    } finally {
      setRemovingUserId(null)
    }
  }

  return (
    <div className="space-y-2 border-t pt-3 [border-color:var(--border-subtle)]">
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] [color:var(--text-subtle)]">
        Collaborators
      </div>
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.user_id}
            className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 [border-color:var(--border-subtle)] [background:var(--app-bg-soft)]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-mono [border-color:var(--border-subtle)] [background:var(--surface-2)] [color:var(--text-main)]">
                {member.username.slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate text-xs font-mono [color:var(--text-main)]">
                {member.username}
              </span>
            </div>
            {canManageMembers && onRemoveMember ? (
              <button
                onClick={() => handleRemove(member.user_id)}
                disabled={removingUserId === member.user_id}
                className="text-[11px] font-mono transition-colors disabled:opacity-50 [color:var(--text-subtle)] hover:[color:var(--danger)]"
              >
                {removingUserId === member.user_id ? '…' : 'Remove'}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function SharePopover({ share }: { share: ShareProps }) {
  const readOnlyLink = buildAbsoluteUrl(share.readOnlyPath)
  const inviteLink = buildAbsoluteUrl(share.invitePath)

  return (
    <div className="absolute right-0 top-full z-30 mt-3 w-[28rem] max-w-[calc(100vw-2rem)] rounded-2xl border p-4 shadow-2xl backdrop-blur [border-color:var(--border-subtle)] [background:var(--surface-elevated)]">
      <div className="space-y-3">
        <CopyField
          label="Reading link"
          value={readOnlyLink}
          note="Use this for review, circulation, or public access to the current draft."
        />
        <CopyField
          label="Editing invite"
          value={inviteLink}
          note="Signed-in recipients can join the drafting team and propose revisions."
        />
        <MemberList
          members={share.members ?? []}
          canManageMembers={share.canManageMembers}
          onRemoveMember={share.onRemoveMember}
        />
      </div>
    </div>
  )
}

export function NavBar({ back, title, actions, share }: Props) {
  const [shareOpen, setShareOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (window.__cwTheme as 'light' | 'dark' | undefined) ?? 'dark',
  )
  const username =
    (window as typeof window & { CURRENT_USER?: { username: string } })
      .CURRENT_USER?.username ?? ''

  useEffect(() => {
    const current = (window.__cwTheme as 'light' | 'dark' | undefined) ?? 'dark'
    setTheme(current)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    window.__setCwTheme?.(next)
    setTheme(next)
  }

  return (
    <header className="sticky top-0 z-20 border-b backdrop-blur-sm bg-[var(--surface-elevated)] [border-color:var(--border-subtle)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="flex items-start gap-4 min-w-0">
          {back ? (
            <Link
              to={back.to}
              className="pt-1 text-xs font-mono transition-colors flex-shrink-0 [color:var(--text-subtle)] hover:[color:var(--text-main)]"
            >
              ← {back.label}
            </Link>
          ) : (
            <Link
              to="/"
              className="pt-1 text-xs font-mono transition-colors flex-shrink-0 [color:var(--text-muted)] hover:[color:var(--text-main)]"
            >
              cuddly-winner
            </Link>
          )}
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] [color:var(--text-subtle)]">
              Accountable drafting
            </div>
            {title ? (
              <div className="mt-1 text-lg prose-font truncate [color:var(--text-strong)]">
                {title}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1 lg:flex-shrink-0 lg:justify-end">
          <button
            onClick={toggleTheme}
            className="rounded-xl border px-3 py-2 text-[11px] font-mono uppercase tracking-[0.2em] transition-colors [border-color:var(--border-subtle)] [color:var(--text-muted)] hover:[border-color:var(--border-strong)] hover:[color:var(--text-main)]"
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          {actions}
          {share ? (
            <div className="relative">
              <button
                onClick={() => setShareOpen((open) => !open)}
                className="rounded-xl border px-3 py-2 text-[11px] font-mono uppercase tracking-[0.2em] transition-colors [border-color:var(--border-subtle)] [color:var(--text-muted)] hover:[border-color:var(--border-strong)] hover:[color:var(--text-main)]"
              >
                Share
              </button>
              {shareOpen ? <SharePopover share={share} /> : null}
            </div>
          ) : null}
          {username && (
            <span className="text-xs font-mono [color:var(--text-subtle)]">{username}</span>
          )}
          <a
            href="/accounts/logout/"
            className="text-xs font-mono uppercase tracking-[0.15em] transition-colors [color:var(--text-subtle)] hover:[color:var(--text-main)]"
          >
            Sign out
          </a>
        </div>
      </div>
    </header>
  )
}
