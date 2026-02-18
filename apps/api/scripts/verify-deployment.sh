#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

BASE_URL="${1:?Error: base URL is required as first argument}"

EXPECTED_SHA="${GITHUB_SHA:-$(git -C "$REPO_ROOT" rev-parse HEAD)}"

HEALTH_STATUS=$(curl -fsSL "$BASE_URL/health" | jq -r '.status')
DEPLOYED_SHA=$(curl -fsSL "$BASE_URL/health" | jq -r '.sha')

[ "$HEALTH_STATUS" = "ok" ] || { echo "Unexpected health status: $HEALTH_STATUS" >&2; exit 1; }
[ "$DEPLOYED_SHA" = "$EXPECTED_SHA" ] || { echo "SHA mismatch: deployed=$DEPLOYED_SHA expected=$EXPECTED_SHA" >&2; exit 1; }
