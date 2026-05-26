#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "${SCRIPT_DIR}" rev-parse --show-toplevel)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

# ---------------------------------------------------------------------------
# 1. Package manager
# ---------------------------------------------------------------------------
step "Installing pnpm via corepack"

corepack enable
corepack install

# ---------------------------------------------------------------------------
# 2. Google Cloud SDK
# ---------------------------------------------------------------------------
step "Installing Google Cloud SDK"

curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg && \
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list && \
sudo apt-get update && sudo apt-get install -y google-cloud-sdk

# ---------------------------------------------------------------------------
# 3. Project dependencies
# ---------------------------------------------------------------------------
step "Installing project dependencies"

pnpm install

# ---------------------------------------------------------------------------
# 4. Pre-commit hooks
# ---------------------------------------------------------------------------
step "Installing pre-commit hooks"

pre-commit install

# ---------------------------------------------------------------------------
# 5. SPDX license compliance checker
# ---------------------------------------------------------------------------
step "Installing reuse-tool"

"${REPO_ROOT}/scripts/install-reuse.sh"

# ---------------------------------------------------------------------------
# 6. Playwright browsers (for Playwright MCP server)
# ---------------------------------------------------------------------------
step "Installing Playwright Chromium and Chrome"

npx --yes playwright install --with-deps chromium chrome

# ---------------------------------------------------------------------------
# Verify and report
# ---------------------------------------------------------------------------

run_verification
run_version_summary
run_status
