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
