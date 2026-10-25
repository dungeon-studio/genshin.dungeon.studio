#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# One pin for every lychee install, so local and CI link checks agree. The
# musl build is static and carries no glibc floor.

set -euo pipefail
set -x

# renovate: datasource=github-releases depName=lycheeverse/lychee extractVersion=^lychee-v(?<version>.+)$
LYCHEE_VERSION="${LYCHEE_VERSION:-0.24.2}"
LYCHEE_DIR=lychee-x86_64-unknown-linux-musl

curl -fsSL \
  "https://github.com/lycheeverse/lychee/releases/download/lychee-v${LYCHEE_VERSION}/${LYCHEE_DIR}.tar.gz" |
  sudo tar -xz -C /usr/local/bin --strip-components=1 "${LYCHEE_DIR}/lychee"
