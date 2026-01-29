# How to Optimize Performance

This guide shows you techniques for improving application performance.

## Frontend Optimization

### Lazy Load Routes

Split code by route to reduce initial bundle size:

```typescript
import { lazy, Suspense } from 'react';

// Lazy load page components
const ChatPage = lazy(() => import('./features/chat/ChatPage'));
const CollectionPage = lazy(() => import('./features/collection/CollectionPage'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/collection" element={<CollectionPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoize Expensive Computations

Use `useMemo` for calculations that don't need to run on every render:

```typescript
import { useMemo } from 'react';

function TeamBuilder({ characters }: TeamBuilderProps) {
  // Only recalculate when characters change
  const optimalTeam = useMemo(
    () => calculateOptimalTeam(characters),
    [characters]
  );

  return <TeamDisplay team={optimalTeam} />;
}
```

### Memoize Callbacks

Use `useCallback` to prevent function recreation:

```typescript
import { useCallback } from 'react';

function CharacterList({ characters }: CharacterListProps) {
  const handleSelect = useCallback((id: string) => {
    // Handler logic
  }, []); // No dependencies = never recreates

  return characters.map(char => (
    <CharacterCard key={char.id} onSelect={handleSelect} />
  ));
}
```

### Virtualize Long Lists

For lists with hundreds of items, use virtualization:

```typescript
// Using @tanstack/react-virtual
import { useVirtualizer } from '@tanstack/react-virtual';

function CharacterList({ characters }: CharacterListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: characters.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map(item => (
        <CharacterCard key={item.key} character={characters[item.index]} />
      ))}
    </div>
  );
}
```

---

## Backend Optimization

### Cache Static Data

Cache data that doesn't change frequently:

```typescript
const gameDataCache = new Map<string, Character[]>();

async function getCharacters() {
  if (gameDataCache.has('characters')) {
    return gameDataCache.get('characters');
  }

  const characters = await fetchCharacters();
  gameDataCache.set('characters', characters);
  return characters;
}
```

### Batch Firestore Operations

Batch reads and writes to reduce network calls:

```typescript
import { firestore } from './firebase-admin';

// Batch reads
const batch = firestore.batch();
const refs = characterIds.map((id) => firestore.collection('characters').doc(id));
const snapshots = await firestore.getAll(...refs);

// Batch writes
const writeBatch = firestore.batch();
characters.forEach((char) => {
  const ref = firestore.collection('characters').doc(char.id);
  writeBatch.set(ref, char);
});
await writeBatch.commit();
```

### Index Database Queries

Ensure Firestore queries have proper indexes:

```typescript
// Create composite indexes in Firebase Console
// or firestore.indexes.json for queries like:
const query = await firestore
  .collection('teams')
  .where('userId', '==', userId)
  .where('isPublic', '==', true)
  .orderBy('createdAt', 'desc')
  .get();
```

---

## Monitoring Performance

### Measure Component Render Time

```typescript
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: "mount" | "update",
  actualDuration: number,
) {
  if (actualDuration > 16) { // Slower than 60fps
    console.warn(`${id} took ${actualDuration}ms to ${phase}`);
  }
}

<Profiler id="CharacterList" onRender={onRenderCallback}>
  <CharacterList />
</Profiler>
```

### Analyze Bundle Size

```bash
# Build with analysis
pnpm build --analyze

# Check the bundle size report
```

---

## Best Practices

- Profile before optimizing - don't guess
- Focus on user-perceived performance first
- Use React DevTools Profiler to find slow components
- Lazy load non-critical features
- Optimize images (use WebP, proper sizing)
- Enable gzip/brotli compression in production
- Use CDN for static assets
