<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# App icon prompts

## Light mode variant

### Light mode prompt

> A flat vector icon on a solid white background, 512×512 pixels, bold shape
> with clean edges, suitable for display at small sizes (16px). No text, no
> gradients, no photorealistic detail. Original design, not based on any
> existing game artwork.
>
> A shield shape with a dark copper-bronze border, dark teal-green field. In
> the center, a stylized constellation pattern with several small stars connected
> by thin dark copper-bronze lines forming a geometric constellation shape,
> evoking celestial navigation and team composition planning. The stars and
> connecting lines use the same dark copper-bronze tone as the border. The
> border should have good contrast on a white background.

### Light mode generation notes

- **Generator:** Gemini
- **Date:** 2026-04-04
- **Post-processing:** 2048x2048 output, white background removed with ImageMagick flood-fill

## Dark mode variant

### Dark mode prompt

> A flat vector icon, 512×512 pixels, bold shape with clean edges, suitable for
> display at small sizes (16px). No text, no gradients, no photorealistic
> detail, no patterns. Original design, not based on any existing game artwork.
> The entire background is a single uniform flat fill of pure black (#000000)
> with absolutely no checkerboard, no tiles, no texture, and no variation.
>
> A shield shape with a bright copper-gold border, dark teal-green field. In
> the center, a stylized constellation pattern with several small stars connected
> by thin bright copper-gold lines forming a geometric constellation shape,
> evoking celestial navigation and team composition planning. The stars and
> connecting lines use the same bright copper-gold tone as the border. The
> border should be prominent and visible on the black background.

### Dark mode generation notes

- **Generator:** Gemini
- **Date:** 2026-04-04
- **Post-processing:** 2048x2048 output, black background removed with ImageMagick flood-fill

## Derived files

| File                     | Size                | Purpose                                         |
| ------------------------ | ------------------- | ----------------------------------------------- |
| `favicon.ico`            | 16×16, 32×32, 48×48 | Multi-resolution browser favicon, light variant |
| `favicon-32x32.png`      | 32×32               | Header icon, light mode                         |
| `favicon-32x32-dark.png` | 32×32               | Header icon, dark mode                          |
| `apple-touch-icon.png`   | 180×180             | iOS home screen icon                            |
| `icon-192x192.png`       | 192×192             | Progressive web app icon, future use            |
| `icon-512x512.png`       | 512×512             | Progressive web app icon, future use            |

All derived files generated with ImageMagick `magick -resize` from the
original 2048x2048 Gemini outputs.

## Environment variants

Non-production deployments overlay a colored disc carrying the environment's
Greek letter, so you can tell a browser tab apart at a glance. The disc survives
a 16×16 tab, where color carries the signal the letter can't.

Each tab icon gains one variant per non-production environment, named by
inserting the environment's suffix before the extension: `favicon.ico` becomes
`favicon-alpha.ico`. The home-screen and web app icons keep the plain mark,
since they never sit beside another environment and the header carries a label.

## Social preview

Every environment shares one 1200×630 link preview, `og-image.png`. The
document's `og:url` and `og:image` point at whichever origin serves them.

## Regenerating

```shell
uv run apps/web/scripts/generate-brand-assets.py
```

Rerun after changing a source mark or adding an environment, and commit the
result. Badge suffixes and colors come from `src/lib/environments.ts`, which
the script duplicates. Nothing checks that the colors still agree.
