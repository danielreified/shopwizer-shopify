# =========================
# 1) Builder: install & build
# =========================
FROM node:20-slim AS builder
WORKDIR /repo
ENV CI=1
RUN corepack enable

# Multi-arch compatibility (just in case)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Lockfiles first (best cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm fetch --frozen-lockfile

# Copy shared scripts, packages, and this service
COPY scripts/esbuild-service.mjs ./scripts/
COPY packages/ ./packages
COPY apps/service-events/ ./apps/service-events

# Install all deps (no-frozen because we only have a subset of monorepo)
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @repo/prisma run generate

# Build api-client package (required by service-enrich)
RUN pnpm --filter @repo/api-client run build

# Build with esbuild (bundles @repo/* into single file)
WORKDIR /repo/apps/service-events
RUN pnpm run build

# =========================
# 2) Runtime (slim - only what's needed)
# =========================
FROM node:20-slim AS runtime

# Install runtime deps (curl for healthcheck)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN groupadd -r nodegrp && useradd -r -g nodegrp nodeusr

WORKDIR /app

# Only copy what's needed for runtime:
# 1. The bundled dist (esbuild output)
COPY --chown=nodeusr:nodegrp --from=builder /repo/apps/service-events/dist ./dist

# 2. Root node_modules (for external deps like fastembed, prisma, onnxruntime)
COPY --chown=nodeusr:nodegrp --from=builder /repo/node_modules ./node_modules

# 3. Packages (for generated Prisma client and other runtime artifacts)
COPY --chown=nodeusr:nodegrp --from=builder /repo/packages ./packages

# 4. Package files for Node resolution
COPY --chown=nodeusr:nodegrp --from=builder /repo/apps/service-events/package.json ./package.json

USER nodeusr

EXPOSE 3000

HEALTHCHECK --interval=60s --timeout=10s --retries=4 --start-period=100s \
  CMD curl --fail --silent --show-error http://0.0.0.0:3000/health || exit 1

CMD ["node", "dist/main.js"]
