<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# How to update elemental reactions

Add or update elemental reaction data when Genshin Impact introduces new reactions or changes reaction mechanics.

## When to update

- Genshin Impact introduces new reactions, for example, Lunar reactions in v5.1.
- Reaction mechanics change significantly.
- The game adjusts reaction damage multipliers.

## Prerequisites

- Access to [Genshin Impact Wiki - Elemental Reactions](https://genshin-impact.fandom.com/wiki/Elemental_Reaction)
- Familiarity with the game-data package structure

## Steps

### 1. Review the official source

Visit the [Elemental Reactions wiki page](https://genshin-impact.fandom.com/wiki/Elemental_Reaction) to gather reaction details and change history for the version you're updating.

### 2. Update `packages/game-data/src/elements.ts`

Add the new reaction to `ELEMENT_REACTION_TYPES`:

**In `ELEMENT_REACTION_TYPES`:**

```typescript
REACTION_NAME: {
  type: 'REACTION_TYPE', // AMPLIFYING, TRANSFORMATIVE, ADDITIVE, DENDRO_CORE, STATUS, LUNAR
  elements: [ELEMENTS.ELEMENT1, ELEMENTS.ELEMENT2], // if applicable
  note?: 'Additional context',
  requirement?: 'Prerequisites like "Bloom active"',
  version: '1.0', // Release version (for example, "1.0", "3.0", "5.1")
}
```

### 3. Update version comment

Update the MAINTENANCE NOTE comment at the top of `elements.ts` with the latest version and description of changes.

### 4. Verify and test

```bash
# Type check
pnpm --filter @genshin/game-data typecheck

# Build
pnpm --filter @genshin/game-data build

# Lint
pnpm --filter @genshin/game-data lint
```

## Example: Genshin Impact added Lunar reactions in v5.1

The game added Lunar reactions—Lunar-Charged, Lunar-Bloom, Lunar-Crystallize—in v5.1. Here's how you add them:

```typescript
// In ELEMENT_REACTION_TYPES
LUNAR_CHARGED: {
  type: 'LUNAR',
  elements: [ELEMENTS.HYDRO, ELEMENTS.ELECTRO],
  note: 'Enhanced Electro-Charged with bonus scaling',
},
LUNAR_BLOOM: {
  type: 'LUNAR',
  elements: [ELEMENTS.HYDRO, ELEMENTS.DENDRO],
  note: 'Enhanced Bloom variant',
},
LUNAR_CRYSTALLIZE: {
  type: 'LUNAR',
  elements: [ELEMENTS.GEO, ELEMENTS.HYDRO],
  note: 'Enhanced Crystallize with Moondrifts',
},


```

## See also

- [Update Genshin Impact Game Characters](update-game-characters.md)
- [Update Genshin Impact Game Weapons](update-game-weapons.md)
- [Update Genshin Impact Artifact Sets](update-game-artifacts.md)
