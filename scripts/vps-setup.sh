#!/usr/bin/env bash
# ============================================================
# VPS Initial Setup — Ubuntu 24 LTS
# ============================================================
# Run this script ONCE on a fresh VPS as root (or with sudo).
#
# Usage:
#   ssh root@YOUR_VPS_IP
#   curl -fsSL https://get.docker.com | sh   # Install Docker first
#   bash vps-setup.sh
#
# Prerequisites:
#   - Public GitHub repo (git clone works without auth)
#   - For private repos: set up Deploy Key or use PAT in URL
# ============================================================

set -euo pipefail

PROJECT_DIR="/opt/rf4-trade"
DEPLOY_USER="deploy"
REPO_URL="https://github.com/YOUR_GITHUB_USERNAME/rf4-trade.git"

echo "=== rf4-trade VPS Setup ==="
echo ""

# ---------- 1. Create deploy user ----------
if id "$DEPLOY_USER" &>/dev/null; then
    echo "User '$DEPLOY_USER' already exists, skipping."
else
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
    echo "Created user: $DEPLOY_USER"
fi

# Add deploy to docker group (allows docker commands without sudo)
usermod -aG docker "$DEPLOY_USER"
echo "Added '$DEPLOY_USER' to docker group."

# ---------- 2. Install git ----------
if ! command -v git &>/dev/null; then
    apt-get update && apt-get install -y git
fi

# ---------- 3. Clone repository ----------
# For public repos — works without auth.
# For private repos — use Deploy Key or PAT:
#   REPO_URL="https://YOUR_PAT@github.com/YOUR_GITHUB_USERNAME/rf4-trade.git"
#   REPO_URL="git@github.com:YOUR_GITHUB_USERNAME/rf4-trade.git"
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "Repository already cloned at $PROJECT_DIR, skipping."
else
    su - "$DEPLOY_USER" -c "git clone $REPO_URL $PROJECT_DIR"
    echo "Cloned repository to $PROJECT_DIR"
fi

# ---------- 4. Create .env from template ----------
su - "$DEPLOY_USER" << 'ENV_SETUP'
cd /opt/rf4-trade

if [ ! -f .env ]; then
    cp .env.production.example .env
    chmod 600 .env
    echo "Created .env from template — EDIT BEFORE FIRST DEPLOY!"
else
    echo ".env already exists, skipping."
fi
ENV_SETUP

# ---------- 5. Configure firewall ----------
echo "Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "Firewall: SSH (22), HTTP (80), HTTPS (443) allowed."

# ---------- 6. Weekly Docker cleanup cron ----------
# ONLY prune unused images — NEVER prune volumes (database lives there!)
echo "Setting up weekly Docker cleanup cron..."
cat > /etc/cron.d/docker-cleanup << 'CRON'
# Remove unused Docker images every Sunday at 04:00
# NOTE: --volumes is intentionally omitted to protect database data
0 4 * * 0 deploy docker image prune -a -f > /dev/null 2>&1
CRON
chmod 644 /etc/cron.d/docker-cleanup
echo "Cron job added: weekly image prune on Sundays at 04:00."

# ---------- 7. Next steps ----------
echo ""
echo "=== Next Steps ==="
echo ""
echo "1. Edit /opt/rf4-trade/.env with real values:"
echo "   su - deploy"
echo "   nano /opt/rf4-trade/.env"
echo ""
echo "2. Generate SSH key for GitHub Actions (on YOUR machine, not VPS):"
echo "   ssh-keygen -t ed25519 -C 'github-actions-deploy' -f ~/.ssh/vps-deploy"
echo ""
echo "3. Add the PUBLIC key to VPS:"
echo "   ssh-copy-id -i ~/.ssh/vps-deploy.pub deploy@YOUR_VPS_IP"
echo ""
echo "4. Add the PRIVATE key to GitHub Secrets (VPS_SSH_KEY):"
echo "   cat ~/.ssh/vps-deploy"
echo ""
echo "5. Add these GitHub Secrets to your repo:"
echo "   VPS_HOST      = your VPS IP address"
echo "   VPS_USER      = deploy"
echo "   VPS_SSH_KEY   = contents of the private key"
echo "   CR_PAT        = GitHub PAT with read:packages scope"
echo ""
echo "6. Log in to ghcr.io on VPS (one time, for pull access):"
echo "   su - deploy"
echo "   docker login ghcr.io -u YOUR_GITHUB_USERNAME"
echo "   # Use a GitHub Personal Access Token with read:packages scope"
echo ""
echo "=== Setup complete! ==="
