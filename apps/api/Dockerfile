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

# Production stage
FROM node:20.18.1-slim

WORKDIR /app

ENV NODE_ENV=production

# Install pnpm for dependency installation
RUN npm install -g pnpm@9.15.4

# Copy root workspace files for pnpm to read the lockfile
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copy API package manifest for production dependency installation
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Install production dependencies only for @genshin/api using the lockfile
RUN pnpm install --filter @genshin/api --prod --frozen-lockfile

# Copy built files
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 8080

USER node

CMD ["node", "apps/api/dist/main.js"]
