#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Shared helpers for DevContainer lifecycle scripts.
# Source this file; do not execute it directly.

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

FAILURES=()

step() {
  echo ""
  echo "===> $1"
  echo ""
}

verify() {
  local label="$1"
  shift
  if "$@" > /dev/null 2>&1; then
    echo "  [ok] ${label}"
  else
    echo "  [FAIL] ${label}"
    FAILURES+=("${label}")
  fi
}

print_version() {
  local label="$1"
  shift
  local version
  version="$("$@" 2>&1 | head -1)" || true
  echo "  ${label}: ${version}"
}

# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

run_verification() {
  local _xtrace
  _xtrace="$(shopt -po xtrace 2>/dev/null)" || true
  { set +x; } 2>/dev/null
  step "Verifying installed tools"

  verify "node"                 node --version
  verify "pnpm"                 pnpm --version
  verify "gcloud"               gcloud --version
  verify "pre-commit"           pre-commit --version
  verify "reuse"                reuse --version
  verify "firebase"             firebase --version
  verify "playwright-cli"       npx --yes playwright --version
  verify "playwright-browsers"  npx --yes playwright install --list
  eval "${_xtrace}"
}

# ---------------------------------------------------------------------------
# Version summary
# ---------------------------------------------------------------------------

run_version_summary() {
  local _xtrace
  _xtrace="$(shopt -po xtrace 2>/dev/null)" || true
  { set +x; } 2>/dev/null
  step "Environment versions"

  print_version "node"       node --version
  print_version "pnpm"       pnpm --version
  print_version "gcloud"     gcloud --version
  print_version "pre-commit" pre-commit --version
  print_version "reuse"      reuse --version
  print_version "firebase"   firebase --version
  print_version "playwright" npx --yes playwright --version
  eval "${_xtrace}"
}

# ---------------------------------------------------------------------------
# Final status
# ---------------------------------------------------------------------------

run_status() {
  local _xtrace
  _xtrace="$(shopt -po xtrace 2>/dev/null)" || true
  { set +x; } 2>/dev/null
  echo ""
  if [[ ${#FAILURES[@]} -gt 0 ]]; then
    echo "Setup completed with failures:"
    for f in "${FAILURES[@]}"; do
      echo "  - ${f}"
    done
    echo ""
    echo "Fix the issues above and re-run this script, or check docs/how-tos/manual-setup.md."
    exit 1
  fi

  echo "Setup complete — all tools verified."
  eval "${_xtrace}"
}
