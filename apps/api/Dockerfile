# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Build stage
FROM node:20.18.1-slim AS builder

WORKDIR /app

# Enable Corepack to use pnpm version from package.json
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace configuration and package manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy only API package.json to maximize Docker layer cache reuse
COPY apps/api/package.json ./apps/api/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy API source after dependencies are installed
COPY apps/api ./apps/api

# Build the API
RUN pnpm --filter @genshin/api build

# Production dependencies stage
FROM node:20.18.1-slim AS deps

WORKDIR /app

# Enable Corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy root workspace files for pnpm to read the lockfile
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copy API package manifest for production dependency installation
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Install production dependencies only for @genshin/api using the lockfile
RUN pnpm install --filter @genshin/api --prod --frozen-lockfile

# Production stage
FROM node:20.18.1-slim

WORKDIR /app

ENV NODE_ENV=production

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy built files
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 8080

USER node

CMD ["node", "apps/api/dist/main.js"]
