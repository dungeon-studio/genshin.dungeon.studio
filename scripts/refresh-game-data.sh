#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

pnpm --filter @genshin/game-data-codegen update --latest genshin-db

# The debut table refreshes before `generate all`, which aborts on an undated
# character. Resonances generate before regenerate-game-data.sh so its
# formatting pass covers them.
pnpm exec turbo run build --filter=@genshin/game-data-codegen --output-logs=errors-only
node tools/game-data-codegen/dist/cli.js first-banner-dates
node tools/game-data-codegen/dist/cli.js resonances --commit HEAD

scripts/regenerate-game-data.sh
