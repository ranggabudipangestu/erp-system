#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Start the API
echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-6000}" --reload

