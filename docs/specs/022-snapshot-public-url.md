# Spec 022 — Snapshot Stable Public URL

## Objective

Give each snapshot a stable, immutable public URL suitable for linking and
long-term reference.

## User story

As a user, I want to share a link to a specific approved version of a
document that will always show that version, regardless of later drafts.

## Rules

- Each snapshot has a unique public URL: `/snapshots/<public_token>/`.
- The URL renders an immutable view of the snapshot's content.
- Later edits to the document draft do not affect the snapshot page.
- The snapshot page may display:
  - Plain document text.
  - Authorship badges per block (author type, approver identity).
  - Optional document narrative summary (Spec 016).
  - Links to plain and annotated Markdown exports (Specs 011, 012).
- The snapshot page is accessible to public readers if the parent document
  is `visibility=public`; otherwise it follows document visibility (Spec 018).

## Model notes

**Requires adding `public_token` to `Snapshot`:**

```python
public_token = models.UUIDField(default=uuid.uuid4, unique=True)
```

A new URL route and read-only view are required (similar to the existing
`/p/<token>/` view but scoped to a specific snapshot version).

## Acceptance criteria

- Each snapshot has a distinct stable URL.
- The URL renders the snapshot's content as it was when the snapshot was
  created.
- Editing the document draft does not alter the snapshot page.
- Authorship badges are shown per block.
- Export links for plain and annotated Markdown are present.
- Private document snapshots return 403 to non-members.
