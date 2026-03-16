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
```

## Architecture

**Pull Requests for Prose** — a Django app for collaborative AI-assisted policy document drafting, where AI suggestions must be explicitly accepted or rejected (nothing auto-applies).

### Data model (`core/models.py`)

The core entity hierarchy:
- `Document` — top-level document with draft/published status and a `public_token` UUID for read-only sharing
- `Block` — ordered paragraph within a document; has a `position` field
- `BlockVersion` — immutable version of a block's text; tracks `author_type` (human/AI), `based_on_version` (parent lineage), and `is_current` flag. Only one version per block can be `is_current=True` (enforced in `save()`)
- `Suggestion` — AI-generated alternative text for a block (types: rewrite, improve, shorten, expand); must be accepted/rejected via a `Decision`
- `Decision` — human approval record linking a `Suggestion` to a resulting `BlockVersion`; types: accept, reject, accept_with_edits
- `Snapshot` — point-in-time export of a document (versioned); can be pushed to GitHub (`github_commit_sha`, `github_repo`)
- `AuditEvent` — append-only log of all significant actions on a document

### Services (`services/`)

- `services/llm.py` — calls OpenRouter API (using the `openai` client pointed at `https://openrouter.ai/api/v1`) to generate block suggestions. Model is configured via `OPENROUTER_MODEL` env var (default: `anthropic/claude-sonnet-4-5`)
- `services/github_export.py` — exports document snapshots as committed markdown files to a GitHub repo using `GITHUB_TOKEN`

### Frontend

No build step — Tailwind CSS via CDN, HTMX for dynamic interactions, Alpine.js for lightweight JS.

### Auth

django-allauth with both username and email login. All document editing requires authentication; read-only public access via `public_token` UUID.

### Environment variables

See `.env.example`. Key ones: `SECRET_KEY`, `OPENROUTER_API_KEY`, `GITHUB_TOKEN` (optional), `DATABASE_URL` (defaults to SQLite).
