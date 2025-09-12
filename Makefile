SHELL := /bin/bash

# Paths and tools
BACKEND_DIR := backend
FRONTEND_DIR := ui/erp-dashboard

.PHONY: help install mig-add migrate run dev dev-frontend docker-up docker-down docker-logs docker-migrate docker-revision weasyprint-setup-macos weasyprint-setup-ubuntu weasyprint-check

help: ## Show this help
	@echo "Available targets:"
	@echo "  install           - Install backend dependencies"
	@echo "  migration-add MSG=...   - Create new Alembic migration (autogenerate)"
	@echo "  migrate           - Apply DB migrations (upgrade head)"
	@echo "  run               - Run backend (applies migrations first)"
	@echo "  dev               - Alias for run"
	@echo "  docker-up         - Start services with Docker Compose"
	@echo "  docker-down       - Stop services"
	@echo "  docker-logs       - Tail backend logs"
	@echo "  docker-migrate    - Apply migrations inside the API container"
	@echo "  docker-revision MSG=... - Create migration inside the API container"
	@echo "  weasyprint-setup-macos - Install WeasyPrint native deps via Homebrew"
	@echo "  weasyprint-setup-ubuntu - Print apt-get install instructions for WeasyPrint deps"
	@echo "  weasyprint-check   - Quick check for libpango on macOS"

install: ## Install backend dependencies
	pip install -r $(BACKEND_DIR)/requirements.txt

migration-add: ## Create new Alembic migration (autogenerate); usage: make migration-add MSG="Add table"
	@[ -n "$(MSG)" ] || (echo "MSG is required. Usage: make migration-add MSG=\"Your message\"" >&2; exit 1)
	cd $(BACKEND_DIR) && alembic revision --autogenerate -m "$(MSG)"

migrate: ## Apply DB migrations (upgrade head)
	cd $(BACKEND_DIR) && alembic upgrade head

run: ## Run backend locally (applies migrations first)
	cd $(BACKEND_DIR) && bash scripts/start.sh

dev: ## Run backend in development mode
	cd $(BACKEND_DIR) && DYLD_LIBRARY_PATH="/opt/homebrew/lib:$$DYLD_LIBRARY_PATH" uvicorn app.main:app --host 0.0.0.0 --port 8000
dev-frontend: ## Run frontend in development mode
	cd $(FRONTEND_DIR) && npm run dev

docker-up: ## Start services with Docker Compose
	docker compose up -d

docker-down: ## Stop services
	docker compose down

docker-logs: ## Tail backend logs
	docker compose logs -f api

docker-migrate: ## Apply migrations inside the API container
	docker compose run --rm api bash -lc 'alembic upgrade head'

docker-revision: ## Create migration inside the API container; usage: make docker-revision MSG="Add table"
	@[ -n "$(MSG)" ] || (echo "MSG is required. Usage: make docker-revision MSG=\"Your message\"" >&2; exit 1)
	docker compose run --rm api bash -lc 'alembic revision --autogenerate -m "$(MSG)"'

weasyprint-setup-macos: ## Install WeasyPrint native deps via Homebrew
	@command -v brew >/dev/null 2>&1 || { echo "Homebrew is required: https://brew.sh"; exit 1; }
	brew install pango cairo gdk-pixbuf harfbuzz libffi shared-mime-info
	@echo "\nAdd to your shell profile if needed:"
	@echo "  export DYLD_LIBRARY_PATH=/opt/homebrew/lib:\$$DYLD_LIBRARY_PATH"
	@echo "\nSee docs/weasyprint-setup.md for details."

weasyprint-setup-ubuntu: ## Print apt-get install instructions for WeasyPrint deps
	@echo "Run the following on Ubuntu/Debian systems:"
	@echo "  sudo apt-get update"
	@echo "  sudo apt-get install -y libpango-1.0-0 libpangoft2-1.0-0 libgdk-pixbuf-2.0-0 libharfbuzz0b libcairo2 libffi-dev shared-mime-info"

weasyprint-check: ## Quick check for libpango on macOS
	@echo "Checking for libpango in /opt/homebrew/lib and /usr/local/lib..."
	@ls -1 /opt/homebrew/lib/libpango-1.0.* 2>/dev/null || true
	@ls -1 /usr/local/lib/libpango-1.0.* 2>/dev/null || true
	@echo "If empty, run: make weasyprint-setup-macos"
