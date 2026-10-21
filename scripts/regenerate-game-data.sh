#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
# SPDX-License-Identifier: MIT

set -euo pipefail
set -x

pnpm exec turbo run build --filter=@genshin/game-data-codegen --output-logs=errors-only
node tools/game-data-codegen/dist/cli.js all

# The committed modules are Prettier-formatted; the generators' output isn't.
pnpm exec prettier --write --log-level=warn packages/game-data/src/*.generated.ts
