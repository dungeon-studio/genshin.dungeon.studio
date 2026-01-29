# How to Add Shared Types

This guide shows you how to create and use shared TypeScript types across the monorepo.

## Prerequisites

- You understand TypeScript interfaces and types
- The `@genshin/types` package is set up in the monorepo

## Steps

### 1. Create the Type File

Add a new file in `packages/types/src/`:

```typescript
// packages/types/src/character.ts
export interface Character {
  id: string;
  name: string;
  element: Element;
  weapon: WeaponType;
  constellation: number;
  level: number;
}

export type Element = 'Pyro' | 'Hydro' | 'Cryo' | 'Electro' | 'Anemo' | 'Geo' | 'Dendro';

export type WeaponType = 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst';
```

### 2. Export from Package

Add the export to `packages/types/src/index.ts`:

```typescript
export * from './character';
export * from './team';
export * from './user';
```

### 3. Use in Apps

Import and use the types:

```typescript
// In apps/web or apps/api
import type { Character, Element } from '@genshin/types';

const character: Character = {
  id: '1',
  name: 'Hu Tao',
  element: 'Pyro',
  weapon: 'Polearm',
  constellation: 0,
  level: 90,
};
```

## Best Practices

- Use `type` imports: `import type { ... }`
- Prefer union types over enums
- Keep types focused and single-purpose
- Add JSDoc comments for complex types
- Use strict TypeScript types (no `any`)
