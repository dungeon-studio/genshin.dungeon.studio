#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

pnpm exec turbo run build --filter=@genshin/game-data-codegen --output-logs=errors-only

modules=(packages/game-data/src/*.generated.ts)

# A generated module's basename is the subcommand that rewrites it.
for module in "${modules[@]}"; do
  node tools/game-data-codegen/dist/cli.js "$(basename "${module}" .generated.ts)"
done

# The generators emit unformatted source, so committed modules only match
# after Prettier.
pnpm exec prettier --write --log-level=warn "${modules[@]}"
