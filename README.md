# rf4-trade

Marketplace for Russian Fishing 4 players to trade in-game items.

## Stack

SvelteKit 5 · Bun · PostgreSQL · Drizzle ORM · Better Auth · UnoCSS · Valibot

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) 1.1+
- [Docker](https://www.docker.com/) (or local PostgreSQL 16+)

### Local Development

```bash
# Start the database
bun run dev:db
# Or manually: docker compose -f docker-compose.yml -f docker-compose.dev.yml up db -d

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL)

# Setup database
bun run db:generate
bun run db:migrate
bun run db:seed

# Start dev server (with database)
bun run dev:full
# Or just the app: bun run dev
```

### Docker Compose (Dev)

```bash
# App + DB
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

# App + DB + Caddy (local HTTPS)
docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile local-caddy up --build -d
```

### Docker Compose (Prod)

Requires `.env` configured from `.env.production.example`. Images are pulled from ghcr.io — no local build.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Includes Caddy with automatic HTTPS via Let's Encrypt.

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start Vite dev server |
| `bun run dev:db` | Start database in background |
| `bun run dev:full` | Start database + dev server |
| `bun run build` | Production build |
| `bun run check` | Svelte type checking |
| `bun run test` | Run Vitest unit tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run db:generate` | Generate Drizzle SQL migrations |
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:seed` | Upsert item catalog |
| `bun run db:up` | Start database container |
| `bun run db:down` | Stop database container |
| `bun run db:logs` | Show database logs |
| `bun run db:reset` | Reset database (drops and recreates) |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Session signing key |
| `BETTER_AUTH_URL` | Yes | Server-side auth base URL |
| `VITE_BETTER_AUTH_URL` | Yes | Client-side auth base URL |
| `ORIGIN` | Prod | Public-facing URL |
| `DOMAIN` | Prod | Domain for Caddy TLS |
| `GITHUB_REPO` | Prod | ghcr.io image path (`user/repo`) |
| `DATABASE_URL_TEST` | No | Test database URL |
| `VITE_HOST` | No | Vite host (Windows WSL2) |

*See `.env.example` for dev defaults, `.env.production.example` for prod.*

## Deployment

Push to `main` triggers automatic deployment via GitHub Actions: build → ghcr.io → SSH deploy to VPS.

### VPS Setup (once)

```bash
ssh root@YOUR_VPS_IP
curl -fsSL https://get.docker.com | sh
# Download and run the setup script from the repo
bash scripts/vps-setup.sh
# Edit .env with production values
nano /opt/rf4-trade/.env
```

### GitHub Secrets

Configure in repo → Settings → Secrets and variables → Actions:

| Secret | Description |
|---|---|
| `VPS_HOST` | VPS IP address |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Private SSH key for VPS access |
| `CR_PAT` | GitHub PAT with `read:packages` scope |

### Manual Deploy

```bash
ssh deploy@YOUR_VPS_IP
cd /opt/rf4-trade
./scripts/deploy.sh
```

### Health Check

`GET /api/health` — verifies database and auth connectivity. Returns `200` (ok) or `503` (degraded).

## License

Copyright © 2024 [Твое Имя / Ник]

Apache License 2.0 with the Commons Clause Restriction. Commercial use is prohibited without explicit written permission. See [LICENSE](LICENSE) for details.

---

*This project was developed with the assistance of AI tools.*