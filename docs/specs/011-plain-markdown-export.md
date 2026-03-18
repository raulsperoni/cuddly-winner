# Spec 011 — Plain Markdown Export

## Objective

Allow a user to download a snapshot as clean, portable Markdown.

## User story

As a user, I want a plain Markdown version of a document snapshot for
publishing, sharing, or committing externally.

## Rules

- Export is generated from a selected `Snapshot`.
- Output is `Snapshot.text` as-is — no AI metadata, lineage markers, or
  authorship annotations inline.
- Block order matches the snapshot's recorded block order.
- Filename convention: `{title-slug}-v{version_number:03d}.md` where the
  slug is derived from the document title (lowercase, spaces → hyphens,
  truncated at 50 characters).
- Export is deterministic: the same snapshot always produces the same file.

## Model notes

No model change required. `Snapshot.text` already stores the rendered
Markdown content at snapshot creation time.

## Acceptance criteria

- User can trigger a plain export from the snapshot list.
- Downloaded file contains only readable document content.
- Filename follows the naming convention above.
- Repeated export of the same snapshot produces identical content.
