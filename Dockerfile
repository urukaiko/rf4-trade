# ============================================================
# Multi-stage Dockerfile for SvelteKit + Bun
# ============================================================
# Stage 1: Install all dependencies (including devDependencies)
# Stage 2: Build the SvelteKit app
# Stage 3: Install production-only dependencies
# Stage 4: Minimal runtime image with app + prod deps + DB tools
# ============================================================

# ---------- Stage 1: dependencies ----------
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ---------- Stage 2: build ----------
FROM oven/bun:1-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time ARGs — these are ONLY used during `bun run build`.
# BETTER_AUTH_SECRET is required by better-auth at build time for
# initialization. The runtime secret (from docker-compose environment)
# overrides this — the build-time value is never used in production.
ARG BETTER_AUTH_SECRET=build-time-placeholder-not-used-at-runtime
ARG BETTER_AUTH_URL=http://localhost:3000
ARG VITE_BETTER_AUTH_URL=http://localhost:3000
ARG DATABASE_URL=postgresql://build:build@placeholder:5432/placeholder

ENV NODE_ENV=production
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}
ENV VITE_BETTER_AUTH_URL=${VITE_BETTER_AUTH_URL}
ENV DATABASE_URL=${DATABASE_URL}
RUN bun run build

# ---------- Stage 3: production dependencies ----------
FROM oven/bun:1-alpine AS prod-deps
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# ---------- Stage 4: runtime ----------
FROM oven/bun:1-alpine AS runtime
WORKDIR /app

# curl is needed for Docker healthcheck (docker-compose.prod.yml)
RUN apk add --no-cache curl

# App runtime
COPY --from=build /app/build ./build

# Production-only dependencies (no devDependencies, no test frameworks)
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# DB tools & data (needed for db:migrate and db:seed)
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/src/lib/server/db ./src/lib/server/db

# NOTE: static/ is NOT copied — game assets are gitignored (public repo).
# If needed at runtime (e.g. db:seed), mount as a Docker volume:
#   volumes:
#     - ./static:/app/static

# NOTE: BETTER_AUTH_SECRET is NOT set here.
# It is provided at runtime via docker-compose environment variables.
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "build/index.js"]