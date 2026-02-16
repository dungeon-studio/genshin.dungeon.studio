#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

DOMAIN="${1:?Error: domain URL is required as first argument}"

CURRENT_SHA=$(git rev-parse --short HEAD)
DEPLOYED=$(curl -fsSL "$DOMAIN/version.json" | jq -r '.sha')

[ "$CURRENT_SHA" = "$DEPLOYED" ] || { echo "SHA mismatch: deployed=$DEPLOYED current=$CURRENT_SHA" >&2; exit 1; }
