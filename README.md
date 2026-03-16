# cuddly-winner

> Pull Requests for Prose — accountable AI for political and policy drafting.

AI suggestions behave like pull requests: proposed changes that a human must explicitly accept before entering the canonical document. Every paragraph has a traceable approval history.

## What it does

- Write policy documents collaboratively
- Request AI rewrites, improvements, shortenings, or expansions of any paragraph
- Accept or reject AI suggestions — nothing enters the document without a human decision
- Inspect the full lineage of any paragraph (who wrote what, which AI suggestions were accepted)
- Export snapshots to GitHub as committed markdown files
- Share a read-only public link to any document

## Docs

- [Product vision](docs/product.md)
- [MVP design & architecture](docs/mvp_design.md)
- [Specs](docs/specs.md)

## Stack

- Django 5.1 + PostgreSQL
- HTMX + Alpine.js + Tailwind (CDN, no build step)
- LLM via [OpenRouter](https://openrouter.ai)
- Deploy on Railway (migrations run automatically on deploy)

## Local setup

### With Docker

```bash
cp .env.example .env   # fill in OPENROUTER_API_KEY at minimum
docker compose up
```

App available at http://localhost:8000.

### Without Docker

```bash
cp .env.example .env   # set DATABASE_URL or leave blank for SQLite
poetry install
poetry run python manage.py migrate
poetry run python manage.py createsuperuser
poetry run python manage.py runserver
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

## Running tests

```bash
poetry run pytest
```

## Deploy to Railway

1. Create a Railway project and add a Postgres plugin.
2. Set the environment variables above.
3. Push to `main` — migrations run automatically before the server starts.

No manual migration steps needed.
