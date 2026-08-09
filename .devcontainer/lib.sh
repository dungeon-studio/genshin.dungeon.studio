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
# Provisioned tools
# ---------------------------------------------------------------------------

# Every tool the container provisions, whether a devcontainer.json feature or a
# postCreateCommand.sh step installed it, as "label|version command". Both
# reports read this list, so a new tool costs one line here and nothing else.
TOOLS=(
  "node|node --version"
  "pnpm|pnpm --version"
  "docker|docker --version"
  "gh|gh --version"
  "gcloud|gcloud --version"
  "terraform|terraform version"
  "java|java -version"
  "pre-commit|pre-commit --version"
  "reuse|reuse --version"
  "vale|vale --version"
  "lychee|lychee --version"
  "firebase|firebase --version"
  "playwright|pnpm --filter @genshin/e2e exec playwright --version"
)

# Applies a reporting function to every tool. Takes verify or print_version,
# which share a (label, command...) signature. A loop rather than a pipeline
# because verify appends to FAILURES, and a subshell would discard that.
for_each_tool() {
  local action="$1"
  local entry label command argv
  for entry in "${TOOLS[@]}"; do
    IFS='|' read -r label command <<< "${entry}"
    read -ra argv <<< "${command}"
    "${action}" "${label}" "${argv[@]}"
  done
}

# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

report_verification() {
  step "Verifying installed tools"

  for_each_tool verify

  # Outside the table: the browsers report no version of their own, so
  # `install --list` is the only evidence they reached the disk.
  verify "playwright-browsers" pnpm --filter @genshin/e2e exec playwright install --list
}

report_versions() {
  step "Environment versions"

  for_each_tool print_version
}

report_status() {
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

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

# The closing block both lifecycle scripts share. Suppresses `set -x` tracing
# for its duration so the formatted output stays readable, then restores
# whatever the caller had set.
run_report() {
  local xtrace
  xtrace="$(shopt -po xtrace 2>/dev/null)" || true
  { set +x; } 2>/dev/null

  report_verification
  report_versions
  report_status

  eval "${xtrace}"
}
