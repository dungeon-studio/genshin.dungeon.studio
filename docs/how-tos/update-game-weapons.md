<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# How to update Genshin Impact weapons

A generator builds the `WEAPONS` array in `packages/game-data/src/weapons.ts`
from the offline [`genshin-db`](https://www.npmjs.com/package/genshin-db)
dataset. Don't hand-edit weapon entries: the region between the
`BEGIN GENERATED WEAPONS` and `END GENERATED WEAPONS` markers is overwritten on
every regeneration.

## When to update

- A new game version ships weapons and `genshin-db` has published a release covering them.
- A weapon's stats or passive text changed upstream.

## Steps

### 1. Bump `genshin-db`

`genshin-db` ships a release per game patch every six weeks or so. Renovate opens
the bump automatically. To do it by hand:

```bash
pnpm --filter @genshin/game-data up genshin-db
```

### 2. Regenerate the roster

```bash
pnpm --filter @genshin/game-data generate:weapons
```

This rewrites the `WEAPONS` array with the full obtainable roster of 3-star to
5-star weapons, sorted 5-star first, then by version descending. Review the
resulting diff: it's the human-readable record of what changed in the data.

### 3. Verify

```bash
pnpm turbo run typecheck test lint --filter @genshin/game-data
```

## Adding a new sub-stat

`genshin-db` reports each sub-stat as a `FIGHT_PROP_*` constant. If a weapon
introduces a sub-stat not yet in `WEAPON_STAT_TYPES`, the generator throws with
the unmapped name. Add the member to `WEAPON_STAT_TYPES` in `weapons.ts` and its
mapping to `STAT_TYPE_KEY_BY_GENSHIN_DB` in `scripts/generate-weapons.ts`, then
regenerate.

## See also

- [Add Genshin Impact Characters](update-game-characters.md)
- [Update Elemental Reactions](update-game-reactions.md)
- [Update Genshin Impact Artifact Sets](update-game-artifacts.md)
