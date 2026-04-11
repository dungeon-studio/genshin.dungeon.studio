<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Icon design conventions

Design conventions for element and weapon type icons. For the step-by-step
generation workflow, see [How to generate icons](../how-tos/generate-icons.md).
For final prompts and generation notes, see each icon's companion `.md` file.

## General style

- **Format:** PNG with transparent background (achieved via post-processing).
- **Size:** Generate at 512&times;512px or larger; resize to 128&times;128px
  for production. Icons display at 32&ndash;48px in the UI.
- **Style:** Flat or semi-flat with clean edges. Bold, solid silhouettes. No
  gradients that disappear at small sizes.
- **Legibility:** Each icon must be visually distinct and identifiable at
  32px.
- **Originality:** No official Genshin Impact artwork, logos, or trademarked
  designs.

## Light and dark variants

Each icon has two variants:

- **Light mode:** Designed for light backgrounds. Uses the icon's darker color
  for strong contrast against white.
- **Dark mode:** Designed for dark backgrounds. Uses the icon's brighter color
  for strong contrast against black.

## File locations

| Category     | Directory                       | Companion files |
| ------------ | ------------------------------- | --------------- |
| Elements     | `apps/web/public/elements/`     | `{element}.md`  |
| Weapon types | `apps/web/public/weapon-types/` | `{type}.md`     |

File names follow the pattern `{name}-light.png` / `{name}-dark.png`.

Each companion `.md` file captures the final prompts, generation date, and
post-processing notes for both variants of the accepted icon.

## Color palette

### Elements

The hex colors match the Tailwind element color palette in
`apps/web/tailwind.config.js`. Use the **dark** column color in light mode
prompts and the **light** column color in dark mode prompts.

| Element | Light mode color (dark) | Dark mode color (light) |
| ------- | ----------------------- | ----------------------- |
| Pyro    | `#D94A1A`               | `#FF9E5A`               |
| Hydro   | `#1E5A8E`               | `#6BB6FF`               |
| Anemo   | `#2DD4BF`               | `#A5F3E5`               |
| Electro | `#7C3AED`               | `#D39CFF`               |
| Dendro  | `#22C55E`               | `#BBF7D0`               |
| Cryo    | `#38BDF8`               | `#C0E7FF`               |
| Geo     | `#F59E0B`               | `#FDE68A`               |

### Weapon types

| Weapon type | Light mode color      | Dark mode color         |
| ----------- | --------------------- | ----------------------- |
| Sword       | dark steel `#475569`  | bright steel `#CBD5E1`  |
| Claymore    | dark iron `#57534E`   | bright iron `#D6D3D1`   |
| Polearm     | dark bronze `#92400E` | bright bronze `#FBBF24` |
| Bow         | dark amber `#78350F`  | bright amber `#FDE68A`  |
| Catalyst    | dark violet `#6D28D9` | bright violet `#C084FC` |

## Iteration tips

- If Gemini produces photorealistic output, emphasize "flat vector icon" and
  "no photorealistic detail" in the prompt.
- If icons are too complex for small display, add "minimal detail, bold
  silhouette" to the prompt.
- Compare icons side by side at 32px to verify they're visually distinct.
- Verify light mode icons have good contrast on white and dark mode icons
  on black before removing backgrounds.
