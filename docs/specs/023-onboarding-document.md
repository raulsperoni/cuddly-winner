# Spec 023 — Onboarding Document

## Objective

Provide a single operator-managed document that explains the product by
letting new visitors experience the real drafting workflow with minimal
friction.

## User story

As a new visitor, I want to land on a concrete document immediately so I can
understand what this product is, how suggestions work, and how review differs
from direct editing.

## Context

The existing model already supports:

- authenticated owners and collaborators editing documents
- public read-only access via `/p/<public_token>/`
- AI suggestions as proposals that require explicit acceptance or rejection

This spec adds a narrow onboarding surface without changing those core rules.
It does not define a general-purpose review role for logged-in users. That can
be added later as a separate permission model.

## Rules

- A document may be flagged as the single onboarding document.
- At most one onboarding document may exist at a time.
- The onboarding document is pinned in a dedicated section at the top of `/`
  for everyone, including logged-out visitors and logged-in users.
- The onboarding document remains visible even when the user already has their
  own documents.
- The onboarding document may be pinned regardless of whether it is `draft` or
  `published`.
- The pinned entry must be visually labeled as a guided starting point, not as
  a normal user-owned document.
- The onboarding document is accessible through the normal app route
  `/documents/<id>/edit/`.
- Direct access to that route is allowed for anonymous visitors and logged-in
  non-members when the document is the onboarding document.
- Anonymous visitors and logged-in non-members may read the document, inspect a
  trimmed public-safe history, and request AI suggestions.
- Anonymous visitors and logged-in non-members must not directly edit blocks,
  create blocks, split blocks, reorder blocks, delete blocks, or resolve
  suggestions.
- Existing pending suggestions must not be shown to anonymous visitors or
  logged-in non-members.
- Public suggestions for the onboarding document enter the normal `Suggestion`
  queue.
- Public suggestions must be marked in metadata as anonymous/public-originated.
- Public suggestion access applies only to the onboarding document.
- Existing public read-only sharing via `/p/<public_token>/` remains unchanged
  for other documents.
- Enabling or changing the onboarding document is operator-managed and
  superuser/admin-only in MVP.
- There is no self-serve product UI for toggling the onboarding document.

## Model notes

Requires adding a document-level operator flag, for example:

```python
is_onboarding = models.BooleanField(
    default=False,
    help_text=(
        'Superuser-only. Pins this document as the public onboarding '
        'entry point and allows anonymous suggestion requests.'
    ),
)
```

The implementation must enforce that only one `Document` can have
`is_onboarding=True` at a time.

This flag is distinct from:

- `visibility` (Spec 018), which governs public read access
- `viewer` (Spec 020), which governs authenticated read-only membership

## Acceptance criteria

- Admin can flag exactly one document as the onboarding document.
- If configured, the onboarding document appears in a dedicated pinned section
  at the top of `/` for logged-out and logged-in users.
- The pinned onboarding document remains visible even when the user has other
  documents.
- The pinned onboarding document is labeled as a guided starting point.
- Anonymous visitors can open the onboarding document through
  `/documents/<id>/edit/`.
- Logged-in non-members can also open the onboarding document through
  `/documents/<id>/edit/`.
- Anonymous visitors and logged-in non-members can request AI suggestions on
  the onboarding document.
- Anonymous visitors and logged-in non-members cannot directly mutate document
  content or resolve suggestions.
- Anonymous visitors and logged-in non-members do not see pending suggestions.
- Anonymous visitors and logged-in non-members can see a trimmed public-safe
  history for the onboarding document.
- Public suggestion requests are recorded in the normal queue with
  anonymous/public provenance metadata.
- `/p/<public_token>/` behavior for non-onboarding documents is unaffected.
