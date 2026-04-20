# ── Stage 1: Build ──
FROM node:22-slim AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml nx.json tsconfig.base.json ./
COPY backend/ backend/
COPY libs/ libs/

RUN pnpm install --frozen-lockfile
RUN pnpm nx build backend
RUN pnpm nx run backend:prune

# ── Stage 2: Runtime ──
FROM node:22-slim AS runtime
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN addgroup --system kite && adduser --system --ingroup kite kite

COPY --from=builder /app/dist/backend/ ./
RUN pnpm install --prod --frozen-lockfile

USER kite
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "main.js"]
