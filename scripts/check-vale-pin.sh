#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

# Fails when the Vale pre-commit hook and mise.toml pin different versions.
# Contributors running `vale` directly get mise's, so the two must agree for a
# local run to match the hook.
set -euo pipefail
set -x

hook=$(awk '
  /^  - repo:/ { vale = ($3 == "https://github.com/vale-cli/vale") }
  vale && /^    rev:/ { print $2 }
' .pre-commit-config.yaml)
pin=$(sed -n 's/^"aqua:vale-cli\/vale" = "\(.*\)"$/\1/p' mise.toml)

if [[ "${hook}" != "v${pin}" ]]; then
  printf 'Vale hook rev %s does not match mise.toml pin %s\n' "${hook}" "${pin}" >&2
  exit 1
fi
