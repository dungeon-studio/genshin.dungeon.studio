# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

ARG COREPACK_VERSION=0.34.6

# Build stage
FROM node:25.9.0-slim@sha256:81db02c4b671288a03915da9534dbd54f96d0e7c24d80ccc54f5b36b2e684370 AS builder

ARG COREPACK_VERSION

WORKDIR /app

ENV CI=true

# Copy root package.json first so corepack reads packageManager from it
COPY package.json ./

RUN rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg && \
    npm install -g corepack@${COREPACK_VERSION} && \
    corepack enable && \
    corepack install

# Copy remaining manifests so pnpm resolves the full dependency graph
COPY pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/collection-json/package.json ./packages/collection-json/
COPY packages/domain/package.json ./packages/domain/
COPY packages/game-data/package.json ./packages/game-data/
COPY packages/validation/package.json ./packages/validation/

RUN pnpm install --frozen-lockfile

# Copy source, build, then prune to production-only dependencies — turbo
# handles dependency ordering via ^build, and the build must run before
# the prune so dev dependencies are still present.
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm turbo run build --filter=@genshin/api && \
    pnpm install --prod --frozen-lockfile

# Production stage
FROM node:25.9.0-slim@sha256:81db02c4b671288a03915da9534dbd54f96d0e7c24d80ccc54f5b36b2e684370

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/collection-json ./packages/collection-json
COPY --from=builder /app/packages/domain ./packages/domain
COPY --from=builder /app/packages/game-data ./packages/game-data
COPY --from=builder /app/packages/validation ./packages/validation

EXPOSE 8080

USER node

CMD ["node", "apps/api/dist/main.js"]
