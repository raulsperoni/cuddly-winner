FROM node:20-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.5 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VENV_IN_PROJECT=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install poetry==$POETRY_VERSION

COPY pyproject.toml poetry.lock* ./
RUN poetry install --only=main --no-root

COPY . .
COPY --from=frontend-build /app/staticfiles/frontend ./staticfiles/frontend

RUN poetry run python manage.py collectstatic --noinput \
    --settings=cuddly_winner.settings

ENTRYPOINT ["./entrypoint.sh"]

EXPOSE 8000
CMD ["poetry", "run", "gunicorn", "cuddly_winner.wsgi:application", \
     "--bind", "0.0.0.0:8000"]
