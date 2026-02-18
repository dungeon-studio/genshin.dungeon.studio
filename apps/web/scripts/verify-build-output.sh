#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# Verify build artifacts exist and have expected structure
test -d apps/web/dist || { echo "dist directory not found" >&2; exit 1; }
test -f apps/web/dist/index.html || { echo "index.html not found" >&2; exit 1; }
test -d apps/web/dist/assets || { echo "assets directory not found" >&2; exit 1; }
test -f apps/web/dist/version.json || { echo "version.json not found" >&2; exit 1; }
