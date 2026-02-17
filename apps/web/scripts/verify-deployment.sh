#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

DOMAIN="${1:?Error: domain URL is required as first argument}"

CURRENT_SHA=$(git -C "$REPO_ROOT" rev-parse --short HEAD)
DEPLOYED=$(curl -fsSL "$DOMAIN/version.json" | jq -r '.sha')

[ "$CURRENT_SHA" = "$DEPLOYED" ] || { echo "SHA mismatch: deployed=$DEPLOYED current=$CURRENT_SHA" >&2; exit 1; }
