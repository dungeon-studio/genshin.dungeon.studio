<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# How to add Genshin Impact characters

Add new character data to the game-data package when Genshin Impact releases new characters.

## When to update

- Genshin Impact releases new 5-star or 4-star characters.
- Character stats change significantly.
- A character's element or type changes. Note that this is rare and might indicate an error.

## Prerequisites

- Access to [Genshin Impact Wiki - Character List](https://genshin-impact.fandom.com/wiki/Character)
- Familiarity with the game-data package structure

## Steps

### 1. Gather character information

From the wiki, collect:

- Character name
- Element, type, rarity, and region
- Release version, for example, "1.0," "3.1," "5.2"

### 2. Update `packages/game-data/src/characters.ts`

Add the character to the `CHARACTERS` array. Use the `Character` interface:

```typescript
interface Character {
  id: string; // kebab-case unique identifier
  name: string; // Display name
  element: Element; // Use ELEMENTS constants
  weaponType: WeaponType; // Use WEAPON_TYPES constants
  rarity: Rarity; // 4 or 5
  region: string; // Character's home region
  version: string; // Release version (for example, "1.0", "3.1", "5.2")
}
```

**Example:**

```typescript
{
  id: 'nahida',
  name: 'Nahida',
  element: 'Dendro',
  weaponType: 'Catalyst',
  rarity: 5,
  region: 'Sumeru',
  version: '3.2',
}
```

### 3. Keep array sorted

Maintain the `CHARACTERS` array in a logical order:

- By rarity: 5-stars first, then 4-stars
- By version descending: newest first within each rarity group
- You can list characters from the same version in any order

### 4. Update version comment

Update the version comment at the top of `characters.ts`, such as the line noting "as of version," with the latest game version and a brief description of the changes you made.

### 5. Verify and test

```bash
# Type check
pnpm --filter @genshin/game-data typecheck

# Build
pnpm --filter @genshin/game-data build

# Lint
pnpm --filter @genshin/game-data lint
```

## Tips

- Use lowercase, kebab-case for character IDs, for example, `hu-tao`, `raiden-shogun`.
- Element and type don't change after release.
- Keep descriptions accurate to the current game state.

## See also

- [Update Elemental Reactions](update-game-reactions.md)
- [Update Genshin Impact Game Weapons](update-game-weapons.md)
- [Update Genshin Impact Artifact Sets](update-game-artifacts.md)
