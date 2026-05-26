#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-api-smoke}"
IMAGE_TAG="${IMAGE_TAG:-api-smoke:test}"
PORT="${PORT:-8080}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-http://localhost:5173}"
HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-15}"

docker run -d --name "$CONTAINER_NAME" \
  -e PORT="$PORT" \
  -e FRONTEND_ORIGIN="$FRONTEND_ORIGIN" \
  -p "$PORT:$PORT" \
  "$IMAGE_TAG"

for i in $(seq 1 "$HEALTH_TIMEOUT_SECONDS"); do
  if curl -fsSL "http://localhost:$PORT/health" > /dev/null 2>&1; then
    echo "Health check passed on attempt $i"
    break
  fi
  if [ "$i" -eq "$HEALTH_TIMEOUT_SECONDS" ]; then
    echo "Container failed to respond after $HEALTH_TIMEOUT_SECONDS seconds"
    docker logs "$CONTAINER_NAME"
    exit 1
  fi
  sleep 1
done

curl -fsSL "http://localhost:$PORT/health" | jq -e '.status == "ok"'
