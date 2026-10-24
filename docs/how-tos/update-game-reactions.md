<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# How to update elemental reactions

`@genshin/game-data-codegen` doesn't generate reactions, so
`ELEMENT_REACTION_TYPES` in `packages/game-data/src/elements.ts` changes only by
hand. Update it when the game adds a reaction or changes what triggers one.

## Add or change a reaction

1. Look up the reaction on the
   [Elemental Reactions wiki page](https://genshin-impact.fandom.com/wiki/Elemental_Reaction).
2. Add or edit its entry in `ELEMENT_REACTION_TYPES`. `version` is the release
   that introduced the reaction, so an edit leaves it unchanged.

   ```typescript
   HYPERBLOOM: {
     type: REACTION_TYPES.DENDRO_CORE,
     elements: [ELEMENTS.ELECTRO],
     requirement: 'Bloom active',
     version: '3.0',
   },
   ```

3. Confirm the gates pass:

   ```bash
   pnpm turbo run typecheck test lint --filter @genshin/game-data
   ```

## See also

- [Regenerate Genshin Impact Characters](update-game-characters.md)
- [Update Genshin Impact Game Weapons](update-game-weapons.md)
- [Update Genshin Impact Artifact Sets](update-game-artifacts.md)
- [Regenerate Genshin Impact Elemental Resonances](update-game-resonances.md)
