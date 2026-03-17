# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
poetry install

# Run dev server
poetry run python manage.py runserver

# Run migrations
poetry run python manage.py migrate

# Run tests
poetry run pytest

# Run tests with coverage
poetry run pytest --cov=core --cov-report=term-missing

# Run a single test file
poetry run pytest core/tests/test_views.py

# Run a single test
poetry run pytest core/tests/test_views.py::TestClassName::test_method_name

# Docker (includes postgres)
docker compose up

# Frontend — install dependencies
cd frontend && npm install

# Frontend — dev server (proxies /api/ to Django at :8000)
cd frontend && npm run dev

# Frontend — production build (outputs to staticfiles/frontend/assets/)
cd frontend && npm run build
```

## Architecture

**Pull Requests for Prose** — a Django app for collaborative AI-assisted policy document drafting, where AI suggestions must be explicitly accepted or rejected (nothing auto-applies).

### Data model (`core/models.py`)

The core entity hierarchy:
- `Document` — top-level document with draft/published status, a `public_token` UUID for read-only sharing, and an `invite_token` UUID for collaborator joins
- `DocumentMembership` — links a user to a document as a collaborator; owners remain implicit via `Document.created_by`
- `Block` — ordered paragraph within a document; has a `position` field
- `BlockVersion` — immutable version of a block's text; tracks `author_type` (human/AI), `based_on_version` (parent lineage), and `is_current` flag. Only one version per block can be `is_current=True` (enforced in `save()`)
- `Suggestion` — AI-generated alternative text for a block (types: rewrite, improve, shorten, expand); must be accepted/rejected via a `Decision`
- `Decision` — human approval record linking a `Suggestion` to a resulting `BlockVersion`; types: accept, reject, accept_with_edits
- `Snapshot` — point-in-time export of a document (versioned); can be pushed to GitHub (`github_commit_sha`, `github_repo`)
- `AuditEvent` — append-only log of all significant actions on a document

### API (`core/api/`)

DRF REST API mounted at `/api/v1/`. All endpoints use `SessionAuthentication`. Key modules:
- `serializers.py` — serializers for all models
- `views.py` — all REST endpoints
- `urls.py` — routes included via `cuddly_winner/urls.py`

`rest_framework` is in `INSTALLED_APPS` with `REST_FRAMEWORK` config block in settings.

### Services (`services/`)

- `services/llm.py` — calls OpenRouter API (using the `openai` client pointed at `https://openrouter.ai/api/v1`) to generate block suggestions. Model is configured via `OPENROUTER_MODEL` env var (default: `anthropic/claude-sonnet-4-5`)
- `services/github_export.py` — exports document snapshots as committed markdown files to a GitHub repo using `GITHUB_TOKEN`

### Frontend

Two layers coexist:

**Legacy HTMX views** — Tailwind CSS via CDN, HTMX for dynamic interactions, Alpine.js for lightweight JS. No build step. Used only for the public read-only view (`/p/<token>/`).

**React SPA** (`frontend/`) — Vite + React + TypeScript + react-router-dom. All authenticated routes are served by the `spa_shell` Django view (login_required) via `core/templates/core/document_editor_shell.html`. The shell injects `CURRENT_USER = {username}` as a global; document IDs are resolved client-side via `useParams()`. The SPA calls the DRF API under `/api/v1/`. Production assets build to `staticfiles/frontend/assets/`.

React Router routes (client-side):
- `/` → `DocumentList` — lists owned documents plus documents shared with the current user
- `/documents/new` → `DocumentCreate` — create form (title, description, initial_content)
- `/documents/:id/edit` → `DocumentEditor` — block editor with SnapshotPanel and NavBar
- `/documents/:id/history` → `DocumentHistory` — audit event timeline

Frontend source layout:
- `src/App.tsx` — `createBrowserRouter` setup with the four routes above
- `src/api/` — typed API client (`client.ts`) and model types (`types.ts`; includes `Snapshot`, `CurrentUser`)
- `src/stores/` — Zustand stores (`document.ts`, `ui.ts`)
- `src/components/editor/` — `BlockEditor` (TipTap), `BlockItem`, `BlockList`
- `src/components/suggestions/` — `SuggestionPanel` (two-column), `DiffView`
- `src/components/lineage/` — `LineagePanel` (collapsible)
- `src/components/snapshots/` — `SnapshotPanel` (list, create, export to GitHub)
- `src/components/shared/` — `AuthorshipBadge`, `NavBar`
- `src/pages/` — `DocumentList`, `DocumentCreate`, `DocumentEditor`, `DocumentHistory`

### Auth

django-allauth with both username and email login. Read-only public access uses `public_token`; collaborator access is granted by visiting `/join/<invite_token>/` while authenticated (or after redirecting through signup/login).

### Environment variables

See `.env.example`. Key ones: `SECRET_KEY`, `OPENROUTER_API_KEY`, `GITHUB_TOKEN` (optional), `DATABASE_URL` (defaults to SQLite).
