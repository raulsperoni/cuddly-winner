#!/bin/sh
set -e

poetry run python manage.py migrate --noinput

exec "$@"
