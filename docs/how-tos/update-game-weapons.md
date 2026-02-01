# How to add Genshin Impact weapons

<!-- vale alex.ProfanityUnlikely = NO -->

Add new weapon data to the game-data package when Genshin Impact releases new weapons.

<!-- vale alex.ProfanityUnlikely = YES -->

## When to update

<!-- vale alex.ProfanityUnlikely = NO -->

- Genshin Impact releases new 5-star, 4-star, or 3-star weapons.
- The game updates weapon balance significantly.
- Developers add or modify passive effects.

<!-- vale alex.ProfanityUnlikely = YES -->

## Prerequisites

- Access to [Genshin Impact Wiki - Weapons](https://genshin-impact.fandom.com/wiki/Weapons)
- Familiarity with the game-data package structure

## Steps

### 1. Gather information

From the wiki, collect:

- Name and ID

<!-- vale alex.ProfanityUnlikely = NO -->
<!-- vale alex.ProfanityMaybe = NO -->
<!-- vale Google.Parens = NO -->

- Type, rarity, base Attack (ATK)

<!-- vale alex.ProfanityUnlikely = YES -->
<!-- vale alex.ProfanityMaybe = YES -->
<!-- vale Google.Parens = YES -->

- Secondary stat, if any
- Passive ability name and description
- Release version, for example, "1.0," "2.1," "5.2"

### 2. Update `packages/game-data/src/weapons.ts`

<!-- vale alex.ProfanityUnlikely = NO -->

Add the weapon to the `WEAPONS` array. Use the `Weapon` interface:

<!-- vale alex.ProfanityUnlikely = YES -->

```typescript
interface Weapon {
  id: string; // kebab-case unique identifier
  name: string; // Display name
  type: WeaponType; // Use WEAPON_TYPES constants
  rarity: Rarity; // Rarity level (1–5; this package typically uses 3–5)
  baseATK: number; // Base Attack (ATK) value
  version: string; // Release version (for example, "1.0", "2.1", "5.2")
  subStat?: {
    // Optional secondary stat
    type: WeaponStatType;
    value: number;
  };
  passiveName?: string; // Passive ability name
  passiveDescription?: string; // Passive ability text
}
```

**Example:**

```typescript
{
  id: 'staff-of-homa',
  name: 'Staff of Homa',
  type: 'Polearm',
  rarity: 5,
  baseATK: 46,
  version: '1.5',
  subStat: {
    type: WEAPON_STAT_TYPES.CRIT_DMG,
    value: 14.4,
  },
  passiveName: 'Reckless Cinnabar',
  passiveDescription: 'HP is increased. The wielder receives an ATK bonus based on Max HP.',
}
```

### 3. Keep array organized

Group weapons by:

- Type
- Rarity within each type: 5-star first, then 4-star, then 3-star
- Release date within each category

### 4. Update version comment

Update the MAINTENANCE NOTE comment at the top of `weapons.ts` with the latest version and description of changes.

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

<!-- vale alex.ProfanityUnlikely = NO -->

- Use lowercase, kebab-case for IDs, for example, `mistsplitter-reforged`, `lost-prayer-to-the-sacred-winds`.
- You can find base ATK values on the wiki for each weapon.
- Copy passive descriptions directly from in-game text for accuracy.
- Consider the primary users when adding to the list.

<!-- vale alex.ProfanityUnlikely = YES -->

## See also

- [Add Genshin Impact Characters](update-game-characters.md)
- [Update Elemental Reactions](update-game-reactions.md)
- [Update Genshin Impact Artifact Sets](update-game-artifacts.md)
