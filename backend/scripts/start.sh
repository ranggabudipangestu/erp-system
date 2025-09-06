#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Run migrations then start the API
echo "Running DB migrations..."
alembic upgrade head
echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-6000}" --reload

