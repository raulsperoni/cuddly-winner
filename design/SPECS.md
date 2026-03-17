# Spec-Driven Development — React + TipTap Evolution

## Status

This document extends `docs/specs.md` with new and revised specs covering
the DRF API layer and React SPA frontend. Specs 001–010 from the original
document remain valid; this document adds specs 011–025.

The core invariant across all specs:

> A `Suggestion` with `status = 'accepted'` or `status = 'rejected'` must
> always have exactly one `Decision` record. No spec may define a path that
> creates or resolves a `Suggestion` without a `Decision`.

---

## Existing specs (001–010) — status

All original specs remain valid and their acceptance criteria are unchanged.
The DRF API layer must satisfy all of them in addition to the new specs below.

---

## Spec 011 — DRF API: list documents

User retrieves their document list via the API.

Rules:
- Only documents owned by the authenticated user are returned
- Response includes: `id`, `title`, `description`, `status`, `created_at`,
  `updated_at`, `public_token`, `block_count` (derived)

Acceptance criteria:
- `GET /api/v1/documents/` returns 200 with paginated document list
- Documents from other users are not included
- Unauthenticated request returns 401

---

## Spec 012 — DRF API: document detail with blocks

User retrieves a document including all blocks for the editor.

Rules:
- Each block includes its `current_version` (text, author_type, created_at)
- Each block includes its `pending_suggestions` list
- Version history is NOT included in this response (separate endpoint)

Acceptance criteria:
- `GET /api/v1/documents/{id}/` returns document + blocks + current versions
  + pending suggestions in a single response
- Blocks are ordered by `position`
- Foreign document returns 403

---

## Spec 013 — DRF API: edit block text (human edit)

User saves edited text for a block.

Rules:
- `PATCH /api/v1/documents/{id}/blocks/{block_id}/`
- Body: `{ "text": "..." }`
- Creates a new `BlockVersion` with `author_type = 'human'`, `is_current = True`
- If the text is unchanged, no new version is created
- Writes `AuditEvent` with type `block_edited`

Acceptance criteria:
- New `BlockVersion` exists with correct text and `author_type = 'human'`
- Previous version is no longer `is_current`
- `AuditEvent` recorded
- Unchanged text produces no new version and returns the existing current version
- Unauthenticated request returns 401

---

## Spec 014 — DRF API: request AI suggestion

User triggers an AI suggestion for a block.

Rules:
- `POST /api/v1/documents/{id}/blocks/{block_id}/suggestions/`
- Body: `{ "suggestion_type": "rewrite" | "improve" | "shorten" | "expand" }`
- Server calls LLM service, stores result as `Suggestion` with
  `status = 'pending'`
- The block's current text is NOT modified
- Writes `AuditEvent` with type `suggestion_created`
- If the LLM call fails, returns 502 with an error message; no
  `Suggestion` is created

Acceptance criteria:
- `Suggestion` created with `status = 'pending'`
- `Block.current_version()` text is identical before and after the request
- `AuditEvent` recorded
- LLM failure returns 502, no orphaned `Suggestion` in the database
- Unauthenticated request returns 401

---

## Spec 015 — DRF API: accept suggestion

User explicitly accepts an AI suggestion.

Rules:
- `POST /api/v1/documents/{id}/blocks/{block_id}/suggestions/{suggestion_id}/accept/`
- Body: `{ "notes": "optional reason" }`
- Creates `BlockVersion` with `author_type = 'ai'`, text from suggestion,
  `is_current = True`
- Creates `Decision` with `decision_type = 'accept'`, `decided_by = request.user`
- Sets `Suggestion.status = 'accepted'`
- Writes `AuditEvent` with type `suggestion_accepted`
- Returns the updated block (current version reflects the accepted suggestion)

Acceptance criteria:
- `BlockVersion` exists with `author_type = 'ai'` and `is_current = True`
- `Decision` record exists with correct `decided_by`
- `Suggestion.status` is `'accepted'`
- `AuditEvent` recorded
- Calling this endpoint on an already-accepted or rejected suggestion returns 409
- Unauthenticated request returns 401

---

## Spec 016 — DRF API: accept suggestion with edits

User accepts an AI suggestion but modifies the text before accepting.

Rules:
- `POST .../suggestions/{suggestion_id}/accept-with-edits/`
- Body: `{ "text": "human-modified text", "notes": "optional" }`
- The `text` field is required and must be non-empty Markdown prose
  (validated: reject if value starts with `{` — no JSON/TipTap format)
- Creates `BlockVersion` with `author_type = 'human'` (human modified the
  text), `based_on_version` pointing to the version that was current at
  decision time, `is_current = True`
- Creates `Decision` with `decision_type = 'accept_with_edits'`
- Sets `Suggestion.status = 'accepted'`
- Writes `AuditEvent`
- Returns the updated block

Acceptance criteria:
- `BlockVersion` has `author_type = 'human'` (not `'ai'`)
- `Decision.decision_type` is `'accept_with_edits'`
- `Suggestion.status` is `'accepted'`
- Submitting TipTap JSON as `text` (starts with `{`) returns 400
- Empty `text` returns 400
- `AuditEvent` recorded

---

## Spec 017 — DRF API: reject suggestion

User explicitly rejects an AI suggestion.

Rules:
- `POST .../suggestions/{suggestion_id}/reject/`
- Body: `{ "notes": "optional reason" }`
- Creates `Decision` with `decision_type = 'reject'`, `block_version` pointing
  to the current version (which is unchanged)
- Sets `Suggestion.status = 'rejected'`
- Does NOT create a new `BlockVersion`
- Writes `AuditEvent` with type `suggestion_rejected`

Acceptance criteria:
- No new `BlockVersion` created
- `Decision` record created with `decision_type = 'reject'`
- `Suggestion.status` is `'rejected'`
- `Block.current_version()` text is unchanged
- `AuditEvent` recorded

---

## Spec 018 — DRF API: block version history (lineage)

User retrieves the full version chain for a block.

Rules:
- `GET /api/v1/documents/{id}/blocks/{block_id}/versions/`
- Returns all `BlockVersion` records for the block, ordered oldest first
- Each version includes: `id`, `text`, `author_type`, `author_username`
  (null for AI), `based_on_version_id`, `is_current`, `created_at`
- For AI versions, includes the linked `Decision` (type, decided_by, notes)
- Read-only endpoint

Acceptance criteria:
- Returns full version chain in chronological order
- AI versions have `author_type = 'ai'` and a `decision` object
- Human versions have `author_type = 'human'`
- Unauthenticated request returns 401

---

## Spec 019 — DRF API: document audit timeline

User retrieves the full audit event log for a document.

Rules:
- `GET /api/v1/documents/{id}/history/`
- Returns all `AuditEvent` records ordered chronologically (oldest first)
- Includes: `event_type`, `actor_username`, `block_id`, `data`, `created_at`
- Read-only endpoint

Acceptance criteria:
- Returns events in chronological order
- All event types are represented correctly
- `data` field is included as-is from the database
- Unauthenticated request returns 401

---

## Spec 020 — DRF API: no bulk accept endpoint exists

Enforcement spec. This spec documents a deliberate absence.

Rules:
- No endpoint of the form `POST .../suggestions/bulk-accept/` or
  `POST .../suggestions/accept-all/` exists or will exist
- Any PR adding such an endpoint is a vision violation and must be rejected

Acceptance criteria:
- Searching the codebase for "bulk" + "accept" in URL patterns returns
  no results
- The only accept endpoints are the individual `/accept/` and
  `/accept-with-edits/` paths defined in Spec 015 and Spec 016

---

## Spec 021 — React SPA: suggestion review panel

User sees pending AI suggestions for a block and must explicitly act on each.

Rules:
- When a block has pending suggestions, the block renders in a two-column
  layout: current text (left) and AI suggestion preview (right)
- The suggestion preview is read-only (no inline editing of the suggestion
  text directly)
- Three action buttons are always visible: "Accept", "Edit & Accept", "Reject"
- "Edit & Accept" opens a TipTap editor pre-populated with the suggestion text
- No action is taken unless a button is explicitly clicked
- The suggestion does not auto-accept on focus loss, timeout, or any implicit
  event

Acceptance criteria:
- A pending suggestion that is never interacted with remains `status = 'pending'`
  in the database indefinitely
- Pressing "Accept" calls Spec 015 endpoint
- Pressing "Edit & Accept" opens editor; submitting calls Spec 016 endpoint
- Pressing "Reject" calls Spec 017 endpoint
- No keyboard shortcut auto-accepts without first surfacing the suggestion panel

---

## Spec 022 — React SPA: authorship badge

Every block displays a visual indicator of the authorship of its current version.

Rules:
- Badge is derived from `current_version.author_type` in the API response
- `author_type = 'human'` with no linked suggestion decision: badge "Human"
- `author_type = 'ai'`: badge "AI suggestion accepted"
- `author_type = 'human'` with a linked `accept_with_edits` decision: badge
  "AI suggestion, edited"
- Badges are not suppressed on any view, including focus mode
- Badges are rendered from server data — no client-side inference of authorship

Acceptance criteria:
- A block whose current version is an accepted AI suggestion shows the
  "AI suggestion accepted" badge
- A block whose current version is human-edited shows the "Human" badge
- Removing or hiding the badge component fails a UI snapshot test

---

## Spec 023 — React SPA: no ghost text / no inline AI completion

Enforcement spec for TipTap configuration.

Rules:
- The TipTap editor must not have any AI completion extension installed
  (no ghost text, no Tab-to-accept, no inline suggestion rendering within
  the editor content area)
- AI suggestions are displayed in the dedicated suggestion review panel
  (Spec 021), never inside the editor's editable content
- The TipTap instance configuration is reviewed in code review for any
  extension that could enable auto-completion behavior

Acceptance criteria:
- The TipTap extensions list in the editor component does not include any
  AI completion, ghost text, or co-pilot style extension
- A focused TipTap editor with a pending suggestion for that block shows
  no ghost text inside the editor — the suggestion is visible only in the
  side panel

---

## Spec 024 — DRF API: public read-only access

An unauthenticated reader can view a document via its public token.

Rules:
- `GET /api/v1/public/{token}/`
- Returns: document title, description, all blocks with current text and
  `author_type` of the current version
- Does NOT return: version history, audit events, rejected suggestions,
  user identities, or any pending suggestions
- The authorship badge (human vs. AI) is visible to public readers

Acceptance criteria:
- Unauthenticated request with valid token returns 200
- Invalid token returns 404
- Response does not include audit events or version chains
- `author_type` for each block's current version is included

---

## Spec 025 — migration integrity: no Decision-less AI BlockVersions

Data integrity spec for the transition to the React SPA.

Rules:
- During and after the migration, every `BlockVersion` with
  `author_type = 'ai'` must have exactly one `Decision` record linked via
  `block_version` FK
- A Django data migration check (or management command) verifies this
  invariant against existing data before Phase 2 launch
- Any code path that creates a `BlockVersion` with `author_type = 'ai'`
  without simultaneously creating a `Decision` is a bug

Acceptance criteria:
- Management command `python manage.py check_lineage_integrity` exits 0
  on a clean database
- The command reports any `BlockVersion` with `author_type = 'ai'` that
  lacks a `Decision`
- All existing test data satisfies this invariant before the React SPA
  is deployed
