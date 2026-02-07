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

# Copy root workspace files for pnpm
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copy workspace and app to run pnpm in production mode
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

# Install production dependencies only (this won't need workspace packages)
RUN pnpm install -r --prod --frozen-lockfile

# Copy built files (overwrite with fresh build from builder)
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 8080

USER node

CMD ["node", "apps/api/dist/main.js"]
