<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# How to regenerate brand assets

Regenerate the environment-badged icons and the link preview after changing a
source mark or adding an environment. The generator builds them from two source
marks in `apps/web/public/`: `icon-512x512.png` and `favicon-32x32-dark.png`.

For the prompts behind the source marks, see
[`apps/web/provenance/icon-source.md`](../../apps/web/provenance/icon-source.md).

## Prerequisites

- `uv`
- DejaVu Sans Bold at `/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`

## Steps

1. When adding or recoloring an environment, edit `BADGES` in
   `apps/web/scripts/generate-brand-assets.py` to match the environment table
   in `apps/web/src/lib/environments.ts`. Nothing checks that the two agree.

2. Run the generator from the repository root:

   ```shell
   uv run apps/web/scripts/generate-brand-assets.py
   ```

3. Commit the regenerated files under `apps/web/public/`.
