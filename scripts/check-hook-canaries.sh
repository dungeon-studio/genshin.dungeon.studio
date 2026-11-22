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
shopt -s inherit_errexit
set -x

root=$(git rev-parse --show-toplevel)
canaries="${root}/tests/hook-canaries"
scratch=$(mktemp -d)
trap 'rm -rf "${scratch}"' EXIT
base="${scratch}/base"

# Every hook from a third-party repository needs a canary, so a new hook can't
# join without one.
third_party_hook_ids() {
  awk '
    /^  - repo:/ { local = ($3 == "local") }
    /^      - id:/ && !local { print $3 }
  ' "${root}/.pre-commit-config.yaml"
}

# Commits the staged tree as the base's only commit. That leaves only a case's
# fixture staged, which is what `pre-commit run` checks, and gives hooks that
# diff against HEAD a history.
snapshot_staged_tree() {
  git -C "${root}" checkout-index --all --prefix="${base}/"

  # A commit hook's environment points git at the real repository's index.
  unset GIT_DIR GIT_INDEX_FILE GIT_WORK_TREE
  export GIT_AUTHOR_NAME=canary GIT_AUTHOR_EMAIL=canary@localhost
  export GIT_COMMITTER_NAME=canary GIT_COMMITTER_EMAIL=canary@localhost
  export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=commit.gpgsign GIT_CONFIG_VALUE_0=false

  git -C "${base}" init --quiet --initial-branch=canary
  git -C "${base}" add --all
  git -C "${base}" commit --quiet --message=base
}

build_case_tree() {
  local fixture=$1 tree=$2

  cp -a "${base}" "${tree}"
  if [[ -d "${fixture}" ]]; then
    cp -a "${fixture}/." "${tree}/"
  fi
  if [[ -f "${fixture}.sh" ]]; then
    (cd "${tree}" && "${fixture}.sh")
  fi
  git -C "${tree}" add --all
}

# Prints why the case failed, or nothing when the hook flagged its fixture.
case_failure() {
  local expect=$1
  local id name fixture tree log status=0
  id=$(basename "$(dirname "${expect}")")
  name=$(basename "${expect}" .expect)
  fixture="${expect%.expect}"
  tree="${scratch}/${id}-${name}"
  log="${tree}.log"

  build_case_tree "${fixture}" "${tree}"
  (cd "${tree}" && pre-commit run "${id}" --color=never) >"${log}" 2>&1 || status=$?

  if ((status != 0)) && grep -Eq -f "${expect}" "${log}"; then
    return
  fi

  cat "${log}" >&2
  if ((status == 0)); then
    echo "${id}/${name}: hook passed"
  else
    echo "${id}/${name}: output doesn't match ${expect#"${root}/"}"
  fi
}

snapshot_staged_tree

failures=()
while read -r id; do
  [[ -d "${canaries}/${id}" ]] || failures+=("${id}: no canary")
done < <(third_party_hook_ids)

for expect in "${canaries}"/*/*.expect; do
  failure=$(case_failure "${expect}")
  [[ -z "${failure}" ]] || failures+=("${failure}")
done

if ((${#failures[@]})); then
  printf 'Canary failed: %s\n' "${failures[@]}" >&2
  exit 1
fi
