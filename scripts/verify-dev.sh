#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Smoke-test the local dev stack: start `pnpm dev` and confirm the web server,
# API server, and Firebase emulators all come up. Complements the production
# checks in apps/{web,api}/scripts/verify-deployment.*. Needs Java on PATH: the
# Firebase emulators run on the JVM.

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

TIMEOUT="${TIMEOUT_SECONDS:-30}"

LOG=$(mktemp)

# Job control puts the backgrounded stack in its own process group (PGID equal
# to its PID), so cleanup can signal every child (firebase, the turbo `dev`
# tasks, vite, tsx) in one shot rather than just the `pnpm` parent.
set -m
pnpm dev >"$LOG" 2>&1 &
DEV_PGID=$!

cleanup() {
  kill -TERM -"$DEV_PGID" 2>/dev/null || true
  wait "$DEV_PGID" 2>/dev/null || true
  rm -f "$LOG"
}
trap cleanup EXIT

dump_log() {
  echo "----- pnpm dev output -----" >&2
  cat "$LOG" >&2
}

# True when a probe means the service is up and meets expectations. curl reports
# an empty code (or 000) while the connection is refused, so a real status code
# means something answered; expect_code and expect_body, when set, additionally
# demand a specific status and a body substring.
response_matches() {
  local code="$1" body="$2" expect_code="$3" expect_body="$4"

  [ -n "$code" ] && [ "$code" != "000" ] || return 1
  [ -z "$expect_code" ] || [ "$code" = "$expect_code" ] || return 1
  [ -z "$expect_body" ] || printf '%s' "$body" | grep -qF "$expect_body" || return 1
}

# Poll a URL until response_matches accepts the reply, or the timeout elapses.
wait_for() {
  local name="$1" url="$2" expect_code="${3:-}" expect_body="${4:-}"
  local deadline=$((SECONDS + TIMEOUT))
  local response body code

  while true; do
    # curl writes the body, then a newline and the status code; split them back
    # apart. On a refused connection curl fails and both stay empty.
    response=$(curl -sS -o - -w '\n%{http_code}' "$url" 2>/dev/null) || response=''
    code=${response##*$'\n'}
    body=${response%$'\n'*}

    if response_matches "$code" "$body" "$expect_code" "$expect_body"; then
      echo "ok: $name ($url)"
      return 0
    fi

    if [ "$SECONDS" -ge "$deadline" ]; then
      echo "error: $name not ready at $url within ${TIMEOUT}s (last status: ${code:-none})" >&2
      dump_log
      return 1
    fi

    sleep 1
  done
}

wait_for 'web dev server' 'http://localhost:5173' 200
wait_for 'API dev server' 'http://localhost:8080/health' 200 '"status":"ok"'

# The emulators expose no readiness route, so a bare liveness check is all we
# assert.
wait_for 'auth emulator' 'http://localhost:9099'
wait_for 'firestore emulator' 'http://localhost:8181'

echo "All dev services responded."
