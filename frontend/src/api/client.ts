import type {
  Block,
  BlockVersion,
  CurrentUser,
  Document,
  Member,
  PublicDocument,
  Snapshot,
  Suggestion,
} from './types'

function getCsrf(): string {
  return (window as typeof window & { CSRF_TOKEN?: string }).CSRF_TOKEN ?? ''
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    headers['X-CSRFToken'] = getCsrf()
  }
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials ?? 'same-origin',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`${res.status}: ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  getDocument: (id: number): Promise<Document> =>
    request(`/api/v1/documents/${id}/`),

  patchBlock: (docId: number, blockId: number, text: string): Promise<Block> =>
    request(`/api/v1/documents/${docId}/blocks/${blockId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ text }),
    }),

  createSuggestion: (
    docId: number,
    blockId: number,
    suggestionType: string,
    instruction = '',
  ): Promise<Suggestion> =>
    request(`/api/v1/documents/${docId}/blocks/${blockId}/suggestions/`, {
      method: 'POST',
      body: JSON.stringify({ suggestion_type: suggestionType, instruction }),
    }),

  acceptSuggestion: (
    docId: number,
    blockId: number,
    suggestionId: number,
    notes = '',
  ): Promise<Block> =>
    request(
      `/api/v1/documents/${docId}/blocks/${blockId}/suggestions/${suggestionId}/accept/`,
      { method: 'POST', body: JSON.stringify({ notes }) },
    ),

  acceptWithEdits: (
    docId: number,
    blockId: number,
    suggestionId: number,
    text: string,
    notes = '',
  ): Promise<Block> =>
    request(
      `/api/v1/documents/${docId}/blocks/${blockId}/suggestions/${suggestionId}/accept-with-edits/`,
      { method: 'POST', body: JSON.stringify({ text, notes }) },
    ),

  rejectSuggestion: (
    docId: number,
    blockId: number,
    suggestionId: number,
    notes = '',
  ): Promise<Block> =>
    request(
      `/api/v1/documents/${docId}/blocks/${blockId}/suggestions/${suggestionId}/reject/`,
      { method: 'POST', body: JSON.stringify({ notes }) },
    ),

  getVersions: (docId: number, blockId: number): Promise<BlockVersion[]> =>
    request(`/api/v1/documents/${docId}/blocks/${blockId}/versions/`),

  listDocuments: (): Promise<Document[]> => request('/api/v1/documents/'),

  createDocument: (data: {
    title: string
    description?: string
    initial_content?: string
  }): Promise<Document> =>
    request('/api/v1/documents/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  patchDocument: (
    id: number,
    data: Partial<Pick<Document, 'title' | 'description' | 'status'>>,
  ): Promise<Document> =>
    request(`/api/v1/documents/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getHistory: (docId: number) =>
    request<
      Array<{
        id: number
        event_type: string
        actor_username: string | null
        block_id: number | null
        data: Record<string, unknown>
        created_at: string
      }>
    >(`/api/v1/documents/${docId}/history/`),

  listMembers: (docId: number): Promise<Member[]> =>
    request(`/api/v1/documents/${docId}/members/`),

  removeMember: (docId: number, userId: number): Promise<void> =>
    request(`/api/v1/documents/${docId}/members/${userId}/`, {
      method: 'DELETE',
    }),

  listSnapshots: (docId: number): Promise<Snapshot[]> =>
    request(`/api/v1/documents/${docId}/snapshots/`),

  createSnapshot: (docId: number): Promise<Snapshot> =>
    request(`/api/v1/documents/${docId}/snapshots/`, { method: 'POST', body: '{}' }),

  exportSnapshot: (
    docId: number,
    snapshotId: number,
    githubRepo: string,
    githubToken?: string,
  ): Promise<Snapshot> =>
    request(`/api/v1/documents/${docId}/snapshots/${snapshotId}/export/`, {
      method: 'POST',
      body: JSON.stringify({ github_repo: githubRepo, github_token: githubToken }),
    }),

  getMe: (): Promise<CurrentUser> => request('/api/v1/auth/me/'),

  getPublicDocument: (token: string): Promise<PublicDocument> =>
    request(`/api/v1/public/${token}/`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
    }),
}
