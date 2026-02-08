# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Build stage
FROM node:25.6.0-slim AS builder

WORKDIR /app

# Install Corepack (not bundled in Node.js 25+) and enable it with the pinned pnpm version
# --force is required to overwrite leftover Yarn 1.x symlinks in the base image
RUN npm install -g corepack --force && corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace configuration and package manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy only API package.json to maximize Docker layer cache reuse
COPY apps/api/package.json ./apps/api/

# Install dependencies for @genshin/api only (skip unnecessary workspace packages)
RUN pnpm install --filter @genshin/api --frozen-lockfile

# Copy API source after dependencies are installed
COPY apps/api ./apps/api

# Build the API
RUN pnpm --filter @genshin/api build

# Production dependencies stage
FROM node:25.6.0-slim AS deps

WORKDIR /app

# Install Corepack (not bundled in Node.js 25+) and enable it with the pinned pnpm version
# --force is required to overwrite leftover Yarn 1.x symlinks in the base image
RUN npm install -g corepack --force && corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy root workspace files for pnpm to read the lockfile
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copy API package manifest for production dependency installation
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Install production dependencies only for @genshin/api using the lockfile
RUN pnpm install --filter @genshin/api --prod --frozen-lockfile

# Production stage
FROM node:25.6.0-slim

WORKDIR /app

ENV NODE_ENV=production

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy package.json (needed for ES module support and version reading)
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Copy built files
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 8080

USER node

CMD ["node", "apps/api/dist/main.js"]
