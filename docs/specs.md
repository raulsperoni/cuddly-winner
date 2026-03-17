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

### Spec 004 — Auditability

- Significant document events are recorded as `AuditEvent`s.
- History is chronological and attributable to a user when applicable.

### Spec 005 — Sharing model

- Read-only sharing uses `/p/<public_token>/` and never grants edit access.
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

## Current implementation constraints

- Document lists must include both owned and collaborator documents.
- Owners alone can manage collaborators, snapshots, and GitHub export.
- Public API responses must stay read-only and omit private collaboration data.
- There is deliberately no bulk accept workflow for suggestions.
