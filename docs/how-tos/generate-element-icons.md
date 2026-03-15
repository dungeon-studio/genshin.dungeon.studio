<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# How to generate element icons

Generate original element icon images using Gemini for use in character cards
and element filter UI. The project avoids official Genshin Impact artwork to
prevent copyright issues.

## Prerequisites

- Access to Gemini image generation
- Familiarity with the seven Genshin Impact elements

## Output

Place generated icons in `apps/web/public/elements/` with these exact file
names:

- `pyro.png`
- `hydro.png`
- `anemo.png`
- `electro.png`
- `dendro.png`
- `cryo.png`
- `geo.png`

## Style guidelines

- **Format:** PNG (Portable Network Graphics) with transparent background.
- **Size:** At least 128&times;128px source; icons display at 32&ndash;48px in
  the UI, so details must read well at small sizes.
- **Style:** Flat or semi-flat with clean edges. Bold, clean shapes. No
  gradients that disappear at small sizes.
- **Legibility:** Each icon must be visually distinct and identifiable at
  32px.
- **Background compatibility:** Icons must work on both light and dark
  backgrounds (use the element's signature color, not colors that rely on
  background contrast).
- **Originality:** No official Genshin Impact artwork, logos, or trademarked
  designs.

## Gemini prompts

Use the base prompt below, substituting the element-specific description for
each icon. Iterate on results until the icon meets the style guidelines.

### Base prompt

> A flat vector icon on a transparent background, 128x128 pixels, bold
> shape with clean edges, suitable for display at small sizes (32px). No text,
> no gradients, no photorealistic detail. Original design, not based on any
> existing game artwork.

### Element-specific prompts

#### Pyro

> \[base prompt\] A stylized flame icon in warm orange-red (#FF6B35). Single
> bold flame shape with minimal internal detail.

#### Hydro

> \[base prompt\] A stylized water droplet icon in blue (`#3B8CD8`). Single
> clean droplet shape with a subtle wave or ripple accent.

#### Anemo

> \[base prompt\] A stylized wind swirl icon in teal-green (#67E8C9). A smooth
> spiral or flowing wind curve with clean lines.

#### Electro

> \[base prompt\] A stylized lightning bolt icon in purple (#A855F7). A single
> angular bolt shape with sharp edges.

#### Dendro

> \[base prompt\] A stylized leaf icon in green (#4ADE80). A single leaf shape
> with a visible center vein, clean outline.

#### Cryo

> \[base prompt\] A stylized snowflake icon in light blue (#7DD3FC). A
> six-pointed snowflake with clean geometric symmetry.

#### Geo

> \[base prompt\] A stylized geometric crystal icon in amber-gold (#FCD34D). A
> diamond or hexagonal gem shape with flat facets.

## Iteration tips

- If Gemini produces photorealistic output, emphasize "flat vector icon" and
  "no photorealistic detail" in the prompt.
- If icons are too complex for small display, add "minimal detail, bold
  silhouette" to the prompt.
- Compare all seven icons side by side at 32px to verify they're visually
  distinct.
- The hex colors in the prompts match the Tailwind element color palette in
  `apps/web/tailwind.config.js`.

## After generating

1. Save each icon as `{element}.png` in `apps/web/public/elements/`.
2. Resize to 128×128 if the source is larger (Gemini often outputs 2048×2048).
3. Verify each icon renders well at 32px, 48px, and 128px.
4. Verify transparent background works on both light and dark surfaces.
5. Update the corresponding `{element}.md` prompt file with the final prompt,
   date, and iteration count.
6. Reference the icons using the `getElementIconPath` helper from
   `apps/web/src/lib/elements.ts`.

Each `apps/web/public/elements/{element}.md` file captures the final prompt
that produced the accepted icon.
