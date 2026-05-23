#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# HaircutMS 本地 Docker 部署脚本
# ──────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.local.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

# ── Config ────────────────────────────────────
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASS="haircutms_dev"
DB_NAME="haircutms"
SERVER_PORT="4000"
WEB_PORT="3000"
ADMIN_PHONE="13800000000"
ADMIN_PASS="admin123"
SHOP_OWNER_PHONE="13900000001"
SHOP_OWNER_PASS="owner123"

# ── Prerequisites ─────────────────────────────
check_prerequisites() {
  info "Checking prerequisites..."

  command -v docker >/dev/null 2>&1 || fail "docker not found"
  docker info >/dev/null 2>&1 || fail "Docker daemon not running"
  command -v node >/dev/null 2>&1 || fail "node not found"
  command -v pnpm >/dev/null 2>&1 || fail "pnpm not found (run: npm i -g pnpm@9.15.0)"

  ok "All prerequisites met"
}

# ── Build ─────────────────────────────────────
build_server_dist() {
  info "Building server dist..."
  cd "$PROJECT_ROOT"
  pnpm --filter @haircut-ms/server build
  ok "Server dist built"
}

build_images() {
  info "Building Docker images..."
  cd "$PROJECT_ROOT"
  docker compose -f "$COMPOSE_FILE" build "$@"
  ok "Docker images built"
}

# ── Infrastructure ────────────────────────────
start_infra() {
  info "Starting MySQL and Redis..."
  docker compose -f "$COMPOSE_FILE" up -d mysql redis
  info "Waiting for MySQL to be ready..."
  local retries=40
  while [ $retries -gt 0 ]; do
    if docker compose -f "$COMPOSE_FILE" exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
      # Extra wait: ping responds before connection handler is fully up
      sleep 3
      # Verify with an actual query
      if docker compose -f "$COMPOSE_FILE" exec -T mysql mysql -u"${DB_USER}" -p"${DB_PASS}" -e "SELECT 1" --silent 2>/dev/null; then
        ok "MySQL is ready"
        return 0
      fi
    fi
    retries=$((retries - 1))
    sleep 2
    printf "."
  done
  echo ""
  fail "MySQL did not become ready in time"
}

# ── Database ──────────────────────────────────
push_schema() {
  info "Pushing Prisma schema to database..."
  cd "$PROJECT_ROOT"
  DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}" \
    npx prisma db push --schema apps/server/prisma/schema.prisma --skip-generate 2>&1 | tail -3
  ok "Schema pushed"
}

seed_database() {
  info "Seeding database..."
  cd "$PROJECT_ROOT"
  DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}" \
    npx ts-node apps/server/prisma/seed.ts 2>&1 | tail -1
  ok "Database seeded"
}

reset_database() {
  warn "Resetting database..."
  cd "$PROJECT_ROOT"
  docker compose -f "$COMPOSE_FILE" exec -T mysql mysql -u"${DB_USER}" -p"${DB_PASS}" -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
  push_schema
  seed_database
  ok "Database reset complete"
}

# ── Application ───────────────────────────────
start_app() {
  info "Starting server and web..."
  cd "$PROJECT_ROOT"
  docker compose -f "$COMPOSE_FILE" up -d server web
  ok "Application started"
}

# ── Health check ──────────────────────────────
wait_healthy() {
  local service="$1"
  local url="$2"
  local retries="${3:-20}"

  info "Waiting for $service to be healthy..."
  while [ $retries -gt 0 ]; do
    if curl -sf "$url" >/dev/null 2>&1; then
      ok "$service is healthy"
      return 0
    fi
    retries=$((retries - 1))
    sleep 3
    printf "."
  done
  echo ""
  fail "$service did not become healthy"
}

verify_deployment() {
  info "Verifying deployment..."

  wait_healthy "server" "http://localhost:${SERVER_PORT}/health" 20
  wait_healthy "web" "http://localhost:${WEB_PORT}/" 15

  # Test platform admin login
  local login_response
  login_response=$(curl -sf http://localhost:${SERVER_PORT}/api/v1/platform/auth/login \
    -X POST -H "Content-Type: application/json" \
    -d "{\"phone\":\"${ADMIN_PHONE}\",\"password\":\"${ADMIN_PASS}\"}" 2>/dev/null || echo "")

  if echo "$login_response" | grep -q "accessToken"; then
    ok "Platform admin login verified"
  else
    warn "Platform admin login test failed (may need re-seed: $0 seed)"
  fi

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Deployment complete!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "  Web:     ${CYAN}http://localhost:${WEB_PORT}${NC}"
  echo -e "  API:     ${CYAN}http://localhost:${SERVER_PORT}/api/v1${NC}"
  echo -e "  Health:  ${CYAN}http://localhost:${SERVER_PORT}/health${NC}"
  echo ""
  echo -e "  Platform admin:  ${ADMIN_PHONE} / ${ADMIN_PASS}"
  echo -e "  Shop owner:      ${SHOP_OWNER_PHONE} / ${SHOP_OWNER_PASS}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ── Status ────────────────────────────────────
show_status() {
  echo -e "${CYAN}Container Status:${NC}"
  docker compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null
  echo ""

  local server_up=false web_up=false
  curl -sf "http://localhost:${SERVER_PORT}/health" >/dev/null 2>&1 && server_up=true
  curl -sf "http://localhost:${WEB_PORT}/" >/dev/null 2>&1 && web_up=true

  echo -e "  Server:  $([ "$server_up" = true ] && echo "${GREEN}healthy${NC}" || echo "${RED}down${NC}")"
  echo -e "  Web:     $([ "$web_up" = true ] && echo "${GREEN}healthy${NC}" || echo "${RED}down${NC}")"
}

# ── Logs ──────────────────────────────────────
show_logs() {
  local service="${1:-}"
  if [ -n "$service" ]; then
    docker compose -f "$COMPOSE_FILE" logs -f "$service"
  else
    docker compose -f "$COMPOSE_FILE" logs -f
  fi
}

# ── Teardown ──────────────────────────────────
down() {
  info "Stopping all services..."
  docker compose -f "$COMPOSE_FILE" down
  ok "All services stopped"
}

clean() {
  warn "Removing containers, volumes, and images..."
  docker compose -f "$COMPOSE_FILE" down -v --rmi local 2>/dev/null
  ok "Cleaned up"
}

# ── Full deploy ───────────────────────────────
full_deploy() {
  echo -e "${CYAN}"
  echo "  ╔══════════════════════════════════════╗"
  echo "  ║   HaircutMS Local Docker Deployer    ║"
  echo "  ╚══════════════════════════════════════╝"
  echo -e "${NC}"

  check_prerequisites
  build_server_dist
  build_images "$@"
  start_infra
  push_schema
  seed_database
  start_app
  verify_deployment
}

# ── Usage ─────────────────────────────────────
usage() {
  cat <<EOF
Usage: $(basename "$0") <command> [options]

Commands:
  deploy    Full deploy: build → infra → schema → seed → start (default)
  build     Build Docker images only
  up        Start all services (infra + app)
  down      Stop all services
  restart   Restart server and web (rebuild dist first)
  seed      Re-seed database only
  reset     Drop and recreate database, then seed
  status    Show container and service status
  logs      Follow logs (optional: server|web|mysql|redis)
  clean     Remove containers, volumes, and images
  help      Show this help

Options:
  --no-cache    Rebuild Docker images without cache (with build/deploy)

Examples:
  $(basename "$0")                    # Full deploy
  $(basename "$0") deploy --no-cache  # Full deploy, no Docker cache
  $(basename "$0") logs server        # Follow server logs
  $(basename "$0") restart            # Rebuild dist and restart app
EOF
}

# ── Main ──────────────────────────────────────
main() {
  local cmd="${1:-deploy}"
  shift || true

  local build_opts=()
  while [ $# -gt 0 ]; do
    case "$1" in
      --no-cache) build_opts+=("--no-cache"); shift ;;
      *) shift ;;
    esac
  done

  case "$cmd" in
    deploy)  full_deploy ${build_opts+"${build_opts[@]}"} ;;
    build)   check_prerequisites; build_server_dist; build_images ${build_opts+"${build_opts[@]}"} ;;
    up)      cd "$PROJECT_ROOT"; docker compose -f "$COMPOSE_FILE" up -d ;;
    down)    down ;;
    restart)
      check_prerequisites
      build_server_dist
      cd "$PROJECT_ROOT"
      docker compose -f "$COMPOSE_FILE" up -d --build server
      info "Waiting for server to recover..."
      sleep 5
      docker compose -f "$COMPOSE_FILE" up -d web
      wait_healthy "server" "http://localhost:${SERVER_PORT}/health" 20
      wait_healthy "web" "http://localhost:${WEB_PORT}/" 15
      ok "Restart complete"
      ;;
    seed)    start_infra; seed_database ;;
    reset)   start_infra; reset_database ;;
    status)  show_status ;;
    logs)    show_logs "${1:-}" ;;
    clean)   clean ;;
    help|-h|--help) usage ;;
    *)       echo "Unknown command: $cmd"; usage; exit 1 ;;
  esac
}

main "$@"
