#!/bin/bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Smoke-test the local dev stack: start `pnpm dev` and confirm the web server,
# API server, and Firebase emulators all come up. Complements the production
# checks in apps/{web,api}/scripts/verify-deployment.*. `pnpm dev` runs the
# Firebase emulators (which need Java on PATH) wrapping `turbo run dev`, whose
# `^build` dependency builds the `@genshin/*` libraries to their `dist/` output
# before the dev servers resolve them.

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

# Poll a URL until it responds, or the timeout elapses. With no expected code
# any HTTP response counts (the service is listening); pass a code and/or a body
# substring to demand more. curl exits non-zero and yields an empty code when
# the connection is refused, so the service is still starting.
wait_for() {
  local name="$1" url="$2" expect_code="${3:-}" expect_body="${4:-}"
  local deadline=$((SECONDS + TIMEOUT))
  local body code

  while true; do
    body=$(curl -sS -o - -w '\n%{http_code}' "$url" 2>/dev/null) || body=''
    code=${body##*$'\n'}
    body=${body%$'\n'*}

    if [ -n "$code" ] && [ "$code" != "000" ] &&
      { [ -z "$expect_code" ] || [ "$code" = "$expect_code" ]; } &&
      { [ -z "$expect_body" ] || printf '%s' "$body" | grep -qF "$expect_body"; }; then
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

# Web: Vite serves the app root with a 200.
wait_for 'web dev server' 'http://localhost:5173' 200

# API: /health reports readiness.
wait_for 'API dev server' 'http://localhost:8080/health' 200 '"status":"ok"'

# Emulators: the root path answers once the emulator is listening.
wait_for 'auth emulator' 'http://localhost:9099'
wait_for 'firestore emulator' 'http://localhost:8181'

echo "All dev services responded."
