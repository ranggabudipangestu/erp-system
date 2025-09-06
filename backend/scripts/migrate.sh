#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v alembic >/dev/null 2>&1; then
  echo "Alembic is not installed in this environment. Install with: pip install -r requirements.txt" >&2
  exit 1
fi

ACTION=${1:-upgrade}

case "$ACTION" in
  upgrade)
    alembic upgrade head
    ;;
  downgrade)
    TARGET=${2:-base}
    alembic downgrade "$TARGET"
    ;;
  revision)
    shift || true
    alembic revision --autogenerate "$@"
    ;;
  *)
    echo "Usage: scripts/migrate.sh [upgrade|downgrade [target]|revision -m 'msg']" >&2
    exit 1
    ;;
esac

