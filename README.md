# cuddly-winner

> Pull Requests for Prose — accountable AI for political and policy drafting.

AI suggestions behave like pull requests: proposed changes that a human must explicitly accept before entering the canonical document. Every paragraph has a traceable approval history.

## What it does

- Write policy documents collaboratively (full React SPA for authenticated users; paste existing content on creation to auto-split into blocks)
- Request AI rewrites, improvements, shortenings, or expansions of any paragraph
- Accept, edit, or reject AI suggestions — nothing enters the document without a human decision
- Inspect the full lineage of any paragraph (who wrote what, which AI suggestions were accepted)
- Export snapshots to GitHub as committed markdown files
- Share a read-only public link to any document
- Share a separate invite link that upgrades logged-in recipients to collaborators
- REST API for all operations (`/api/v1/`)

## Stack

| Layer | Tech |
|---|---|
| Backend | Django 5 + Django REST Framework + PostgreSQL |
| Auth | django-allauth (username + email) |
| Public reader | React SPA route backed by the public API |
| React SPA | Vite + React + TypeScript + react-router-dom + TipTap + Zustand |
| LLM | [OpenRouter](https://openrouter.ai) (`anthropic/claude-sonnet-4-5` by default) |
| Deploy | Railway (migrations run automatically on deploy) |

## Local setup

```bash
cp .env.example .env   # fill in OPENROUTER_API_KEY at minimum
make install
make migrate
make dev
```

Or with Docker (includes Postgres):

```bash
cp .env.example .env
docker compose up
```

### Full dev setup (backend + React SPA)

```bash
# Terminal 1 — Django
make dev

# Terminal 2 — React (proxies /api/ to :8000)
make frontend-dev
```

All authenticated routes (`/`, `/documents/new`, `/documents/<id>/edit`, `/documents/<id>/history`) are served by the React SPA. The Vite dev server proxies API calls to Django at `:8000`.

## Sharing and collaboration

- Owners create documents and retain full control over metadata, snapshots, GitHub export, and collaborator management.
- Public readers can open `/p/<public_token>/` without authentication for read-only access.
- Collaborators join through `/join/<invite_token>/`. If they are not logged in, they are redirected to `/accounts/signup/?next=/join/<invite_token>/`.
- After joining, collaborators can edit blocks and resolve AI suggestions, but owner-only actions remain restricted.

## Make targets

```
make install          Install Python dependencies
make frontend-install Install frontend npm dependencies
make dev              Run Django dev server
make frontend-dev     Run Vite dev server (proxies API to Django)
make frontend-build   Build React SPA to staticfiles/frontend/
make migrate          Run Django migrations
make test             Run all tests
make test-cov         Run tests with coverage report
make lint             TypeScript type-check
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | Yes | Django secret key |
| `DEBUG` | No | `True` for local dev |
| `DATABASE_URL` | No | Postgres URL; falls back to SQLite |
| `ALLOWED_HOSTS` | No | Comma-separated hostnames |
| `OPENROUTER_API_KEY` | Yes | For AI suggestions |
| `OPENROUTER_MODEL` | No | Default: `anthropic/claude-sonnet-4-5` |
| `GITHUB_TOKEN` | No | For snapshot export to GitHub |

## API

All endpoints live under `/api/v1/` and use session-cookie authentication.

```
GET    /api/v1/documents/
POST   /api/v1/documents/
GET    /api/v1/documents/{id}/
PATCH  /api/v1/documents/{id}/
GET    /api/v1/documents/{id}/members/
DELETE /api/v1/documents/{id}/members/{user_id}/

GET    /api/v1/documents/{id}/blocks/
POST   /api/v1/documents/{id}/blocks/
PATCH  /api/v1/documents/{id}/blocks/{block_id}/
DELETE /api/v1/documents/{id}/blocks/{block_id}/

GET    /api/v1/documents/{id}/blocks/{block_id}/versions/
POST   /api/v1/documents/{id}/blocks/{block_id}/suggestions/
POST   /api/v1/documents/{id}/blocks/{block_id}/suggestions/{id}/accept/
POST   /api/v1/documents/{id}/blocks/{block_id}/suggestions/{id}/accept-with-edits/
POST   /api/v1/documents/{id}/blocks/{block_id}/suggestions/{id}/reject/

GET    /api/v1/documents/{id}/history/
GET    /api/v1/documents/{id}/snapshots/
POST   /api/v1/documents/{id}/snapshots/
POST   /api/v1/documents/{id}/snapshots/{id}/export/

GET    /api/v1/public/{token}/

GET    /api/v1/auth/me/
```

`POST /api/v1/documents/` accepts an optional `initial_content` field. If provided, the content is split on `\n\n` and each paragraph is created as a separate block.

Document payloads include both `public_token` and `invite_token`, plus `access_role` (`owner` or `collaborator`) and `owner_username`.

There is deliberately no bulk-accept endpoint. Every decision is individual and attributed.

## Running tests

```bash
make test
# or
poetry run pytest
```

## Deploy to Railway

1. Create a Railway project and add a Postgres plugin.
2. Set the required environment variables.
3. Push to `main` — migrations run automatically before the server starts.
4. Run `make frontend-build` locally and commit the build output, or add a build step to the Railway config.
