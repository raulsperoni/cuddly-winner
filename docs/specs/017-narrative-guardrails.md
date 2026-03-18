# Spec 017 — Narrative Generation Guardrails

## Objective

Ensure all generated narrative summaries (Specs 015, 016) are grounded,
factual, and reproducible from stored data.

## User story

As a user, I want summaries I can trust — not AI hallucinations about why
people changed their minds.

## Rules

- Summaries may only describe:
  - Recorded `BlockVersion` changes (text before/after).
  - Recorded `Decision` events (type, actor, timestamp).
  - Recorded `Suggestion` events (type, outcome).
  - Factual comparisons between text versions (length, structural changes).
- Summaries must not:
  - Infer intent, motivation, or political reasoning.
  - Reference actors not present in `BlockVersion.author` or
    `Decision.decided_by`.
  - Present speculative explanations as fact.
- Punctuation-only or whitespace-only diffs may be suppressed; this is
  best-effort and does not need to be exhaustive.
- A summary must be recomputable from the same stored data and produce
  equivalent output.
- The raw lineage (full version list, decisions) must always remain
  accessible as the source of truth.

## Acceptance criteria

- Generated summaries never claim unsupported intent (e.g. "to appease
  critics", "after disagreement").
- Generated summaries never reference actors not in the data.
- Raw lineage is always accessible alongside any narrative.
- Summary can be regenerated from stored history and produce equivalent
  output.
