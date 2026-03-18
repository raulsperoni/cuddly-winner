# Specs

## Roles

```
owner
collaborator
public reader
```

- Owner is implicit via `Document.created_by`
- Collaborator is granted through `DocumentMembership`
- Public reader is anyone with `/p/<public_token>/`

## Core rules

### Spec 001 — Accountable edits

- Document text is composed of ordered blocks.
- Editing canonical text always creates a new `BlockVersion`.
- Previous versions remain preserved.
- Canonical text never changes without an attributable human action.

### Spec 002 — AI suggestions are proposals

- AI output is stored as `Suggestion`, never applied directly.
- A suggestion must remain pending until a human explicitly accepts or rejects it.
- Accepted or rejected suggestions must always have a `Decision`.

### Spec 003 — Paragraph-level lineage

- Users can inspect version history per block.
- AI-authored versions must be visibly labeled.
- Human approvals and rejections must remain inspectable after the fact.
- Public readers must be able to see who approved AI-derived wording.

### Spec 004 — Auditability

- Significant document events are recorded as `AuditEvent`s.
- History is chronological and attributable to a user when applicable.

### Spec 005 — Sharing model

- Read-only sharing uses `/p/<public_token>/` and never grants edit access.
- The `owner` role is the canonical term throughout the API and UI.
- Collaboration sharing uses `/join/<invite_token>/`.
- Visiting the join link while authenticated grants collaborator access.
- Visiting the join link while unauthenticated redirects through signup/login first.

### Spec 006 — Permission boundaries

- Owners can edit, manage document metadata, create snapshots, export to GitHub,
  and manage collaborators.
- Collaborators can edit blocks and resolve AI suggestions.
- Public readers can only read.

### Spec 007 — Export snapshots

- Snapshots are owner-only.
- Snapshot export produces a stable document artifact suitable for GitHub.

### Spec 008 — Authenticated app surface

- Authenticated document workflows are served through the React SPA.
- Public shared documents are also served through the React SPA.
- Django-rendered pages are limited to auth and redirect/entry concerns.

### Spec 009 — Human-instructed AI suggestions

- Collaborators may submit a free-text instruction alongside an AI suggestion request.
- When `suggestion_type = custom`, an `instruction` field is required.
- The instruction is passed to the LLM as the editorial prompt.
- The instruction is stored on `Suggestion.instruction` for auditability.
- The instruction is recorded in `AuditEvent.data` when the suggestion is created.
- The resulting suggestion goes through the standard Decision flow (Spec 002) unchanged.

## Extended specifications

Spec 010 is reserved. Specs 011–023 are in `docs/specs/`:

| Spec | Title |
|------|-------|
| [011](specs/011-plain-markdown-export.md) | Plain Markdown Export |
| [012](specs/012-annotated-markdown-export.md) | Annotated Markdown Export |
| [013](specs/013-export-metadata-bundle.md) | Export Metadata Bundle |
| [014](specs/014-git-export.md) | Git Export of Snapshot |
| [015](specs/015-narrative-summary-block.md) | Narrative Summary: Block View |
| [016](specs/016-narrative-summary-document.md) | Narrative Summary: Document View |
| [017](specs/017-narrative-guardrails.md) | Narrative Generation Guardrails |
| [018](specs/018-document-visibility.md) | Document Visibility |
| [019](specs/019-private-documents.md) | Private Documents (Operator-Managed) |
| [020](specs/020-viewer-role.md) | Viewer Role |
| [021](specs/021-enhanced-public-view.md) | Enhanced Public Read-Only View |
| [022](specs/022-snapshot-public-url.md) | Snapshot Stable Public URL |
| [023](specs/023-onboarding-document.md) | Onboarding Document |

## Current implementation constraints

- Document lists must include both owned and collaborator documents.
- Owners alone can manage collaborators, snapshots, and GitHub export.
- Public API responses must stay read-only and omit private collaboration data.
- There is deliberately no bulk accept workflow for suggestions.
