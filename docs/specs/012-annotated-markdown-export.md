# Spec 012 — Annotated Markdown Export

## Objective

Allow a user to download a Markdown version of a snapshot where qualifying
paragraphs include human-readable change notes as footnotes.

## User story

As a user, I want an annotated version of the document that stays readable
while surfacing meaningful drafting history for each paragraph.

## Rules

- Export is generated from a selected `Snapshot`.
- The main body is clean Markdown; no annotations appear inline.
- Paragraphs that qualify for annotation receive a reference marker at the
  end of their text (e.g. `[^p3]`).
- Annotations are rendered as footnotes in a dedicated section at the end.
- Paragraphs without qualifying history receive no marker.
- Annotation text must be factual and grounded in recorded `BlockVersion`,
  `Decision`, and `Suggestion` data only.
- Trivial edits (punctuation-only, whitespace, formatting) must be
  suppressed on a best-effort basis.
- Filename convention: `{title-slug}-v{version_number:03d}.annotated.md`.

## Qualifying paragraph rule

A block qualifies for annotation if at least one of the following is true:

- An AI `Suggestion` was accepted (`Decision.decision_type` = `accept` or
  `accept_with_edits`).
- More than one committed `BlockVersion` exists after initial creation.
- More than one distinct human `author` contributed committed versions.
- The block went through more than one round of AI/human iteration
  (alternating `author_type` values in the version chain).

## Annotation example

```md
Students should have free public transport in urban areas.[^p1]

[^p1]: Initially drafted by raul. Later revised with an AI-assisted rewrite
accepted during review by raul after revision.
```

## Model notes

No model change required. All data is available from `BlockVersion`,
`Decision`, and `Suggestion` via `block.versions` and `decision.decided_by`.

## Acceptance criteria

- User can trigger an annotated export from the snapshot list.
- Annotations appear only for qualifying paragraphs.
- Notes are in a footnotes section, not inline.
- Notes reference only recorded events and actors.
- File is valid Markdown.
