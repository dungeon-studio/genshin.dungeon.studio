#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

require() {
  local kind="$1" path="$2"
  test "${kind}" "${path}" || {
    echo "${path} not found" >&2
    exit 1
  }
}

require -d apps/web/dist
require -f apps/web/dist/index.html
require -d apps/web/dist/assets
require -f apps/web/dist/version.json
require -f apps/web/dist/robots.txt
require -f apps/web/dist/sitemap.xml
