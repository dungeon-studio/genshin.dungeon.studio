# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

ARG COREPACK_VERSION=0.34.6

# Build stage
FROM node:24.18.0-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS builder

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
FROM node:24.18.0-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d

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

# The base image's node user; hosts verifying non-root cannot resolve the name
USER 1000:1000

CMD ["node", "apps/api/dist/main.js"]
