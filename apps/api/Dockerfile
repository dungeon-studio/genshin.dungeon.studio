# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Build stage
FROM node:20.18.1-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.4

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace packages with directory structure
COPY packages ./packages
COPY apps/api ./apps/api

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Build the API
RUN pnpm --filter @genshin/api build

# Prune devDependencies
RUN pnpm prune --prod

# Production stage
FROM node:20.18.1-slim

WORKDIR /app

ENV NODE_ENV=production

# Copy package.json files and workspace configuration
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copy production dependencies (pnpm's node_modules structure)
COPY --from=builder /app/node_modules ./node_modules

# Copy needed packages (game-data might be a runtime dependency)
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/packages/game-data ./packages/game-data

# Copy API built files and package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

EXPOSE 8080

USER node

CMD ["node", "apps/api/dist/main.js"]
