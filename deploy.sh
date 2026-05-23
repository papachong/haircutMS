#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="root@120.26.82.249"
REMOTE_DIR="/opt/haircutms"
COMPOSE_FILE="docker/docker-compose.prod.yml"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

step()  { echo -e "${GREEN}==>${NC} $1"; }
warn()  { echo -e "${YELLOW}==> WARNING:${NC} $1"; }
error() { echo -e "${RED}==> ERROR:${NC} $1"; exit 1; }

# ── 1. Build server dist ─────────────────────────────────────
step "Building server dist..."
cd "$(dirname "$0")"
pnpm --filter @haircut-ms/server build

# ── 2. Sync source code ─────────────────────────────────────
step "Syncing code to ${REMOTE_HOST}..."
rsync -az --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.claude/worktrees' \
  --exclude='.git' \
  --exclude='.env' \
  -e ssh ./ "${REMOTE_HOST}:${REMOTE_DIR}/"

# ── 3. Build Docker images locally ──────────────────────────
step "Building Docker images..."
docker compose -f "$COMPOSE_FILE" build server web

# ── 4. Save & upload images ─────────────────────────────────
step "Saving images..."
docker save haircutms-server:latest | gzip > /tmp/haircutms-server.tar.gz
docker save haircutms-web:latest    | gzip > /tmp/haircutms-web.tar.gz

step "Uploading images to ${REMOTE_HOST}..."
scp -q /tmp/haircutms-server.tar.gz "${REMOTE_HOST}:/tmp/"
scp -q /tmp/haircutms-web.tar.gz    "${REMOTE_HOST}:/tmp/"

# ── 5. Load images & restart on server ──────────────────────
step "Loading images on remote..."
ssh "${REMOTE_HOST}" "docker load < /tmp/haircutms-server.tar.gz && docker load < /tmp/haircutms-web.tar.gz"

step "Restarting services..."
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker compose -f ${COMPOSE_FILE} up -d --remove-orphans"

# ── 6. Cleanup ──────────────────────────────────────────────
step "Cleaning up local temp files..."
rm -f /tmp/haircutms-server.tar.gz /tmp/haircutms-web.tar.gz

# ── 7. Health check ─────────────────────────────────────────
step "Waiting for services to be healthy..."
sleep 10

HTTP=$(curl -s -o /dev/null -w "%{http_code}" "https://lifa.ruhooai.com" 2>/dev/null || echo "000")
API=$(curl -s -o /dev/null -w "%{http_code}" "https://lifa.ruhooai.com/health" 2>/dev/null || echo "000")

if [[ "$HTTP" == "200" || "$HTTP" == "302" ]] && [[ "$API" == "200" ]]; then
  echo -e "${GREEN}Deploy successful!${NC}  HTTPS=${HTTP}  API=${API}"
else
  warn "Health check returned HTTPS=${HTTP} API=${API} — check logs: ssh ${REMOTE_HOST} 'docker logs haircutms-server; docker logs haircutms-web'"
fi
