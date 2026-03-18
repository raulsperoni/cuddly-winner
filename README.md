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

## CI/CD

GitHub Actions runs the pipeline in
[.github/workflows/ci-cd.yml](./.github/workflows/ci-cd.yml).

On pull requests to `main`, CI does three things:

- runs Django system checks and backend tests against Postgres
- builds the React frontend
- builds the production Docker image

On pushes to `main`, the same checks run first, then the workflow deploys to
Railway with the `RAILWAY_TOKEN` GitHub secret.

## Deploy to Railway

The repo already includes [railway.json](./railway.json) and a production
[Dockerfile](./Dockerfile). Railway will build the React frontend inside the
image, collect static assets, run migrations on boot, and serve Django via
Gunicorn.

### 1. Create the Railway services

1. Create a new Railway project.
2. Add a PostgreSQL service.
3. Add this repo as the application service.

### 2. Set Railway environment variables

Minimum required variables:

```text
SECRET_KEY=<strong-random-secret>
DEBUG=False
DATABASE_URL=<Railway Postgres URL>
ALLOWED_HOSTS=<your-service>.up.railway.app
CSRF_TRUSTED_ORIGINS=https://<your-service>.up.railway.app
OPENROUTER_API_KEY=<your-key>
```

Optional variables:

```text
OPENROUTER_MODEL=anthropic/claude-sonnet-4-5
GITHUB_TOKEN=<token-for-snapshot-export>
SECURE_SSL_REDIRECT=False
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
```

Notes:
- Keep `DEBUG=False` in Railway.
- If you later add a custom domain, update both `ALLOWED_HOSTS` and
  `CSRF_TRUSTED_ORIGINS`.
- `SECURE_SSL_REDIRECT` can stay `False` on Railway because TLS is terminated
  at the proxy, but it is available if you want Django to enforce redirect
  behavior behind forwarded HTTPS headers.

### 3. Deploy

Railway will use the Dockerfile automatically. The deploy flow is:

1. Install Python dependencies with Poetry
2. Install frontend dependencies with `npm ci`
3. Build the React app with `npm run build`
4. Collect Django static files
5. Run [entrypoint.sh](./entrypoint.sh), which applies migrations
6. Start [start-web.sh](./start-web.sh), which binds Gunicorn to `PORT`

### 4. Verify after first deploy

Check these URLs:

- `https://<your-service>.up.railway.app/health/`
- `https://<your-service>.up.railway.app/accounts/login/`
- `https://<your-service>.up.railway.app/`

Then verify:

- signup/login pages load with custom styling
- document editor loads compiled frontend assets
- AI suggestion requests work with the configured `OPENROUTER_API_KEY`
- public sharing and invite links resolve correctly

## Documentation

- [docs/product.md](./docs/product.md)
- [docs/specs.md](./docs/specs.md)
- [docs/design.md](./docs/design.md)
