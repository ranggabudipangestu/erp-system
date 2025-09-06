Backend (FastAPI)

This directory contains a FastAPI rewrite of the ERP backend, structured as a modular monolith to mirror the .NET layout.

Key points:
- Clean module prefixes (no `/api`): e.g., `/master-data/products`.
- PostgreSQL via SQLAlchemy, mapping to the same schema/table (`masterdata.Products`).
- Clear separation of concerns: routers, services, repositories, schemas, and models per module.

Quickstart (Local)
- Create a Python virtualenv and install dependencies: `pip install -r requirements.txt`.
- Copy env and configure:
  - `cp .env.example .env`
  - Adjust values as needed (e.g., `DATABASE_URL`, `CORS_ORIGINS`).
- If not using an env file, `DATABASE_URL` defaults to `postgresql+psycopg2://erp_user:erp_password@localhost:5432/erp_system`.
- Run the app: `uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload`.

Environment
- `DATABASE_URL`: SQLAlchemy URL to your Postgres DB.
- `CORS_ORIGINS`: Comma-separated list of allowed origins (default `http://localhost:3000`).

Structure
- `app/main.py` — App factory, router registration, middleware.
- `app/core/config.py` — Settings and environment parsing.
- `app/core/db.py` — SQLAlchemy engine/session and base model.
- `app/modules/master_data/product/*` — Product domain (models, schemas, repo, service, router).

Notes
- Migrations are handled via Alembic (see below).
- Decimal precision and constraints match the .NET Entity configuration.

Docker (Development)
- Prereqs: Docker and Docker Compose.
- Start services: `docker compose up -d postgres api`
  - `postgres` exposes `5432` with default creds from the root compose.
  - `api` runs FastAPI on `http://localhost:6000` with autoreload and mounts `./backend` for live edits.
- Logs: `docker compose logs -f api`
- Stop: `docker compose down`

Compose details
- Service name: `api` (replaces the previous .NET API).
- Environment:
  - `DATABASE_URL=postgresql+psycopg2://erp_user:erp_password@postgres:5432/erp_system`
  - `CORS_ORIGINS=http://localhost:3000`
- Volume: `./backend:/app` for development.

Migrations (Alembic)
- Alembic is configured under `backend/alembic` with `backend/alembic.ini`.
- Initial revision creates the `masterdata` schema and `Products` table.

Local usage
- Install deps: `pip install -r backend/requirements.txt`
- Set env: copy `backend/.env.example` to `backend/.env` and edit values.
- Run migrations: from `backend/`, run `alembic upgrade head` or `bash scripts/migrate.sh`.
- Create new revision from models: `bash scripts/migrate.sh revision -m "your message"` then `bash scripts/migrate.sh upgrade`.

Docker usage
- Option A (manual): `docker compose run --rm api bash -lc 'alembic upgrade head'`
- Option B (entry script): change the api service command to `bash scripts/start.sh` to apply migrations on start.

Front-end integration
- The backend base path is module-first (no `/api`). Example endpoints:
  - `GET /master-data/products`
  - `GET /master-data/products/{id}`
  - `POST /master-data/products`
- Update frontend proxies/rewrite rules to target `/master-data/:path*` → `http://localhost:6000/master-data/:path*` during development.

Environment files
- Local development (outside Docker): create `backend/.env` using `backend/.env.example`. Typical values:
  - `DATABASE_URL=postgresql+psycopg2://erp_user:erp_password@localhost:5432/erp_system`
  - `CORS_ORIGINS=http://localhost:3000`
  - `PORT=5000` (optional; uvicorn command still sets the port)
- Docker compose already injects container-friendly values (e.g., DB host `postgres`). You usually don’t need an env file for the container.
