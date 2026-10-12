#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

pnpm --filter @genshin/game-data-codegen update --latest genshin-db

# A new character aborts `generate all` until the debut table dates them, so
# the table refreshes first and the codegen rebuilds around it.
pnpm exec turbo run build --filter=@genshin/game-data-codegen --output-logs=errors-only
node tools/game-data-codegen/dist/cli.js first-banner-dates
pnpm exec prettier --write --log-level=warn tools/game-data-codegen/src/first-banner-dates.generated.ts

scripts/regenerate-game-data.sh

commit=$(git ls-remote https://github.com/DimbreathBot/AnimeGameData HEAD | cut -f1)
node tools/game-data-codegen/dist/cli.js resonances --commit "${commit:?no AnimeGameData HEAD}"
pnpm exec prettier --write --log-level=warn packages/game-data/src/resonances.generated.ts
