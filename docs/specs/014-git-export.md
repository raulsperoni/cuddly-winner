# Spec 014 — Git Export of Snapshot

## Objective

Formalize the GitHub export contract so that each snapshot export produces
one meaningful, self-contained commit with consistent file paths and a
machine-parseable commit message.

## Context

`services/github_export.py` already exports `Snapshot.text` to
`docs/{title-slug}.md` and a metadata JSON to `.meta/snapshot-{n:03d}.json`,
storing the resulting SHA in `Snapshot.github_commit_sha`. This spec
formalizes the file layout, commit message format, and extends the export to
optionally include the annotated Markdown.

## User story

As a user, I want approved document states exported to a GitHub repo as
durable, inspectable artifacts with meaningful commit messages.

## Rules

- Git export is performed from a selected `Snapshot`, never from live draft
  state.
- One commit is created per export operation; re-exporting a different
  snapshot creates a separate commit.
- A second export of the same snapshot (same `Snapshot.id`) updates the
  existing file in place with a new commit; it does not create a duplicate
  history entry.
- Export includes at minimum:
  - `docs/{title-slug}.md` — plain Markdown (Spec 011)
  - `.meta/snapshot-{version_number:03d}.json` — snapshot metadata
- Optionally includes:
  - `docs/{title-slug}.annotated.md` — annotated Markdown (Spec 012)
- Commit message follows the template below.
- `Snapshot.github_commit_sha` and `Snapshot.github_repo` are updated after
  a successful export.

## Commit message template

```
Export snapshot v{version_number} for {document_title}

Snapshot ID: {snapshot_id}
Exported by: {username}
```

## Model notes

No model change required. `Snapshot.github_commit_sha` and
`Snapshot.github_repo` already exist.

## Acceptance criteria

- Export creates one commit for the selected snapshot.
- Re-exporting a different snapshot creates a new commit.
- Exported files appear at the paths specified above.
- Commit message matches the template.
- `Snapshot.github_commit_sha` reflects the resulting commit.
- No commit is created for unsnapshot draft state.
