#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Fails when a pre-commit hook passes a fixture it must flag. A hook update
# that narrows what the hook checks still passes on a clean tree; it can't pass
# on a tree built to fail it.
#
# Each case under tests/hook-canaries/<hook-id>/ is named by <case>.expect, an
# extended regex the hook's output must match, so a hook failing for an
# unrelated reason doesn't count. <case>/ is overlaid on a scratch copy of the
# staged tree. <case>.sh runs in that copy, for fixtures git can't store or
# that secret scanners would flag.
set -euo pipefail
set -x

root=$(git rev-parse --show-toplevel)
canaries="${root}/tests/hook-canaries"
scratch=$(mktemp -d)
trap 'rm -rf "${scratch}"' EXIT

base="${scratch}/base"
git -C "${root}" checkout-index --all --prefix="${base}/"

# A commit hook's environment points git at the real repository's index.
unset GIT_DIR GIT_INDEX_FILE GIT_WORK_TREE
export GIT_AUTHOR_NAME=canary GIT_AUTHOR_EMAIL=canary@localhost
export GIT_COMMITTER_NAME=canary GIT_COMMITTER_EMAIL=canary@localhost
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=commit.gpgsign GIT_CONFIG_VALUE_0=false

# Committing the base leaves only the fixture staged, which is what
# `pre-commit run` checks, and gives hooks that diff against HEAD a history.
git -C "${base}" init --quiet --initial-branch=canary
git -C "${base}" add --all
git -C "${base}" commit --quiet --message=base

failures=()

# Every hook from a third-party repository needs a canary, so a new hook can't
# join without one.
while read -r id; do
  [[ -d "${canaries}/${id}" ]] || failures+=("${id}: no canary")
done < <(awk '
  /^  - repo:/ { local = ($3 == "local") }
  /^      - id:/ && !local { print $3 }
' "${root}/.pre-commit-config.yaml")

for expect in "${canaries}"/*/*.expect; do
  id=$(basename "$(dirname "${expect}")")
  case=$(basename "${expect}" .expect)
  fixture="${expect%.expect}"
  tree="${scratch}/${id}-${case}"

  cp -a "${base}" "${tree}"
  if [[ -d "${fixture}" ]]; then
    cp -a "${fixture}/." "${tree}/"
  fi
  if [[ -f "${fixture}.sh" ]]; then
    (cd "${tree}" && "${fixture}.sh")
  fi
  git -C "${tree}" add --all

  log="${tree}.log"
  if (cd "${tree}" && pre-commit run "${id}" --color=never) >"${log}" 2>&1; then
    failures+=("${id}/${case}: hook passed")
  elif ! grep -Eq -f "${expect}" "${log}"; then
    failures+=("${id}/${case}: output doesn't match ${expect#"${root}/"}")
  else
    continue
  fi
  cat "${log}"
done

if ((${#failures[@]})); then
  printf 'Canary failed: %s\n' "${failures[@]}" >&2
  exit 1
fi
