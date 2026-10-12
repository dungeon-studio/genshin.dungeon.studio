#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

pnpm --filter @genshin/game-data-codegen update --latest genshin-db

# A new character aborts `generate all` until the debut table dates them, so
# the table refreshes first. regenerate-game-data.sh then rebuilds the codegen
# around it and formats every generated module, resonances included.
pnpm exec turbo run build --filter=@genshin/game-data-codegen --output-logs=errors-only
node tools/game-data-codegen/dist/cli.js first-banner-dates
node tools/game-data-codegen/dist/cli.js resonances --commit HEAD

scripts/regenerate-game-data.sh
