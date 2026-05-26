#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Install reuse-tool via pipx.
#
# Used by both the DevContainer post-create script and the
# devcontainer-validate workflow so the installed version stays in lockstep.
# Idempotent: skips when the requested version is already on PATH.

set -euo pipefail

REUSE_VERSION="${REUSE_VERSION:-6.2.0}"

if command -v reuse > /dev/null 2>&1; then
  installed="$(reuse --version 2>/dev/null | awk '{print $NF}')"
  if [[ "${installed}" == "${REUSE_VERSION}" ]]; then
    echo "reuse ${REUSE_VERSION} already installed; skipping."
    exit 0
  fi
  echo "reuse ${installed} present; replacing with ${REUSE_VERSION}."
  pipx uninstall reuse > /dev/null
fi

pipx install "reuse==${REUSE_VERSION}"
