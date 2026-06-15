<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# How to regenerate Genshin Impact weapons

The `@genshin/game-data-codegen` package generates
`packages/game-data/src/weapons.generated.ts` from the offline
[`genshin-db`](https://www.npmjs.com/package/genshin-db) dataset. That module
holds the `WEAPONS` array, which `weapons.ts` re-exports. Don't hand-edit
`weapons.generated.ts`. The whole module is overwritten on every regeneration.

## Regenerate locally

Run this after changing the generator or `WEAPON_STAT_TYPES`, or to refresh the
roster against a newer `genshin-db` (bump it first with
`pnpm --filter @genshin/game-data-codegen up genshin-db`):

```bash
pnpm turbo run build --filter @genshin/game-data-codegen
pnpm --filter @genshin/game-data-codegen generate weapons
```

The first command builds the generator and its workspace dependencies. The
second runs its CLI, rewriting `weapons.generated.ts` with the full obtainable
roster of 3-star to 5-star weapons, sorted 5-star first, then by version
descending. Verify the result:

```bash
pnpm turbo run typecheck test lint --filter @genshin/game-data
```

## Adding a new sub-stat

`genshin-db` reports each sub-stat as a `FIGHT_PROP_*` constant. If a weapon
introduces a sub-stat not yet in `WEAPON_STAT_TYPES`, the generator throws with
the unmapped name. Add the member to `WEAPON_STAT_TYPES` in
`packages/game-data/src/weapons.ts` and its mapping to `SUB_STAT_BY_GENSHIN_DB`
in `packages/game-data-codegen/src/weapons.ts`, then regenerate.

## See also

- [Add Genshin Impact Characters](update-game-characters.md)
- [Update Elemental Reactions](update-game-reactions.md)
- [Update Genshin Impact Artifact Sets](update-game-artifacts.md)
