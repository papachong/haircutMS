.PHONY: help dev dev-up dev-down build-web build-server build-all prod-up prod-down prod-restart prod-logs prod-pull prod-status clean

help:
	@echo "Available commands:"
	@echo "  dev-up          - Start development environment"
	@echo "  dev-down        - Stop development environment"
	@echo "  build-web       - Build web Docker image"
	@echo "  build-server    - Build server Docker image"
	@echo "  build-all       - Build all Docker images"
	@echo "  prod-up         - Start production environment"
	@echo "  prod-down       - Stop production environment"
	@echo "  prod-restart    - Restart production environment"
	@echo "  prod-logs       - View production logs"
	@echo "  prod-pull       - Pull latest images"
	@echo "  prod-status     - Check production status"
	@echo "  clean           - Remove all containers and volumes"

dev-up:
	docker-compose -f docker/docker-compose.dev.yml up -d

dev-down:
	docker-compose -f docker/docker-compose.dev.yml down

build-web:
	docker build -f apps/web/Dockerfile -t haircutms-web:local .

build-server:
	docker build -f apps/server/Dockerfile -t haircutms-server:local .

build-all: build-web build-server

prod-up:
	docker-compose -f docker/docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker/docker-compose.prod.yml down

prod-restart:
	docker-compose -f docker/docker-compose.prod.yml restart

prod-logs:
	docker-compose -f docker/docker-compose.prod.yml logs -f

prod-pull:
	docker-compose -f docker/docker-compose.prod.yml pull

prod-status:
	docker-compose -f docker/docker-compose.prod.yml ps

clean:
	docker-compose -f docker/docker-compose.prod.yml down -v
	docker image prune -f
	docker volume prune -f