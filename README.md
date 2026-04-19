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
docker compose up db -d

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL)

# Setup database
bun run db:generate
bun run db:migrate
bun run db:seed

# Start dev server
bun run dev
```

### Docker Compose

```bash
docker compose up --build -d
```
Requires `.env.production` configured with `ORIGIN`, `BETTER_AUTH_URL`, and `VITE_BETTER_AUTH_URL`. Includes Caddy for automatic HTTPS.

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start Vite dev server |
| `bun run build` | Production build |
| `bun run check` | Svelte type checking |
| `bun run test:setup` | Create test DB, run migrations + seed |
| `bun run test` | Run Vitest unit tests |
| `bun run test:e2e` | Run Playwright E2E tests |
| `bun run db:generate` | Generate Drizzle SQL migrations |
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:seed` | Upsert item catalog |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Session signing key |
| `BETTER_AUTH_URL` | Yes | Server-side auth base URL |
| `VITE_BETTER_AUTH_URL` | Yes | Client-side auth base URL |
| `ORIGIN` | No | Public-facing URL (required for prod) |
| `DATABASE_URL_TEST`| No | Test database URL |

*See `.env.example` for defaults and Docker-specific variables.*

## License

Copyright © 2024 [Твое Имя / Ник]

Apache License 2.0 with the Commons Clause Restriction. Commercial use is prohibited without explicit written permission. See [LICENSE](LICENSE) for details.

---

*This project was developed with the assistance of AI tools.*