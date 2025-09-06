Backend (FastAPI)

This directory contains a FastAPI rewrite of the ERP backend, structured as a modular monolith to mirror the .NET layout.

Key points:
- Same API routes as the .NET version (e.g., `/api/master-data/products`).
- PostgreSQL via SQLAlchemy, mapping to the same schema/table (`masterdata.Products`).
- Clear separation of concerns: routers, services, repositories, schemas, and models per module.

Quickstart (Local)
- Create a Python virtualenv and install dependencies: `pip install -r requirements.txt`.
- Set `DATABASE_URL` (defaults to `postgresql+psycopg2://erp_user:erp_password@localhost:5432/erp_system`).
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
- Migrations are not included; you can add Alembic if desired.
- Decimal precision and constraints match the .NET Entity configuration.

Docker (Development)
- Prereqs: Docker and Docker Compose.
- Start services: `docker compose up -d postgres api`
  - `postgres` exposes `5432` with default creds from the root compose.
  - `api` runs FastAPI on `http://localhost:5000` with autoreload and mounts `./backend` for live edits.
- Logs: `docker compose logs -f api`
- Stop: `docker compose down`

Compose details
- Service name: `api` (replaces the previous .NET API).
- Environment:
  - `DATABASE_URL=postgresql+psycopg2://erp_user:erp_password@postgres:5432/erp_system`
  - `CORS_ORIGINS=http://localhost:3000`
- Volume: `./backend:/app` for development.

Front-end integration
- The frontend currently calls `/api/...` relative to its origin. Ensure it proxies to `http://localhost:5000` during dev. If using Next.js rewrites, point `/api/:path*` to `http://localhost:5000/api/:path*` during development.
