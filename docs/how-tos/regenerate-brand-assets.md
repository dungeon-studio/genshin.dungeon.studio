<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# How to regenerate brand assets

Regenerate the environment-badged icons and the link preview after changing any
of these files. The `brand-assets` pre-commit hook fails until you do.

- `apps/web/src/lib/environments.json`
- `apps/web/public/icon-512x512.png`
- `apps/web/public/favicon-32x32-dark.png`

For the prompts behind both icons, see
[`apps/web/provenance/icon-source.md`](../../apps/web/provenance/icon-source.md).

## Prerequisites

- Workspace dependencies installed with `pnpm install`
- DejaVu Sans Bold at `/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`

## Steps

1. Run the generator from the repository root:

   ```shell
   pnpm --filter @genshin/web brand-assets
   ```

2. Commit the regenerated files under `apps/web/public/`.
