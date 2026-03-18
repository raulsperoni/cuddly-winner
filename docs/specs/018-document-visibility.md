# Spec 018 — Document Visibility

## Objective

Add explicit visibility control to documents so that public vs. private
access is a declared property, not an implicit assumption.

## User story

As a user, I want to know clearly whether my document is public before I
start sharing it.

## Context

Currently, every document is implicitly public to anyone who discovers its
`public_token`. This spec formalizes visibility as an explicit field and
makes public the declared default.

## Rules

- `Document.visibility` defaults to `public` for all new documents.
- `public` means: readable by anyone with the link (existing `/p/<token>/`
  behaviour).
- `private` means: readable only by authenticated members (owner +
  collaborators with a membership).
- The document creation UI must clearly disclose what `public` means before
  the document is saved.
- Visibility is set at creation time and can be changed only by the owner.
- Public visibility does not grant edit access (Spec 005 remains unchanged).

## Model notes

**Requires adding `visibility` to `Document`:**

```python
VISIBILITY_PUBLIC = 'public'
VISIBILITY_PRIVATE = 'private'
visibility = models.CharField(
    max_length=10,
    choices=[('public', 'Public'), ('private', 'Private')],
    default='public',
)
```

Existing documents without this field should be treated as `public` during
migration.

## Acceptance criteria

- New documents default to `visibility=public`.
- Creation UI includes a visible disclosure of what public means.
- Private documents return 403 for non-members accessing `/p/<token>/`.
- Owner can change visibility; collaborators cannot.
- `visibility` is exposed in the document API response.
