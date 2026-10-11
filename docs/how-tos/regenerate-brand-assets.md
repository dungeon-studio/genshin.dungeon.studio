<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# How to regenerate brand assets

Regenerate the environment-badged icons and the link preview after changing
`apps/web/src/lib/environments.json` or a source mark: `icon-512x512.png` or
`favicon-32x32-dark.png` in `apps/web/public/`. The `brand-assets` pre-commit
hook fails until you do.

For the prompts behind the source marks, see
[`apps/web/provenance/icon-source.md`](../../apps/web/provenance/icon-source.md).

## Prerequisites

- `uv`
- DejaVu Sans Bold at `/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`

## Steps

1. Run the generator from the repository root:

   ```shell
   uv run apps/web/scripts/generate-brand-assets.py
   ```

2. Commit the regenerated files under `apps/web/public/`.
