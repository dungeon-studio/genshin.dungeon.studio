#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

DOMAIN="${1:?Error: domain URL is required as first argument}"

MAX_ATTEMPTS="${MAX_ATTEMPTS:-20}"
SLEEP_SECONDS="${SLEEP_SECONDS:-3}"

VERSION_URL="$DOMAIN/version.json"
CURRENT_SHA=$(git -C "$REPO_ROOT" rev-parse --short HEAD)

# Empty when the edge answers with no SHA at all. Mid-propagation a request can
# 404, which is a stale edge rather than a failed deploy, so it has to compare
# unequal and be retried instead of aborting the script.
deployed_sha() {
  curl -fsSL "$VERSION_URL" | jq -r '.sha' || true
}

# Firebase reports a release complete before every CDN edge serves it, so the
# first read of version.json can still carry the previous deploy's SHA. Poll
# until the expected SHA appears rather than calling propagation lag a failed
# deploy.
for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  [ "$attempt" -eq 1 ] || sleep "$SLEEP_SECONDS"

  DEPLOYED_SHA=$(deployed_sha)

  if [ "$CURRENT_SHA" = "$DEPLOYED_SHA" ]; then
    exit 0
  fi
done

echo "SHA mismatch after $MAX_ATTEMPTS attempts: deployed=${DEPLOYED_SHA:-} current=$CURRENT_SHA" >&2
exit 1
