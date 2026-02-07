# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Build stage
FROM node:20.18.1-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.4

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all package.json files for workspace dependencies
COPY packages/*/package.json ./packages/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages ./packages
COPY apps/api ./apps/api

# Build the API
RUN pnpm --filter @genshin/api build

# Production stage
FROM node:20.18.1-slim

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8080

CMD ["node", "dist/main.js"]
