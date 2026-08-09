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
  if "$@" >/dev/null 2>&1; then
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

# The lifecycle scripts run under `set -x`, which drowns these reports in trace
# output. `shopt -po` prints the command that restores the caller's setting,
# whatever it was.
quietly() {
  local restore
  restore="$(shopt -po xtrace 2>/dev/null)" || true
  { set +x; } 2>/dev/null
  "$@"
  eval "${restore}"
}

# Verification and the version summary have to cover the same tools; one list
# is what stops them drifting apart.
for_each_tool() {
  local action="$1"
  "${action}" "node" node --version
  "${action}" "pnpm" pnpm --version
  "${action}" "gcloud" gcloud --version
  "${action}" "pre-commit" pre-commit --version
  "${action}" "reuse" reuse --version
  "${action}" "lychee" lychee --version
  "${action}" "firebase" firebase --version
  "${action}" "playwright" pnpm --filter @genshin/e2e exec playwright --version
}

# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

check_tools() {
  step "Verifying installed tools"

  for_each_tool verify
  # The browsers install separately from the CLI and report no version, so
  # only an install check can see them.
  verify "playwright-browsers" pnpm --filter @genshin/e2e exec playwright install --list
}

run_verification() {
  quietly check_tools
}

# ---------------------------------------------------------------------------
# Version summary
# ---------------------------------------------------------------------------

show_versions() {
  step "Environment versions"

  for_each_tool print_version
}

run_version_summary() {
  quietly show_versions
}

# ---------------------------------------------------------------------------
# Final status
# ---------------------------------------------------------------------------

show_status() {
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
}

run_status() {
  quietly show_status
}
