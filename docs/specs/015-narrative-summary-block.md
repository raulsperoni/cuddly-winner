# Spec 015 — Narrative Summary: Block View

## Objective

Allow a user to read a concise, natural-language explanation of how a
specific paragraph evolved, derived on-demand from recorded history.

## User story

As a reader or editor, I want a plain-English summary of how a paragraph
changed without having to read raw version history.

## Rules

- The summary is generated on-demand from `BlockVersion`, `Decision`, and
  `Suggestion` records for the block. It is not stored separately.
- The summary must only describe recorded actions and observable text
  changes — no inferred intent, no invented actors.
- Trivial edits (punctuation-only, whitespace) must be suppressed on a
  best-effort basis.
- If the block history is trivial (single version, no AI involvement, single
  author), the UI may show "No meaningful changes" instead of a summary.
- The full version history must remain accessible from the same UI (not
  hidden behind the narrative).

## Inputs used for generation

- `BlockVersion` records on the block (ordered by `created_at`)
- `BlockVersion.author_type` and `author_username`
- `Decision` records linked to versions (`decision_type`, `decided_by`)
- `Suggestion` records linked to the block (`suggestion_type`, `status`)

## Example output

> Initially drafted by raul. Later revised with an AI-assisted rewrite
> (improve) accepted by raul. The final version reflects a human edit on
> acceptance.

## Model notes

No model change required. Generated from existing model data.

## Acceptance criteria

- User can view a narrative summary per block from the lineage panel.
- Summary references only recorded events and actors.
- "No meaningful changes" is shown when history is trivial.
- Full version history remains accessible from the same panel.
- Summary is regenerated from stored data (not cached in MVP).
