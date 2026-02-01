# How to add Genshin Impact artifact sets

Add new 5-star artifact set data to the game-data package when Genshin Impact releases new artifact sets.

<!-- vale Google.Colons = NO -->

**Note**: This project only tracks 5-star artifact sets for endgame optimization. Lower rarity artifacts aren't included.

<!-- vale Google.Colons = YES -->

## When to update

- Genshin Impact releases new artifact sets.
- Artifact bonuses change significantly.

<!-- vale Vale.Spelling = NO -->

- The game rebalances set effects.

<!-- vale Vale.Spelling = YES -->

## Prerequisites

- Access to [Genshin Impact Wiki - Artifacts](https://genshin-impact.fandom.com/wiki/Artifact)
- Familiarity with the game-data package structure

## Steps

### 1. Gather artifact set information

From the wiki, collect:

- Artifact set name and ID
- Set bonus descriptions, 2-piece and 4-piece
- Release version, for example, "1.0," "3.0," "4.3"

### 2. Update `packages/game-data/src/artifacts.ts`

Add the artifact set to the `ARTIFACT_SETS` array. Use the `ArtifactSet` interface:

```typescript
interface ArtifactSet {
  id: string; // kebab-case unique identifier
  name: string; // Display name
  version: string; // Release version (for example, "1.0", "3.0", "4.3")
  bonuses: Record<2 | 4, string>; // 2-piece and 4-piece bonus descriptions
}
```

**Example:**

```typescript
{
  id: 'deepwood-memories',
  name: 'Deepwood Memories',
  version: '3.0',
  bonuses: {
    2: 'Dendro DMG Bonus +15%',
    4: "After Elemental Skills or Bursts hit opponents, the targets' Dendro RES will be decreased by 30% for 8s. This effect can be triggered even if the equipping character is not on the field.",
  },
}
```

### 3. Copy descriptions accurately

Use exact text from the in-game artifact descriptions or wiki:

<!-- vale alex.Ablist = NO -->

- Include special formatting, like quotes.

<!-- vale alex.Ablist = YES -->

- Match numeric values precisely.
- Use proper punctuation and capitalization.

### 4. Update version comment

Update the MAINTENANCE NOTE comment at the top of `artifacts.ts` with the latest version and description of changes.

### 5. Keep array organized

Organize artifact sets by:

- Release version, newest first
- Logical grouping by element or approach when applicable

### 6. Verify and test

```bash
# Type check
pnpm --filter @genshin/game-data typecheck

# Build
pnpm --filter @genshin/game-data build

# Lint
pnpm --filter @genshin/game-data lint
```

## Tips

- Use lowercase, kebab-case for set IDs, for example, `deepwood-memories`, `gilded-dreams`.
- Descriptions should include the exact numeric values from the game.
- Keep bonuses in order: 2-piece first, then 4-piece.
- For conditional bonuses like "if character is on field," include all conditions in the description.

## See also

- [Add Genshin Impact Characters](update-game-characters.md)
- [Add Genshin Impact Weapons](update-game-weapons.md)
- [Update Elemental Reactions](update-game-reactions.md)
