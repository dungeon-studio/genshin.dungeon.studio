# How to Debug Code

This guide shows you how to debug different parts of the application.

## Frontend Debugging

### Browser DevTools

Use your browser's developer tools (F12):

```typescript
// Console logging
console.log('Character:', character);
console.error('Failed to load:', error);

// Table view for arrays
console.table(characters);
```

### React DevTools

Install the [React DevTools](https://react.dev/learn/react-developer-tools) browser extension to:

- Inspect component props and state
- View component hierarchy
- Profile performance

### Debugger Statement

Add breakpoints directly in code:

```typescript
export function CharacterCard({ character }: CharacterCardProps) {
  debugger; // Execution will pause here
  return <div>{character.name}</div>;
}
```

### VSCode Debugging

1. Set breakpoints by clicking the gutter in VSCode
2. Press F5 or use "Run and Debug" panel
3. Choose "Chrome" or "Edge" configuration

---

## Backend Debugging

### Console Logging

```typescript
// Simple logging
console.log('Request received:', await c.req.json());

// Structured logging
console.log({
  method: c.req.method,
  path: c.req.path,
  query: c.req.query(),
});
```

### Hono Logger Middleware

Add request logging:

```typescript
import { logger } from 'hono/logger';

app.use('*', logger());
```

### VSCode Debugging

1. Set breakpoints in API code
2. Press F5 or use "Run and Debug" panel
3. Choose "Node.js" configuration

---

## Test Debugging

### Debug Test Output

```typescript
import { render, screen, debug } from '@testing-library/react';

test('displays character', () => {
  render(<CharacterCard character={character} />);

  // Print entire DOM tree
  screen.debug();

  // Print specific element
  screen.debug(screen.getByRole('heading'));
});
```

### Run Single Test

```bash
# Run only one test file
pnpm test CharacterCard.test.tsx

# Run tests matching pattern
pnpm test --grep "displays character name"
```

### VSCode Test Debugging

1. Set breakpoints in test file
2. Use Vitest extension test explorer
3. Click "Debug" icon next to test name

---

## Network Debugging

### Frontend API Calls

View in Browser DevTools → Network tab:

- Check request/response headers
- Inspect payload data
- View response status codes

### Backend Logs

Monitor backend console for request logs:

```typescript
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.path}`);
  await next();
});
```

---

## Performance Debugging

### React Profiler

```typescript
import { Profiler } from 'react';

function onRender(id, phase, actualDuration) {
  console.log(`${id} took ${actualDuration}ms`);
}

<Profiler id="CharacterList" onRender={onRender}>
  <CharacterList characters={characters} />
</Profiler>
```

### Browser Performance Tools

1. Open DevTools → Performance tab
2. Click Record
3. Interact with app
4. Stop recording and analyze flame graph

---

## Tips

- Use descriptive log messages
- Remove or comment out logs before committing
- Use conditional breakpoints for loops
- Check browser console for React warnings
- Use network tab to debug API issues
