#!/bin/sh
set -e

echo "Entrypoint: starting database migrations..."
poetry run python manage.py migrate --noinput
echo "Entrypoint: database migrations complete."

exec "$@"
