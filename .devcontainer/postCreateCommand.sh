#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "${SCRIPT_DIR}" rev-parse --show-toplevel)"
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

step "Installing pnpm via corepack"

corepack enable
corepack install

step "Installing Google Cloud SDK"

curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor --batch --yes -o /usr/share/keyrings/cloud.google.gpg &&
  echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list &&
  sudo DEBIAN_FRONTEND=noninteractive apt-get update &&
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y google-cloud-sdk

step "Installing project dependencies"

pnpm install

step "Installing pre-commit hooks"

pre-commit install

step "Installing reuse-tool for SPDX license compliance"

"${REPO_ROOT}/scripts/install-reuse.sh"

step "Installing lychee link checker"

# renovate: datasource=github-releases depName=lycheeverse/lychee extractVersion=^lychee-v(?<version>.+)$
LYCHEE_VERSION="0.24.2"
LYCHEE_DIR=lychee-x86_64-unknown-linux-gnu
curl -fsSL \
  "https://github.com/lycheeverse/lychee/releases/download/lychee-v${LYCHEE_VERSION}/${LYCHEE_DIR}.tar.gz" |
  sudo tar -xz -C /usr/local/bin --strip-components=1 "${LYCHEE_DIR}/lychee"
sudo chmod +x /usr/local/bin/lychee

step "Installing Playwright Chromium and Chrome"

# Through the workspace, so the browsers match the @playwright/test version
# tools/e2e pins — the one the suite and the CI job run. The Playwright MCP
# server uses them too.
pnpm --filter @genshin/e2e exec playwright install --with-deps chromium chrome

run_verification
run_version_summary
run_status
