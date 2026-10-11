<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# How to regenerate brand assets

Regenerate the environment-badged icons and the link preview after changing a
source mark or `apps/web/src/lib/environments.json`, which supplies each
badge's suffix, glyph, and color. The `brand-assets` pre-commit hook fails until
the committed assets match. The generator builds them from two source marks in
`apps/web/public/`: `icon-512x512.png` and `favicon-32x32-dark.png`.

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
