<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# How to generate icons

Generate original icon images using Gemini for elements and weapon types. Each
icon has separate light and dark mode variants with transparent backgrounds.
The project avoids official Genshin Impact artwork to prevent copyright issues.

See [Icon design conventions](../reference/icon-design-conventions.md) for
style guidelines, color tables, and prompt templates.

## Prerequisites

- Access to Gemini image generation
- ImageMagick installed (`magick` command available)

## Steps

### 1. Choose the icon to generate

Look up the icon's prompt in its companion `.md` file:

- Elements: `apps/web/public/elements/{element}.md`
- Weapon types: `apps/web/public/weapon-types/{type}.md`

Each companion file contains the full prompt text for both light and dark
variants.

### 2. Generate the light mode variant

Copy the light mode prompt from the companion `.md` file into Gemini and
generate the image.

### 3. Generate the dark mode variant

Copy the dark mode prompt from the companion `.md` file into Gemini and
generate the image.

### 4. Remove backgrounds and resize with ImageMagick

For the **light** variant (white background), remove the white background and resize:

```bash
magick {name}-light-raw.png -fuzz 10% -transparent white \
  -resize 128x128 {name}-light.png
```

For the **dark** variant (black background), remove the black background, stray
white areas, and any gray watermark artifacts:

```bash
magick {name}-dark-raw.png \
  -fuzz 10% -transparent black \
  -fuzz 10% -transparent white \
  -fuzz 5% -transparent "rgb(158,158,158)" \
  -fuzz 5% -transparent "rgb(140,140,140)" \
  -fuzz 5% -transparent "rgb(170,170,170)" \
  -resize 128x128 {name}-dark.png
```

Use `-transparent` (global pixel match), not flood-fill. Flood-fill misses
disconnected interior regions of the same color.

Adjust `-fuzz` percentages if the background isn't fully removed or if icon
edges erode. Start at 10% and adjust as needed.

> **Note:** Gemini sometimes ignores the black background instruction and
> produces a white background. If this happens, process the dark variant the
> same way as the light variant (remove white instead of black).

### 5. Save to the correct directory

- Elements: `apps/web/public/elements/{element}-light.png` and
  `{element}-dark.png`
- Weapon types: `apps/web/public/weapon-types/{type}-light.png` and
  `{type}-dark.png`

### 6. Verify the result

1. Confirm transparent backgrounds work on their target surfaces (light
   variant on light backgrounds, dark variant on dark backgrounds).
2. Confirm each icon is identifiable at 32px.

### 7. Update the companion file

Update the corresponding `.md` companion file with the generation date and any
post-processing notes for each variant.

### 8. Reference in code

- Elements: use `getElementIconPath` from `apps/web/src/lib/elements.ts`
- Weapon types: use `getWeaponTypeIconPath` from
  `apps/web/src/lib/weaponTypes.ts`

Both helpers accept a `variant` parameter (`'light'` or `'dark'`).
