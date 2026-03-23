# =========================
# 1) Builder (pnpm + monorepo)
# =========================
FROM node:20-slim AS builder
WORKDIR /repo
ENV CI=1
RUN corepack enable

# (A) lockfiles first for cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm fetch --frozen-lockfile

# (B) copy only what's needed for this app and any internal packages it imports
COPY packages/ ./packages
COPY apps/app-remix/ ./apps/app-remix

# Install all deps (no-frozen because we only have a subset of monorepo)
RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @repo/prisma run generate

WORKDIR /repo/apps/app-remix

# (E) build the Remix app (creates /repo/apps/app-remix/build)
RUN pnpm run build

# =========================
# 2) Runtime (tiny & non-root)
# =========================
FROM node:20-slim AS runtime

# Keep monorepo structure so paths resolve correctly
WORKDIR /repo

# runtime tools (curl for healthcheck)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# good defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# non-root user
RUN groupadd -r nodegrp && useradd -r -g nodegrp nodeusr

# Copy monorepo structure exactly as it was in builder
# 1. Root node_modules (has all deps including prisma CLI)
COPY --chown=nodeusr:nodegrp --from=builder /repo/node_modules ./node_modules

# 2. Packages (includes @repo/prisma with schema and generated client)
COPY --chown=nodeusr:nodegrp --from=builder /repo/packages ./packages

# 3. The app itself (build output + package.json)
COPY --chown=nodeusr:nodegrp --from=builder /repo/apps/app-remix/build ./apps/app-remix/build
COPY --chown=nodeusr:nodegrp --from=builder /repo/apps/app-remix/public ./apps/app-remix/public
COPY --chown=nodeusr:nodegrp --from=builder /repo/apps/app-remix/package.json ./apps/app-remix/package.json

# Symlink node_modules to app dir (mimics pnpm hoisting)
RUN ln -s /repo/node_modules /repo/apps/app-remix/node_modules

# Add node_modules/.bin to PATH (so prisma CLI is found)
ENV PATH="/repo/node_modules/.bin:$PATH"

USER nodeusr

# Work from the app directory
WORKDIR /repo/apps/app-remix

EXPOSE 3000

# healthcheck (expects /health to return 200)
HEALTHCHECK --interval=60s --timeout=10s --retries=4 --start-period=100s \
  CMD curl --fail --silent http://0.0.0.0:3000/health || exit 1

# start command (uses your app's prod script)
CMD ["npm", "run", "docker-start"]

