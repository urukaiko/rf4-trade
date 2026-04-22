#!/usr/bin/env bash
# ============================================================
# Manual deploy script for rf4-trade
# ============================================================
# Usage: ./scripts/deploy.sh
#
# Prerequisites:
#   - Docker Compose v2+
#   - .env file with production values
#   - Logged in to ghcr.io: docker login ghcr.io
# ============================================================

set -euo pipefail

COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

echo "=== rf4-trade Deploy ==="
echo ""

# 1. Update config files from repository
echo ">>> Updating config files..."
git pull origin main

# 2. Pull latest image
echo ">>> Pulling latest image..."
${COMPOSE_CMD} pull app

# 3. Run database migrations from the container image
echo ">>> Running migrations..."
${COMPOSE_CMD} run --rm app bun run db:migrate

# 4. Restart app — wait for healthy state
echo ">>> Restarting app..."
${COMPOSE_CMD} up -d --wait app

# 5. Remove all unused images (never --volumes — database lives there)
echo ">>> Cleaning old images..."
docker image prune -a -f

echo ""
echo "=== Deploy complete ==="
${COMPOSE_CMD} ps
