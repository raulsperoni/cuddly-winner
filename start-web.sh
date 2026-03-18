#!/bin/sh
set -e

PORT_TO_BIND="${PORT:-8000}"
WORKERS="${GUNICORN_WORKERS:-2}"
TIMEOUT="${GUNICORN_TIMEOUT:-60}"

echo "Start-web: checking for unapplied migrations..."
UNAPPLIED_MIGRATIONS="$(poetry run python manage.py showmigrations --plan | grep '\[ \]' || true)"
if [ -n "${UNAPPLIED_MIGRATIONS}" ]; then
  echo "Start-web: unapplied migrations detected. Refusing to start."
  echo "${UNAPPLIED_MIGRATIONS}"
  exit 1
fi
echo "Start-web: migration state is clean."

exec poetry run gunicorn cuddly_winner.wsgi:application \
  --bind "0.0.0.0:${PORT_TO_BIND}" \
  --workers "${WORKERS}" \
  --timeout "${TIMEOUT}" \
  --access-logfile - \
  --error-logfile - \
  --capture-output \
  --log-level info
