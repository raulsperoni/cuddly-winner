# Design

## Product surface

- Authenticated users work inside a React SPA.
- Public readers use a React read-only page at `/p/<public_token>/`.
- Authentication flows are provided by django-allauth.

## Stack

Backend

- Django
- Django REST Framework
- PostgreSQL in production, SQLite for local fallback

Frontend

- React
- Vite
- TypeScript
- TipTap
- Zustand

Deployment

- Railway
- WhiteNoise for static file serving

## Why this architecture

The product has a clear split:

- Django handles auth, API endpoints, and server-side integration concerns.
- React handles the drafting interface, collaboration workflow, and the public
  read-only document route.

This keeps the backend authoritative while giving the editor a modern client
runtime.

## Core entities

- `Document`
- `DocumentMembership`
- `Block`
- `BlockVersion`
- `Suggestion`
- `Decision`
- `Snapshot`
- `AuditEvent`

## Routing model

SPA entry routes:

- `/`
- `/documents/new/`
- `/documents/<id>/edit/`
- `/documents/<id>/history/`
- `/p/<public_token>/`

Server-handled routes:

- `/join/<invite_token>/`
- `/accounts/...`
- `/api/v1/...`

## Permission model

- Owner access comes from `Document.created_by`.
- Collaborator access comes from `DocumentMembership`.
- Public access is read-only and token-based.

## Main constraints

- Auth pages still use default allauth templates and styling.
- Session-cookie auth currently assumes same-site deployment for SPA and backend.
- The frontend bundle is still large and should be split before production hardening.
