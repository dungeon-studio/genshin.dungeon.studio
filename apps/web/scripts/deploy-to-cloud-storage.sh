#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

BUCKET_NAME="${1:?Error: bucket name is required as first argument}"

# Sync files with bucket (upload new/changed, delete stale)
gsutil -m rsync -r -d apps/web/dist "gs://${BUCKET_NAME}/"

# HTML: Revalidate-based caching strategy
# - no-cache: Forces browser/CDN to validate with server before reusing cached response
# - stale-while-revalidate: Serves stale HTML for up to 1 day while revalidating in background
#   (improves perceived performance if server is temporarily unreachable)
# - public: Allows CDNs and proxies to cache (safe for public content)
# - ETag: Cloud Storage auto-generates; enables efficient 304 Not Modified responses
# Modern browsers universally support this; HTTP/1.0 is extinct (no max-age needed)
gsutil -m setmeta -h "Cache-Control:public, no-cache, stale-while-revalidate=86400" "gs://${BUCKET_NAME}/**/*.html"

# Version metadata: Revalidate on every request
# - no-cache: Forces browser/CDN to validate with server before reusing cached response
# - public: Cacheable by CDNs and proxies
# Ensures verify-deployment.sh always fetches the current deployed version
gsutil -m setmeta -h "Cache-Control:public, no-cache" "gs://${BUCKET_NAME}/version.json"

# Assets: Aggressive immutable caching
# - max-age=31536000: Cache for 1 year (31,536,000 seconds)
# - immutable: Tell browsers not to revalidate assets (only used if fresh per max-age)
# - public: Cacheable by CDNs and proxies
# Safe because Vite includes content hash in filenames (e.g., app.abc123.js)
# New versions get new URLs, so cache invalidation is automatic (cache-busting pattern)
gsutil -m setmeta -r -h "Cache-Control:public, max-age=31536000, immutable" "gs://${BUCKET_NAME}/assets/"
