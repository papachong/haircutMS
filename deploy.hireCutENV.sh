#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# HaircutMS hireCutENV build & deploy script
# ──────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

ENV_NAME="${ENV_NAME:-hireCutENV}"
ENV_FILE="${ENV_FILE:-$PROJECT_ROOT/.deploy/${ENV_NAME}.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

ENV_NAME="${ENV_NAME:-hireCutENV}"
REMOTE_HOST="${REMOTE_HOST:-root@120.26.82.249}"
REMOTE_DIR="${REMOTE_DIR:-/opt/haircutms}"
COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.prod.yml}"
APP_URL="${APP_URL:-https://lifa.ruhooai.com}"
HEALTH_URL="${HEALTH_URL:-${APP_URL%/}/health}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-10}"
SSH_OPTS="${SSH_OPTS:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail() { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

quote() {
  printf '%q' "$1"
}

join_quoted() {
  local joined=""
  local arg
  for arg in "$@"; do
    if [[ -n "$joined" ]]; then
      joined+=" "
    fi
    joined+="$(quote "$arg")"
  done
  printf '%s' "$joined"
}

read_ssh_args() {
  SSH_ARGS=()
  if [[ -n "$SSH_OPTS" ]]; then
    # shellcheck disable=SC2206
    SSH_ARGS=($SSH_OPTS)
  fi
}

ssh_remote() {
  read_ssh_args
  ssh "${SSH_ARGS[@]}" "$REMOTE_HOST" "$@"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 not found"
}

check_local_prerequisites() {
  info "Checking local prerequisites..."
  require_cmd pnpm
  require_cmd rsync
  require_cmd ssh
  require_cmd curl
  ok "Local prerequisites are ready"
}

check_remote_prerequisites() {
  info "Checking remote prerequisites on $REMOTE_HOST..."
  ssh_remote "command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1" \
    || fail "Remote host needs Docker with the compose plugin"
  ok "Remote Docker is ready"
}

show_config() {
  cat <<EOF
Environment:  $ENV_NAME
Remote host:  $REMOTE_HOST
Remote dir:   $REMOTE_DIR
Compose file: $COMPOSE_FILE
App URL:      $APP_URL
Health URL:   $HEALTH_URL
EOF
}

build_dist() {
  info "Building workspace artifacts..."
  cd "$PROJECT_ROOT"
  pnpm --filter @haircut-ms/shared build
  pnpm --filter @haircut-ms/server prisma:generate
  pnpm --filter @haircut-ms/server build
  ok "Workspace artifacts built"
}

sync_source() {
  info "Syncing source to $REMOTE_HOST:$REMOTE_DIR..."
  ssh_remote "mkdir -p $(quote "$REMOTE_DIR")"
  rsync -az --delete \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.turbo' \
    --exclude='.claude/worktrees' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='.env.*.local' \
    --exclude='.env.production' \
    --exclude='.deploy/*.env' \
    -e "ssh $SSH_OPTS" \
    "$PROJECT_ROOT/" "${REMOTE_HOST}:${REMOTE_DIR}/"
  ok "Source synced"
}

build_images_remote() {
  local build_opts=("$@")
  local remote_build_opts=""

  if [[ "${#build_opts[@]}" -gt 0 ]]; then
    remote_build_opts="$(join_quoted "${build_opts[@]}") "
  fi

  info "Building Docker images on $REMOTE_HOST for $ENV_NAME..."
  ssh_remote "cd $(quote "$REMOTE_DIR") && docker compose -f $(quote "$COMPOSE_FILE") build ${remote_build_opts}server web"
  ok "Remote Docker images built"
}

restart_remote() {
  info "Restarting $ENV_NAME services..."
  ssh_remote "cd $(quote "$REMOTE_DIR") && docker compose -f $(quote "$COMPOSE_FILE") up -d --remove-orphans"
  ok "Services restarted"
}

remote_status() {
  ssh_remote "cd $(quote "$REMOTE_DIR") && docker compose -f $(quote "$COMPOSE_FILE") ps"
}

remote_logs() {
  local service="${1:-}"
  if [[ -n "$service" ]]; then
    ssh_remote "cd $(quote "$REMOTE_DIR") && docker compose -f $(quote "$COMPOSE_FILE") logs -f --tail=200 $(quote "$service")"
  else
    ssh_remote "cd $(quote "$REMOTE_DIR") && docker compose -f $(quote "$COMPOSE_FILE") logs -f --tail=200"
  fi
}

health_check_once() {
  local web_code api_code
  web_code="$(curl -sS -o /dev/null -w '%{http_code}' "$APP_URL" 2>/dev/null || echo '000')"
  api_code="$(curl -sS -o /dev/null -w '%{http_code}' "$HEALTH_URL" 2>/dev/null || echo '000')"

  if [[ "$api_code" == "200" && ( "$web_code" == "200" || "$web_code" == "301" || "$web_code" == "302" ) ]]; then
    ok "Health check passed: WEB=$web_code API=$api_code"
    return 0
  fi

  warn "Health check not ready: WEB=$web_code API=$api_code"
  return 1
}

wait_for_health() {
  info "Waiting for $ENV_NAME health checks..."
  local attempt=1
  while [[ "$attempt" -le "$HEALTH_RETRIES" ]]; do
    if health_check_once; then
      return 0
    fi
    info "Retrying in ${HEALTH_INTERVAL}s ($attempt/$HEALTH_RETRIES)..."
    sleep "$HEALTH_INTERVAL"
    attempt=$((attempt + 1))
  done

  fail "Health check failed. Inspect logs with: $0 logs"
}

deploy() {
  local build_opts=("$@")
  show_config
  check_local_prerequisites
  check_remote_prerequisites
  build_dist
  sync_source
  build_images_remote "${build_opts[@]}"
  restart_remote
  wait_for_health
  ok "$ENV_NAME deployment complete"
}

usage() {
  cat <<EOF
Usage: $(basename "$0") <command> [options]

Build and deploy HaircutMS to the $ENV_NAME cloud environment.

Commands:
  deploy       Build workspace artifacts, sync source, build Docker images on the remote host, restart services, and verify health (default)
  build        Build workspace artifacts, sync source, and build Docker images on the remote host only
  sync         Sync source files to the remote environment only
  restart      Restart remote Docker Compose services
  status       Show remote Docker Compose status
  logs         Follow remote logs; optionally pass a service name
  health       Run the external health check only
  config       Print the resolved deployment configuration
  help         Show this help

Options:
  --no-cache   Rebuild Docker images without cache for deploy/build

Environment overrides:
  ENV_NAME, ENV_FILE, REMOTE_HOST, REMOTE_DIR, COMPOSE_FILE, APP_URL, HEALTH_URL,
  SSH_OPTS, HEALTH_RETRIES, HEALTH_INTERVAL

Examples:
  ./deploy.hireCutENV.sh
  ./deploy.hireCutENV.sh deploy --no-cache
  ./deploy.hireCutENV.sh status
  ./deploy.hireCutENV.sh logs server
  REMOTE_HOST=root@example.com APP_URL=https://example.com ./deploy.hireCutENV.sh deploy
EOF
}

main() {
  local cmd="${1:-deploy}"
  if [[ $# -gt 0 ]]; then
    shift
  fi

  local build_opts=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --no-cache)
        build_opts+=("--no-cache")
        shift
        ;;
      -h|--help)
        usage
        return 0
        ;;
      *)
        build_opts+=("$1")
        shift
        ;;
    esac
  done

  case "$cmd" in
    deploy)
      deploy "${build_opts[@]}"
      ;;
    build)
      show_config
      check_local_prerequisites
      check_remote_prerequisites
      build_dist
      sync_source
      build_images_remote "${build_opts[@]}"
      ;;
    sync)
      show_config
      require_cmd rsync
      require_cmd ssh
      sync_source
      ;;
    restart)
      show_config
      restart_remote
      wait_for_health
      ;;
    status)
      remote_status
      ;;
    logs)
      remote_logs "${build_opts[0]:-}"
      ;;
    health)
      wait_for_health
      ;;
    config)
      show_config
      ;;
    help|-h|--help)
      usage
      ;;
    *)
      echo "Unknown command: $cmd"
      usage
      exit 1
      ;;
  esac
}

main "$@"
