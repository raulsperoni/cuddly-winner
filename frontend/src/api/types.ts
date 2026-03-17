export interface BlockVersion {
  id: number
  text: string
  author_type: 'human' | 'ai'
  author_username: string | null
  based_on_version_id: number | null
  is_current: boolean
  created_at: string
  decision: {
    id: number
    decision_type: 'accept' | 'reject' | 'accept_with_edits'
    decided_by_username: string
    notes: string
    created_at: string
  } | null
}

export interface Suggestion {
  id: number
  suggestion_type: 'rewrite' | 'improve' | 'shorten' | 'expand'
  text: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface Block {
  id: number
  position: number
  current_version: BlockVersion | null
  pending_suggestions: Suggestion[]
  created_at: string
}

export interface Document {
  id: number
  title: string
  description: string
  status: string
  created_at: string
  updated_at: string
  public_token: string
  invite_token: string
  block_count: number
  access_role: 'owner' | 'collaborator'
  owner_username: string
  blocks?: Block[]
}

export interface Member {
  user_id: number
  username: string
  role: 'collaborator'
  joined_at: string
}

export interface Snapshot {
  id: number
  version_number: number
  text: string
  metadata: Record<string, unknown>
  github_commit_sha: string
  github_repo: string
  created_at: string
}

export interface CurrentUser {
  id: number
  username: string
  email: string
}

export interface PublicBlock {
  id: number
  position: number
  current_version: {
    text: string
    author_type: 'human' | 'ai'
  } | null
}

export interface PublicDocument {
  id: number
  title: string
  description: string
  blocks: PublicBlock[]
}

export interface AuditEvent {
  id: number
  event_type: string
  actor_username: string | null
  block_id: number | null
  data: Record<string, unknown>
  created_at: string
}
