# Spec 020 — Viewer Role

## Objective

Add a `viewer` membership role for authenticated users who should be able to
read a document but not edit it or act on suggestions.

## User story

As a document owner, I want to invite someone to read the document and its
history without giving them editing rights.

## Context

Currently `DocumentMembership` only supports `role=collaborator`. This spec
adds `viewer` as a distinct read-only membership role. It does not change the
meaning of `collaborator` or `owner`.

## Roles after this change

| Role          | Read | Edit blocks | Resolve suggestions | Manage doc |
|---------------|------|-------------|---------------------|------------|
| owner         | ✓    | ✓           | ✓                   | ✓          |
| collaborator  | ✓    | ✓           | ✓                   | ✗          |
| viewer        | ✓    | ✗           | ✗                   | ✗          |
| public reader | ✓*   | ✗           | ✗                   | ✗          |

*public reader access is subject to `Document.visibility` (Spec 018).

## Rules

- A `viewer` can read document content and version history.
- A `viewer` cannot create or edit blocks, request AI suggestions, or make
  decisions on suggestions.
- Viewer membership is granted by the owner (same invite mechanism as
  collaborator, or a separate viewer invite link — TBD in implementation).
- Backend permission checks must enforce viewer restrictions; UI must not
  render edit controls for viewers.

## Model notes

**Requires adding `viewer` to `DocumentMembership.ROLE_CHOICES`:**

```python
ROLE_VIEWER = 'viewer'
ROLE_CHOICES = [
    ('collaborator', 'Collaborator'),
    ('viewer', 'Viewer'),
]
```

All existing permission guards (`_require_owner`, collaborator checks) need
to be reviewed to ensure `viewer` is excluded from write paths.

## Acceptance criteria

- Owner can invite a viewer.
- Viewer can access the document editor in read-only mode.
- Viewer cannot create blocks, edit blocks, request suggestions, or resolve
  suggestions.
- Backend returns 403 if a viewer attempts a write action.
- Edit controls are hidden in the UI for viewers.
