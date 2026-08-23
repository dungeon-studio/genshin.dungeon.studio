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

CURRENT_SHA=$(git -C "$REPO_ROOT" rev-parse --short HEAD)

# Firebase reports a release complete before every CDN edge serves it, so the
# first read of version.json can still carry the previous deploy's SHA. Poll
# until the expected SHA appears rather than calling propagation lag a failed
# deploy.
for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  [ "$attempt" -eq 1 ] || sleep "$SLEEP_SECONDS"

  DEPLOYED=$(curl -fsSL "$DOMAIN/version.json" | jq -r '.sha') || DEPLOYED=''

  if [ "$CURRENT_SHA" = "$DEPLOYED" ]; then
    exit 0
  fi
done

echo "SHA mismatch after $MAX_ATTEMPTS attempts: deployed=${DEPLOYED:-} current=$CURRENT_SHA" >&2
exit 1
