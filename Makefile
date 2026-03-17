.PHONY: install frontend-install dev frontend-dev frontend-build \
        migrate migrations test test-cov lint shell superuser

install:
	poetry install

frontend-install:
	cd frontend && npm install

dev:
	poetry run python manage.py runserver

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

migrate:
	poetry run python manage.py migrate

migrations:
	poetry run python manage.py makemigrations

test:
	poetry run pytest

test-cov:
	poetry run pytest --cov=core --cov-report=term-missing

lint:
	cd frontend && npx tsc --noEmit

shell:
	poetry run python manage.py shell

superuser:
	poetry run python manage.py createsuperuser
