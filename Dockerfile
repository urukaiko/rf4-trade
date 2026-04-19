# ============================================================
# Multi-stage Dockerfile for SvelteKit + Bun
# ============================================================
# Stage 1: Install all dependencies (including devDependencies)
# Stage 2: Build the SvelteKit app
# Stage 3: Minimal runtime image with app + DB tools
# ============================================================

# ---------- Stage 1: dependencies ----------
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# ---------- Stage 2: build ----------
FROM oven/bun:1-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG BETTER_AUTH_SECRET=
ARG BETTER_AUTH_URL=http://localhost:3000
ARG VITE_BETTER_AUTH_URL=http://localhost:3000
ARG DATABASE_URL=postgresql://placeholder:placeholder@placeholder:5432/placeholder

ENV NODE_ENV=production
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}
ENV VITE_BETTER_AUTH_URL=${VITE_BETTER_AUTH_URL}
ENV DATABASE_URL=${DATABASE_URL}
RUN bun run build

# ---------- Stage 3: runtime ----------
FROM oven/bun:1-alpine AS runtime
WORKDIR /app

# App runtime
COPY --from=build /app/build ./build

# DB tools & data (needed for db:migrate and db:seed)
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/src/lib/server/db ./src/lib/server/db
COPY --from=build /app/static ./static

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "build/index.js"]