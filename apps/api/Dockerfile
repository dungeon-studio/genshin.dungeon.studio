# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Define versions for Corepack and pnpm to ensure consistency across all stages
ARG COREPACK_VERSION=0.34.6
ARG PNPM_VERSION=9.15.4

# Base stage to install Corepack and configure pnpm
FROM node:25.6.1-slim AS corepack-base

# Pass ARGs to this stage
ARG COREPACK_VERSION
ARG PNPM_VERSION

# Install Corepack (not bundled in Node.js 25+) and enable it with the pinned pnpm version
# Remove leftover Yarn 1.x symlinks from the base image to avoid conflicts
RUN rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg && \
    npm install -g corepack@${COREPACK_VERSION} && \
    corepack enable && \
    corepack prepare pnpm@${PNPM_VERSION} --activate

# Build stage
FROM corepack-base AS builder

WORKDIR /app

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
FROM corepack-base AS deps

WORKDIR /app

# Copy root workspace files for pnpm to read the lockfile
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copy API package manifest for production dependency installation
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Install production dependencies only for @genshin/api using the lockfile
RUN pnpm install --filter @genshin/api --prod --frozen-lockfile

# Production stage
FROM node:25.6.1-slim

WORKDIR /app

# Default to production environment; can be overridden at runtime if needed
ENV NODE_ENV=production

# Default application port; can be overridden at runtime (e.g., -e PORT=3000)
ENV PORT=8080

# Define a basic health check for the running API
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || '8080') + '/health', res => { if (res.statusCode !== 200) process.exit(1); }).on('error', () => process.exit(1));"

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy package.json (needed for ES module support and version reading)
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Copy built files
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Ensure the node user has ownership of the application files
RUN chown -R node:node /app

# Expose the application port; configurable via the PORT environment variable
EXPOSE ${PORT}

USER node

CMD ["node", "apps/api/dist/main.js"]
