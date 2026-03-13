# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

ARG COREPACK_VERSION=0.34.6
ARG PNPM_VERSION=9.15.4

# Build stage
FROM node:25.8.1-slim AS builder

ARG COREPACK_VERSION
ARG PNPM_VERSION

WORKDIR /app

ENV CI=true

RUN rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg && \
    npm install -g corepack@${COREPACK_VERSION} && \
    corepack enable && \
    corepack prepare pnpm@${PNPM_VERSION} --activate

# Copy manifests for all workspace packages so pnpm resolves the full dependency graph
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/game-data/package.json ./packages/game-data/

RUN pnpm install --frozen-lockfile

# Copy source and build — turbo handles dependency ordering via ^build
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm turbo run build --filter=@genshin/api

# Install production-only dependencies
RUN pnpm install --prod --frozen-lockfile

# Production stage
FROM node:25.8.1-slim

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/packages/game-data ./packages/game-data

EXPOSE 8080

USER node

CMD ["node", "apps/api/dist/main.js"]
