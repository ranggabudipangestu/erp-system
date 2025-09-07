SHELL := /bin/bash

# Paths and tools
BACKEND_DIR := backend

.PHONY: help install mig-add migrate run dev docker-up docker-down docker-logs docker-migrate docker-revision

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
	cd $(BACKEND_DIR) && uvicorn app.main:app --host 0.0.0.0 --port 6000

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

