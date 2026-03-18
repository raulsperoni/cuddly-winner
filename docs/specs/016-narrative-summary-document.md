# Spec 016 — Narrative Summary: Document View

## Objective

Allow a user to read a document-level summary of the most meaningful drafting
changes in a snapshot without inspecting every paragraph history individually.

## User story

As a reader, I want a concise overview of how this document changed, focused
on what matters rather than every edit.

## Rules

- The document narrative is generated from block-level histories within a
  selected `Snapshot` (depends on Spec 015).
- Trivial edits must be omitted.
- The summary must emphasize:
  - Paragraphs that received an accepted AI suggestion.
  - Paragraphs substantially rewritten across multiple versions.
  - Paragraphs with more than one distinct human contributor.
  - Paragraphs added or removed between prior and current snapshot (where
    applicable).
- Each summary item should link to the relevant block or paragraph anchor.
- The raw audit timeline must remain accessible from the same page.

## Example output

> - The eligibility paragraph was rewritten after review to narrow scope to
>   compulsory education, with an AI-assisted version accepted by raul.
> - The funding paragraph had contributions from two authors and went through
>   three committed versions.

## Model notes

No model change required. Derived from `BlockVersion`, `Decision`, and
`AuditEvent` data within the snapshot context.

## Acceptance criteria

- Snapshot view includes a "Change narrative" section.
- Summary highlights only meaningful changes (no trivial edits).
- Each item can navigate to the affected paragraph.
- Raw audit timeline is still accessible.
- Generated from stored data; not cached in MVP.
