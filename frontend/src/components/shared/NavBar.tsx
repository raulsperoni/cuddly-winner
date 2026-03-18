import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Member } from '../../api/types'
import { BRAND_NAME } from '../../lib/brand'

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

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="3" />
      <line x1="8" y1="1" x2="8" y2="2.5" />
      <line x1="8" y1="13.5" x2="8" y2="15" />
      <line x1="1" y1="8" x2="2.5" y2="8" />
      <line x1="13.5" y1="8" x2="15" y2="8" />
      <line x1="3.4" y1="3.4" x2="4.5" y2="4.5" />
      <line x1="11.5" y1="11.5" x2="12.6" y2="12.6" />
      <line x1="3.4" y1="12.6" x2="4.5" y2="11.5" />
      <line x1="11.5" y1="4.5" x2="12.6" y2="3.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 9A6 6 0 0 1 6 1.5a6.5 6.5 0 1 0 7.5 7.5Z" />
    </svg>
  )
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
    <div className="space-y-1.5">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] [color:var(--text-subtle)]">
        {label}
      </div>
      <div className="rounded-lg border p-2.5 [border-color:var(--border-subtle)] [background:var(--app-bg-soft)]">
        <div className="break-all text-xs font-mono [color:var(--text-main)]">{value}</div>
        <div className="mt-2 flex items-center justify-between gap-3">
          {note ? (
            <div className="text-[10px] font-mono leading-relaxed [color:var(--text-subtle)]">{note}</div>
          ) : (
            <span />
          )}
          <button
            onClick={handleCopy}
            className="flex-shrink-0 px-2 py-0.5 text-[10px] font-mono rounded border transition-colors [border-color:var(--border-subtle)] [color:var(--text-muted)] hover:[border-color:var(--border-strong)] hover:[color:var(--text-main)]"
          >
            {copied ? '✓ copied' : 'copy'}
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
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] [color:var(--text-subtle)]">
        Collaborators
      </div>
      <div className="space-y-1.5">
        {members.map((member) => (
          <div
            key={member.user_id}
            className="flex items-center justify-between gap-3 rounded-lg border px-2.5 py-1.5 [border-color:var(--border-subtle)] [background:var(--app-bg-soft)]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-mono [border-color:var(--border-subtle)] [background:var(--surface-2)] [color:var(--text-main)]">
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
                className="text-[10px] font-mono transition-colors disabled:opacity-50 [color:var(--text-subtle)] hover:[color:var(--danger)]"
              >
                {removingUserId === member.user_id ? '…' : 'remove'}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function SharePopover({
  share,
  onClose,
}: {
  share: ShareProps
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const readOnlyLink = buildAbsoluteUrl(share.readOnlyPath)
  const inviteLink = buildAbsoluteUrl(share.invitePath)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Use capture so it fires before any stopPropagation inside
    document.addEventListener('mousedown', handler, true)
    return () => document.removeEventListener('mousedown', handler, true)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-30 mt-2 w-[26rem] max-w-[calc(100vw-2rem)] rounded-xl border p-4 shadow-xl backdrop-blur-sm [border-color:var(--border-subtle)] [background:var(--surface-elevated)]"
    >
      <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.2em] [color:var(--text-subtle)]">
        Share document
      </div>
      <div className="space-y-3">
        <CopyField
          label="Reading link"
          value={readOnlyLink}
          note="View-only access to the current draft."
        />
        <CopyField
          label="Editing invite"
          value={inviteLink}
          note="Signed-in users join as collaborators."
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
    <header className="sticky top-0 z-20 border-b backdrop-blur-sm [border-color:var(--border-subtle)] [background:var(--surface-elevated)]">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-6">
        {/* ── Left ── */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {back ? (
            <Link
              to={back.to}
              className="flex-shrink-0 text-xs font-mono transition-colors [color:var(--text-muted)] hover:[color:var(--text-main)]"
            >
              ← {back.label}
            </Link>
          ) : (
            <Link
              to="/"
              className="flex-shrink-0 text-sm font-mono font-medium transition-opacity hover:opacity-75 [color:var(--text-main)]"
            >
              {BRAND_NAME}
            </Link>
          )}

          {title && (
            <>
              <span className="flex-shrink-0 text-sm select-none [color:var(--border-strong)]">/</span>
              <span className="truncate text-sm prose-font leading-tight [color:var(--text-main)]">
                {title}
              </span>
            </>
          )}
        </div>

        {/* ── Right ── */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors [border-color:var(--border-subtle)] [color:var(--text-muted)] hover:[border-color:var(--border-strong)] hover:[color:var(--text-main)]"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Injected actions (e.g. "+ New document", snapshot button) */}
          {actions}

          {/* Share */}
          {share ? (
            <div className="relative">
              <button
                onClick={() => setShareOpen((open) => !open)}
                className="h-8 rounded-lg border px-3 text-xs font-mono transition-colors [border-color:var(--border-subtle)] [color:var(--text-muted)] hover:[border-color:var(--border-strong)] hover:[color:var(--text-main)]"
              >
                Share
              </button>
              {shareOpen ? (
                <SharePopover share={share} onClose={() => setShareOpen(false)} />
              ) : null}
            </div>
          ) : null}

          {/* User section */}
          {username && (
            <div className="flex items-center gap-2.5 border-l pl-3 [border-color:var(--border-subtle)]">
              <span className="text-xs font-mono [color:var(--text-subtle)]">{username}</span>
              <a
                href="/accounts/logout/"
                title="Sign out"
                className="text-xs font-mono transition-colors [color:var(--text-subtle)] hover:[color:var(--text-main)]"
              >
                ↩
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
