# Spec 021 — Enhanced Public Read-Only View

## Objective

Extend the existing public document view (`/p/<token>/`) to optionally
surface paragraph-level narrative summaries alongside the document content.

## User story

As a public reader, I want to read the document and, if I'm curious about a
paragraph, see a concise plain-English note about how it was drafted.

## Context

The current `/p/<token>/` view already renders block text with authorship
badges (human/AI, approver identity). This spec adds an optional narrative
layer (depends on Spec 015) while keeping the page feeling like a published
artifact, not an editing tool.

## Rules

- The view renders only document content and authorship information.
- No editing controls, suggestion panels, or AI action buttons are rendered.
- Each block may optionally expose a "How this was drafted" toggle that
  shows the block's narrative summary (Spec 015).
- If no meaningful history exists for a block, the toggle is not shown.
- Visibility rules from Spec 018 apply: private documents return 403.

## Model notes

No model change required. Narrative generation uses existing data (Spec 015).

## Acceptance criteria

- Public visitor sees read-only document content.
- No edit controls appear.
- Blocks with qualifying history show a toggle for the narrative summary.
- Clicking the toggle shows the narrative (generated per Spec 015 rules).
- Private documents return 403 for non-member visitors.
