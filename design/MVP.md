# MVP Design & Technical Architecture — React + TipTap Evolution

## Status

This document supersedes and extends `docs/mvp_design.md`.

It covers the planned architectural evolution from the current Django monolith
(Django templates + HTMX) to a separated frontend SPA (React + TipTap) backed
by a Django REST Framework API.

The product vision in `docs/product.md` is unchanged and non-negotiable.
Every architectural decision in this document is evaluated against it.

---

## Core rule (restated — immovable)

**Nothing enters the canonical document without a recorded human decision.**

AI proposes. Humans approve. This principle governs every API endpoint, every
UI component, and every data flow described here.

---

## Why evolve the architecture

The current HTMX monolith validated the core data model and the
accept/reject/lineage loop. It works. The reason to evolve is adoption, not
correctness:

- Policy teams expect document editors that feel like modern writing tools
- TipTap in a React SPA enables inline diff rendering, side-by-side suggestion
  comparison, block drag-reorder, and rich keyboard UX that HTMX page-swap
  patterns cannot match without significant complexity
- A clean DRF API opens the door to future integrations (CLI tools, browser
  extensions, institutional SSO) without replacing the backend

The evolution must not compromise the vision. It must make the vision more
legible, not obscure it.

---

## What does NOT change

- The Django data model (`Document`, `Block`, `BlockVersion`, `Suggestion`,
  `Decision`, `Snapshot`, `AuditEvent`) is the source of truth and remains
  authoritative
- All AI output is stored as a `Suggestion` with `status=pending`; it never
  enters a `BlockVersion` without a human `Decision`
- The audit trail (`AuditEvent`) continues to be written server-side on every
  state-changing action — the frontend cannot bypass it
- `BlockVersion.author_type` distinguishes AI from human on every version
- The `Decision` model is the enforcement point: no `Suggestion` transitions
  to `accepted` or `accepted_with_edits` without a `Decision` record created
  by an authenticated user
- The public read-only view via `public_token` is preserved

---

## Target architecture

```
┌─────────────────────────────────────────────┐
│  React SPA (Vite, TypeScript)               │
│  TipTap editor per block                    │
│  Suggestion review panel                   │
│  Lineage / audit timeline sidebar          │
└────────────────────┬────────────────────────┘
                     │ HTTPS JSON REST
┌────────────────────▼────────────────────────┐
│  Django + Django REST Framework             │
│  JWT auth (via djangorestframework-simplejwt│
│  or session cookies — see auth section)     │
│  Existing service layer (llm, github_export)│
│  Existing Django models (unchanged)         │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│  PostgreSQL                                 │
└─────────────────────────────────────────────┘
```

The Django template layer is deprecated but not immediately removed. Both
can coexist during transition using URL namespacing.

---

## Frontend package location

```
cuddly-winner/          (repo root)
  frontend/             (new, Vite + React SPA)
    src/
      components/
        editor/         TipTap block editor components
        suggestions/    Suggestion review panel components
        lineage/        Version history and audit timeline
        shared/         Common UI primitives
      api/              Typed API client (generated from DRF schema)
      stores/           Zustand state (document, suggestions, ui)
      pages/            Route-level components
    public/
    vite.config.ts
    package.json
    tsconfig.json
  core/                 Django app (unchanged)
  services/             Django services (unchanged)
  design/               This directory
  docs/                 Vision and product brief (unchanged)
```

The frontend is a separate package. It is built independently and its `dist/`
output is served by Django/WhiteNoise in production (or a CDN). It is NOT a
Django app — it talks to Django only via the REST API.

---

## Django REST Framework API layer

### Authentication

Session cookies (via django-allauth) work for browser-based SPA on the same
origin. For cross-origin or future mobile/CLI use, add
`djangorestframework-simplejwt`.

Recommended approach: ship session auth first (same-origin SPA, zero token
management complexity), add JWT as a second auth class when non-browser
clients are needed.

All editing endpoints require authentication. The public read-only endpoint
(`/p/<token>/`) remains unauthenticated.

### URL namespace

All API endpoints live under `/api/v1/`.

The existing Django template URLs remain under `/` during transition.

### Endpoints

Every endpoint that mutates state must:
1. Require authentication
2. Verify the authenticated user owns or has access to the document
3. Write an `AuditEvent` server-side before returning
4. Return the updated resource so the frontend can reflect state without
   a separate fetch

#### Documents

```
GET    /api/v1/documents/
POST   /api/v1/documents/

GET    /api/v1/documents/{id}/
PATCH  /api/v1/documents/{id}/

GET    /api/v1/documents/{id}/history/
POST   /api/v1/documents/{id}/snapshot/
```

#### Blocks

```
GET    /api/v1/documents/{id}/blocks/
POST   /api/v1/documents/{id}/blocks/

GET    /api/v1/documents/{id}/blocks/{block_id}/
PATCH  /api/v1/documents/{id}/blocks/{block_id}/
DELETE /api/v1/documents/{id}/blocks/{block_id}/

POST   /api/v1/documents/{id}/blocks/{block_id}/split/
POST   /api/v1/documents/{id}/blocks/reorder/
```

#### Block versions (lineage)

```
GET    /api/v1/documents/{id}/blocks/{block_id}/versions/
```

Read-only. The frontend uses this to render the version chain for a block.

#### Suggestions

```
POST   /api/v1/documents/{id}/blocks/{block_id}/suggestions/
       body: { suggestion_type: "rewrite" | "improve" | "shorten" | "expand" }
       → triggers LLM call server-side, creates Suggestion, returns it
       → original block text is UNCHANGED

GET    /api/v1/documents/{id}/blocks/{block_id}/suggestions/
       → returns pending suggestions for a block
```

There is no PUT/PATCH on suggestions. Suggestions are immutable once created.
They can only be resolved via a Decision.

#### Decisions — the enforcement boundary

```
POST   /api/v1/documents/{id}/blocks/{block_id}/suggestions/{suggestion_id}/accept/
       body: { notes?: string }

POST   /api/v1/documents/{id}/blocks/{block_id}/suggestions/{suggestion_id}/accept-with-edits/
       body: { text: string, notes?: string }
       → text is the human-modified version of the AI suggestion

POST   /api/v1/documents/{id}/blocks/{block_id}/suggestions/{suggestion_id}/reject/
       body: { notes?: string }
```

These three endpoints are the only paths by which a `Suggestion` changes
status. Each one:
- Creates a `Decision` record with `decided_by = request.user`
- For `accept` and `accept-with-edits`: creates a new `BlockVersion` with
  `author_type = 'ai'` (accept) or `author_type = 'human'` (accept-with-edits,
  since a human modified the text) and sets `is_current = True`
- Writes an `AuditEvent`
- Returns the updated block (with new current version embedded)

There is deliberately no "accept all suggestions" bulk endpoint. Every
decision is individual and attributed.

#### Snapshots

```
GET    /api/v1/documents/{id}/snapshots/
POST   /api/v1/documents/{id}/snapshots/

POST   /api/v1/documents/{id}/snapshots/{snapshot_id}/export/
       body: { github_repo: string, github_token?: string }
```

#### Public read-only

```
GET    /api/v1/public/{token}/
```

Returns document title, description, and all blocks with current text.
Does not expose version history, author attribution, or audit events to
unauthenticated readers (those views remain authenticated-only).

---

## Serializer design

Serializers enforce what data is exposed and never expose internal fields
that would allow the frontend to infer shortcuts around the Decision flow.

Key rules:
- `SuggestionSerializer` exposes: `id`, `suggestion_type`, `text`, `status`,
  `created_at`. It does NOT expose a field that lets the frontend directly
  set `status`.
- `BlockVersionSerializer` exposes: `id`, `text`, `author_type`,
  `author_username`, `based_on_version_id`, `is_current`, `created_at`.
- `DecisionSerializer` exposes: `id`, `decision_type`, `decided_by_username`,
  `notes`, `created_at`. It is read-only after creation.
- `BlockSerializer` embeds `current_version` and `pending_suggestions` inline
  so the editor can render both without extra fetches.
- `AuditEventSerializer` is read-only. No endpoint accepts creation from the
  frontend — all audit events are created server-side.

---

## Content format decision (critical)

The current backend stores `BlockVersion.text` as plain text. The LLM service
instructs the model to return "plain prose; you may use **bold** and *italic*
but no HTML".

TipTap natively operates on a JSON document model (ProseMirror JSON) or HTML.

**Decision: store as Markdown, render via TipTap.**

Rationale:
- Markdown is human-readable in the database and in Git snapshots
- TipTap has a first-class Markdown serializer/deserializer
- The LLM service already produces Markdown-compatible output (bold, italic,
  simple lists)
- Diff rendering between block versions can operate on plain Markdown text,
  keeping the comparison legible without parsing HTML

**What this means:**
- `BlockVersion.text` continues to be a `TextField` — no schema change needed
- The convention changes from "plain text" to "Markdown prose"
- The LLM prompt system message is updated to reflect this explicitly
- TipTap on the frontend converts between its internal JSON and Markdown
  using `@tiptap/extension-markdown` or a custom serializer
- The backend never stores TipTap JSON — it always stores Markdown text

**What this must not do:**
- The backend must validate that `accept-with-edits` text is plain Markdown
  and not raw HTML or TipTap JSON — this prevents format bleed
- The diff shown to the user during suggestion review operates on the
  stored Markdown, not TipTap internal state

---

## TipTap integration design

### One TipTap instance per block

Each `Block` renders its own TipTap editor instance. This mirrors the
existing block-paragraph model and preserves paragraph-level lineage.

TipTap editors are read-only by default unless the block is in "edit mode".
Edit mode is triggered by clicking the paragraph, matching the current UX.

### Suggestion review panel

When a pending suggestion exists for a block, the block renders in a
two-column state:

```
┌──────────────────────┬──────────────────────────┐
│  Current text        │  AI suggestion           │
│  (read-only)         │  (read-only preview)     │
│                      │                          │
│                      │  [Accept] [Edit] [Reject]│
└──────────────────────┴──────────────────────────┘
```

"Edit" opens a TipTap editor pre-populated with the suggestion text.
The user modifies it and submits — this triggers `accept-with-edits`.

There is no "apply suggestion inline" shortcut. The user must explicitly
choose one of the three actions. This is non-negotiable.

The visual diff between current text and suggestion is rendered using a
word-level diff library (e.g., `diff-match-patch`) applied to the Markdown
text. Additions are highlighted green, removals red. This diff is
informational only — the user still must explicitly accept or reject.

### Authorship badges

Every block displays a badge indicating the authorship of its current version:

- "Human" (blue) — current version authored by a human
- "AI-assisted" (amber) — current version is an accepted AI suggestion
  (author_type = 'ai')
- "AI + edited" (teal) — current version is an accept-with-edits decision
  (author_type = 'human', based on a suggestion)

These badges are derived from `BlockVersion.author_type` and the presence
of a `Decision` linking the version to a `Suggestion`. They are never
decorative — they are data-driven from the API response.

### Lineage panel

A collapsible sidebar panel per block shows the version chain:

```
v3 — You (human) — 2 hours ago   [current]
v2 — AI (accepted by You) — 3 hours ago
v1 — You (human) — yesterday
```

Each version entry shows the text, author type, and for AI versions, the
decision made. This directly surfaces the audit trail to the user.

---

## UX improvements that lower adoption barrier (vision-safe)

These are approved improvements that reduce friction WITHOUT bypassing the
accept/reject requirement:

1. **Inline diff preview** — seeing exactly what the AI changed, word-by-word,
   before deciding. Reduces cognitive load. Does not skip the decision.

2. **Suggestion type shortcuts** — keyboard shortcuts to trigger a suggestion
   type (e.g., `Cmd+Shift+R` for rewrite). The suggestion is still created
   pending; no auto-accept.

3. **Bulk reject** — a "dismiss all suggestions" action that calls `reject` on
   all pending suggestions for a document. This is the ONLY bulk action
   permitted. Reject is a safe bulk operation because it writes a Decision
   record per suggestion (each rejection is recorded) and does not change any
   canonical text.

4. **Focus mode** — a distraction-free layout that hides the lineage panel and
   shows one block at a time. The accept/reject UI remains visible and required.

5. **Suggestion queue** — a panel that lists all pending suggestions across all
   blocks, letting reviewers process them in sequence without scrolling.
   Each item still requires an explicit decision.

6. **Optimistic UI** — accept/reject actions show immediate visual feedback
   before the server confirms. If the server returns an error, the UI reverts.
   The server remains the authority; optimistic updates are cosmetic only.

### What is explicitly prohibited in UX design

- No "accept all" button for accepting suggestions
- No auto-accept after a timeout or inactivity
- No smart defaults that pre-select "accept" over "reject"
- No inline suggestion application on keystroke (e.g., Copilot-style ghost text
  that pressing Tab accepts)
- No "undo" that silently reverts a rejection (undo must create a new decision,
  not delete the existing one)
- No hiding the authorship badge to make the UI "cleaner"
- No suppressing the pending suggestion count to reduce "noise"

---

## Migration path (phased)

### Phase 1 — DRF API alongside existing templates (no user-visible change)

- Add `djangorestframework` to dependencies
- Implement serializers for all models
- Implement all API endpoints listed above
- Add JWT or session-cookie auth for the API
- Write tests for every endpoint, especially the Decision enforcement boundary
- The HTMX frontend continues to work unchanged

### Phase 2 — React SPA for document editing only

- Scaffold `frontend/` with Vite + React + TypeScript
- Implement the document editor page as a React SPA
- Mount it at `/documents/{id}/` — Django serves the React shell, the SPA
  fetches data from the API
- All other pages (home, document list, login, public view) remain Django
  templates for now

### Phase 3 — Full SPA migration

- Home / document list moved to React
- Snapshot and export UI moved to React
- Audit timeline moved to React
- Django templates deprecated but not deleted

### Phase 4 — Optional: extract frontend as standalone

- If the product is deployed as a hosted service, the React SPA can be
  extracted to a separate deployment (e.g., Vercel/Cloudflare Pages)
  pointing at the Django API
- This requires CORS configuration and JWT auth
- Not needed for self-hosted or single-origin deployments

---

## Vision risks in the transition — identified and mitigated

### Risk 1: TipTap's collaborative editing extensions

TipTap has extensions for real-time collaboration (Hocuspocus, Y.js). These
must NOT be used in this product. Real-time collaborative editing would allow
AI output to flow directly into the document without a Decision record.

**Mitigation:** TipTap is used strictly as a single-user rich text editor
per block. No Y.js, no Hocuspocus, no WebSocket-based sync. Collaboration
in this product means reviewing each other's blocks via the Suggestion/Decision
workflow, not simultaneous editing.

### Risk 2: TipTap's AI extensions

TipTap has first-party and community AI extensions that provide ghost text,
inline completion, and auto-apply. These must NOT be integrated.

**Mitigation:** The AI interaction surface is limited to the four suggestion
types triggered via the explicit "Request AI suggestion" action. No AI
extension is installed in the TipTap instance.

### Risk 3: Optimistic UI masking a failed decision

If the frontend shows a block as "accepted" before the server confirms, a
network failure could leave the UI in an inconsistent state where the user
believes they approved something they did not.

**Mitigation:** Optimistic updates are applied only after a successful 2xx
response from the server. The server-side `Decision` record is always the
authority. Frontend state is invalidated and re-fetched on any 4xx/5xx.

### Risk 4: Format ambiguity between TipTap JSON and stored Markdown

If TipTap internal JSON leaks into the `accept-with-edits` payload, the
stored `BlockVersion.text` becomes unparseable as Markdown in the audit
trail and Git export.

**Mitigation:** The DRF serializer for `accept-with-edits` accepts only
a `text` field as a plain string. The frontend's TipTap-to-Markdown
serializer runs before the API call. The backend validates the field
is not JSON (simple check: reject if the value starts with `{`).

### Risk 5: Frontend state allowing a suggestion to be applied without a Decision endpoint call

A bug or deliberate shortcut in the frontend could update local state to
show a suggestion as "accepted" without calling the `/accept/` endpoint,
meaning no `Decision` record or `BlockVersion` is created.

**Mitigation:** The canonical state is always the API. Any frontend
state that shows a block's current text is derived from the last
confirmed server response for that block. On page load or focus
recovery, the SPA re-fetches block state. There is no local-only
"shadow document" that can diverge from the database.

### Risk 6: "Reduce friction" pressure during UX iteration

As the product matures, there will be user requests to speed up the
review workflow. Common asks include "accept all from this session's
AI work" or "auto-accept if the AI confidence is high". These violate
the core rule.

**Mitigation:** This plan explicitly documents the prohibited patterns.
Any future UX proposal must be evaluated against this document. The
product vision in `docs/product.md` is the governing text. Friction
reduction is acceptable only when it does not bypass explicit human
decision-making.

---

## Deployment architecture (updated)

```
browser
  ↓ HTTPS
React SPA (served by WhiteNoise or CDN)
  ↓ JSON REST API
Django + DRF (Railway or equivalent)
  ↓
PostgreSQL
```

LLM requests continue to be handled entirely by the backend service layer.
The frontend never calls OpenRouter directly — it calls the `/suggestions/`
endpoint and waits for the server to return the `Suggestion` object.

This is architecturally important: it means the LLM response is always
persisted as a `Suggestion` before the frontend sees it. There is no
"streaming directly into the editor" pattern.

---

## MVP constraints (updated)

Do not build yet:

- Real-time collaborative editing (Y.js, WebSockets, operational transform)
- Graph visualization of the lineage
- Voting or consensus mechanisms
- Structured amendment rounds with formal approval chains
- Browser extension or CLI client
- Mobile-native app
- LLM streaming into the editor (suggest-as-you-type)

---

## Success criteria for the transition

The transition is complete and the vision is preserved when:

1. Every `BlockVersion` with `author_type = 'ai'` has a corresponding
   `Decision` record in the database — no exceptions
2. The audit timeline shows the full history of every block including
   all rejected suggestions
3. A user reviewing the product cannot reach a state where AI text
   appears in the document without having explicitly clicked Accept
4. The public read-only view correctly attributes authorship on every
   paragraph
5. All existing backend tests pass against the new API layer
