import { useState } from 'react'
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
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>
      <div className="rounded border border-zinc-800/70 bg-zinc-950/80 p-2">
        <div className="break-all text-xs font-mono text-zinc-300">{value}</div>
        <div className="mt-2 flex items-center justify-between gap-3">
          {note ? (
            <div className="text-[11px] font-mono text-zinc-600">{note}</div>
          ) : (
            <span />
          )}
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-[11px] font-mono rounded-sm border border-zinc-700/60 text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
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
    <div className="space-y-2 border-t border-zinc-800/70 pt-3">
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500">
        Collaborators
      </div>
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.user_id}
            className="flex items-center justify-between gap-3 rounded border border-zinc-800/60 bg-zinc-950/60 px-2 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700/70 bg-zinc-900 text-[11px] font-mono text-zinc-300">
                {member.username.slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate text-xs font-mono text-zinc-300">
                {member.username}
              </span>
            </div>
            {canManageMembers && onRemoveMember ? (
              <button
                onClick={() => handleRemove(member.user_id)}
                disabled={removingUserId === member.user_id}
                className="text-[11px] font-mono text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
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
    <div className="absolute right-0 top-full z-30 mt-2 w-[24rem] max-w-[calc(100vw-2rem)] rounded-md border border-zinc-800/80 bg-zinc-900/95 p-3 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="space-y-3">
        <CopyField
          label="Read-only link"
          value={readOnlyLink}
          note="Anyone with this link can read."
        />
        <CopyField
          label="Invite to collaborate"
          value={inviteLink}
          note="Anyone with this link can join as a collaborator."
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
  const username =
    (window as typeof window & { CURRENT_USER?: { username: string } })
      .CURRENT_USER?.username ?? ''

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {back ? (
            <Link
              to={back.to}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
            >
              ← {back.label}
            </Link>
          ) : (
            <Link
              to="/"
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0"
            >
              cuddly-winner
            </Link>
          )}
          {title && (
            <>
              <span className="text-zinc-800">|</span>
              <span className="text-sm font-mono text-zinc-200 truncate">
                {title}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {actions}
          {share ? (
            <div className="relative">
              <button
                onClick={() => setShareOpen((open) => !open)}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                Share
              </button>
              {shareOpen ? <SharePopover share={share} /> : null}
            </div>
          ) : null}
          {username && (
            <span className="text-xs font-mono text-zinc-600">{username}</span>
          )}
          <a
            href="/accounts/logout/"
            className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            logout
          </a>
        </div>
      </div>
    </header>
  )
}
