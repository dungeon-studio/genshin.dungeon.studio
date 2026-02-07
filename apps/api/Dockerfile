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

# Prune to production dependencies only
RUN pnpm --filter @genshin/api --prod deploy pruned

# Production stage
FROM node:20.18.1-slim

WORKDIR /app

ENV NODE_ENV=production

# Copy built files and production dependencies
COPY --from=builder /app/pruned/dist ./dist
COPY --from=builder /app/pruned/package.json ./
COPY --from=builder /app/pruned/node_modules ./node_modules

EXPOSE 8080

USER node

CMD ["node", "dist/main.js"]
