#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

BASE_URL="${1:?Error: base URL is required as first argument}"

EXPECTED_SHA="${GITHUB_SHA:-$(git -C "$REPO_ROOT" rev-parse HEAD)}"
HEALTH_BEARER_TOKEN="${HEALTH_BEARER_TOKEN:-}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-10}"
SLEEP_SECONDS="${SLEEP_SECONDS:-3}"

for ATTEMPT in $(seq 1 "$MAX_ATTEMPTS"); do
	CURL_ARGS=(-fsSL)
	if [ -n "$HEALTH_BEARER_TOKEN" ]; then
		CURL_ARGS+=(-H "Authorization: Bearer ${HEALTH_BEARER_TOKEN}")
	fi

	HEALTH_RESPONSE=$(curl "${CURL_ARGS[@]}" "$BASE_URL/health") && break

	if [ "$ATTEMPT" -eq "$MAX_ATTEMPTS" ]; then
		echo "Health check failed after ${MAX_ATTEMPTS} attempts" >&2
		exit 1
	fi

	sleep "$SLEEP_SECONDS"
done

HEALTH_STATUS=$(jq -r '.status' <<< "$HEALTH_RESPONSE")
DEPLOYED_SHA=$(jq -r '.sha' <<< "$HEALTH_RESPONSE")

[ "$HEALTH_STATUS" = "ok" ] || { echo "Unexpected health status: $HEALTH_STATUS" >&2; exit 1; }
[ "$DEPLOYED_SHA" = "$EXPECTED_SHA" ] || { echo "SHA mismatch: deployed=$DEPLOYED_SHA expected=$EXPECTED_SHA" >&2; exit 1; }
