# Spec 019 — Private Documents (Operator-Managed)

## Objective

Support private documents for users with sensitive drafting needs, without
building a self-serve privacy or billing flow in MVP.

## User story

As a user with sensitive drafting requirements, I want a private document
option I can request from the operator.

## Rules

- Private documents (`visibility=private`, see Spec 018) are created or
  converted by an operator or admin — not by users via the product UI in
  MVP.
- There is no self-serve "make private" toggle for users in MVP.
- The product UI may display a note explaining how to request private access.
- A private document is accessible only to authenticated members (owner and
  collaborators with a `DocumentMembership`).
- The `/p/<token>/` public endpoint must return 403 for private documents to
  unauthenticated or non-member visitors.

## Model notes

Depends on `Document.visibility` field from Spec 018. No additional model
change required beyond that.

The Django admin interface is sufficient for operator-managed conversion in
MVP.

## Acceptance criteria

- Admin can set `visibility=private` on any document via the Django admin.
- Private documents return 403 at `/p/<token>/` for non-members.
- Private documents are not listed publicly.
- Product UI copy explains that private access is available on request.
- Existing public documents are unaffected.
