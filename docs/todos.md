# TODOs

## Product and UX

- [x] Design and implement a full light mode, not just inverted colors.
- [x] Decided: `owner` is the canonical term throughout API and UI.
- [x] Improve activity presentation so users see readable decisions first and raw
  event payloads second.
- [x] Add clearer visible attribution for who approved AI-derived wording.
- [x] Revisit share/invite copy with policy and institutional users.

## Frontend

- Split the editor further with lazy loading or route decomposition if bundle
  size remains too large.
- Add a dedicated not-found page instead of using the generic route error UI
  for wildcard routes.
- Add success and error toasts for user actions instead of relying on inline
  banners only.
- Audit all public and authenticated flows for mobile layout quality.

## Auth

- [x] Style password reset, password change, email verification, and related allauth
  templates to match the product.
- [x] Review signup/login wording against the target institutional audience.

## Collaboration and permissions

- Add end-to-end coverage for owner, collaborator, and public-reader flows.
- Add collaborator removal UX feedback in the share panel.
- Decide whether collaborators should access the activity view and in what form.

## Production hardening

- Add error monitoring and frontend logging.
- Add route-level and API-level observability for collaboration flows.
- Validate deployment assumptions for same-origin session auth.
- Reduce main bundle size further before production launch.
