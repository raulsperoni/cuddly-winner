#!/bin/sh
set -e

PORT_TO_BIND="${PORT:-8000}"
WORKERS="${GUNICORN_WORKERS:-2}"

exec poetry run gunicorn cuddly_winner.wsgi:application \
  --bind "0.0.0.0:${PORT_TO_BIND}" \
  --workers "${WORKERS}"
