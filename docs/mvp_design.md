# Current Architecture

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

The product now has a clear split:

- Django handles auth, API endpoints, and server-side integration concerns.
- React handles the authenticated drafting interface and collaboration workflow.
  It also renders the public read-only document route.

This keeps the public link simple while giving the editor a richer client-side
state model.

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

Authenticated SPA entry points:

- `/`
- `/documents/new/`
- `/documents/<id>/edit/`
- `/documents/<id>/history/`

Server-rendered entry routes:

- `/p/<public_token>/`
- `/join/<invite_token>/`
- `/accounts/...`

## Permission model

- Owner access comes from `Document.created_by`.
- Collaborator access comes from `DocumentMembership`.
- Public access is read-only and token-based.

## Current constraints

- Auth pages still use default allauth templates and styling.
- Session-cookie auth assumes same-site deployment for SPA and backend.
- Auth pages still use default allauth templates and styling, so the visual
  language still breaks between product surfaces.
