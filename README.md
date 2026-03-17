# cuddly-winner

> Pull Requests for Prose — accountable AI for political and policy drafting.

AI suggestions behave like pull requests: proposed changes that a human must
explicitly accept before entering the canonical document. Every paragraph keeps
a traceable approval history.

## What it does

- Write policy documents collaboratively in a React editor
- Request AI rewrites, improvements, shortenings, or expansions per block
- Accept, edit, or reject AI suggestions with recorded decisions
- Inspect lineage and document history
- Share public read-only links
- Share invite links that grant collaborator access
- Export snapshots to GitHub

## Stack

| Layer | Tech |
|---|---|
| Backend | Django 5 + Django REST Framework |
| Frontend | React + Vite + TypeScript |
| Auth | django-allauth |
| Editor | TipTap |
| State | Zustand |
| Database | PostgreSQL in production, SQLite locally |

## Local setup

```bash
cp .env.example .env
make install
make migrate
make dev
```

Or with Docker:

```bash
cp .env.example .env
docker compose up
```

## Full dev setup

```bash
# Terminal 1 — Django
make dev

# Terminal 2 — frontend
make frontend-dev
```

The Vite dev server proxies API and app routes to Django at `:8000`.

## Make targets

```text
make install          Install Python dependencies
make frontend-install Install frontend npm dependencies
make dev              Run Django dev server
make frontend-dev     Run Vite dev server
make frontend-build   Build frontend to staticfiles/frontend/
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
| `CSRF_TRUSTED_ORIGINS` | No | Comma-separated trusted origins |
| `OPENROUTER_API_KEY` | Yes | AI suggestion backend |
| `OPENROUTER_MODEL` | No | Default model for suggestions |
| `GITHUB_TOKEN` | No | Snapshot export token |

## Tests

```bash
make test
# or
poetry run pytest
```

## Deploy

1. Create a Railway project and add Postgres.
2. Set the required environment variables.
3. Run migrations during deploy.
4. Build and serve the frontend assets, or add that build step to deployment.

## Documentation

- [docs/product.md](./docs/product.md)
- [docs/specs.md](./docs/specs.md)
- [docs/design.md](./docs/design.md)
