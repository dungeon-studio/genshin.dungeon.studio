# Development Workflow

How to work on this project efficiently using a pull request model.

---

## Daily Development Flow

### Starting Work

```bash
# 1. Ensure you're on develop
git checkout develop

# 2. Pull latest changes
git pull origin develop

# 3. Install any new dependencies
pnpm install

# 4. Start dev servers (from root)
pnpm dev
# Frontend: http://localhost:5173
# Backend: http://localhost:8080
```

---

## Feature Development Workflow

### 1. Create Feature Branch

```bash
# Naming convention: feature/description or fix/description
git checkout -b feature/character-collection
```

### 2. Develop with TDD

Write test first, then implement:

```typescript
// apps/web/src/features/collection/CharacterCard.test.tsx
describe('CharacterCard', () => {
  it('displays character name', () => {
    const character = { name: 'Hu Tao', element: 'Pyro' };
    render(<CharacterCard character={character} />);
    expect(screen.getByText('Hu Tao')).toBeInTheDocument();
  });
});
```

Then implement:

```typescript
// apps/web/src/features/collection/CharacterCard.tsx
export function CharacterCard({ character }) {
  return <div>{character.name}</div>;
}
```

Run tests:
```bash
pnpm test
```

### 3. Commit with Conventional Commits

```bash
git add .
git commit -m "feat(collection): add character card component

- Create CharacterCard component
- Add tests for character display
- Style with Tailwind CSS"
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code restructuring
- `style:` - Formatting, no code change
- `chore:` - Maintenance tasks

### 4. Push and Create PR

```bash
# Push branch
git push -u origin feature/character-collection

# Create PR via CLI
gh pr create --title "feat: Add character collection grid" \
  --body "Implements character collection view with:
  - CharacterCard component
  - Grid layout with Tailwind
  - Tests for rendering
  
  Closes #5"

# Or create PR in GitHub UI
```

### 5. Review and Merge

Once tests pass and code is reviewed:

```bash
# Merge via CLI (squash for clean history)
gh pr merge --squash

# Or use GitHub UI merge button
```

### 6. Update Local

```bash
git checkout develop
git pull origin develop
git branch -d feature/character-collection
```

---

## Project Structure Guide

### Where to Put Code

```
apps/web/src/
├── components/
│   ├── ui/              # shadcn components (Button, Card, Dialog)
│   └── layout/          # Layout components (Header, Nav, Footer)
├── features/
│   ├── auth/            # Authentication (login, signup)
│   ├── collection/      # Character collection management
│   ├── teams/           # Team builder
│   └── chat/            # AI chat interface
├── lib/
│   ├── firebase.ts      # Firebase client config
│   ├── api-client.ts    # API wrapper
│   └── utils.ts         # Utility functions
├── hooks/               # Custom React hooks
├── stores/              # Zustand state stores
└── test/                # Test utilities and setup

apps/api/src/
├── routes/              # HTTP endpoints
│   ├── collection.ts
│   ├── teams.ts
│   └── health.ts
├── mcp/                 # MCP server for AI
│   ├── server.ts
│   ├── tools/           # AI tools
│   └── resources/       # Context providers
├── lib/
│   ├── firebase-admin.ts
│   └── middleware.ts
└── types/               # API-specific types

packages/
├── types/               # Shared types
│   └── src/
│       ├── character.ts
│       ├── team.ts
│       └── user.ts
└── game-data/           # Game static data
    └── src/
        ├── characters.json
        ├── weapons.json
        └── artifacts.json
```

---

## Common Tasks

### Add a UI Component

```bash
cd apps/web
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
```

### Add a New API Endpoint

```typescript
// apps/api/src/routes/collection.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/characters', async (c) => {
  // Implementation
  return c.json({ characters: [] });
});

export default app;
```

Register in main:
```typescript
// apps/api/src/main.ts
import collection from './routes/collection';

app.route('/api/collection', collection);
```

### Add Shared Types

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
```

Use in apps:
```typescript
import type { Character } from '@genshin/types';
```

### Run Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test --watch

# With UI
pnpm test:ui

# Specific app
cd apps/web && pnpm test
cd apps/api && pnpm test

# Single test file
pnpm test CharacterCard.test.tsx
```

---

## Code Quality

### Before Committing

```bash
# Format code
pnpm format

# Type check
pnpm tsc --noEmit

# Run tests
pnpm test

# Lint (if configured)
pnpm lint
```

### Test Coverage

Aim for:
- **Critical paths**: 80%+ coverage
- **Utilities**: 90%+ coverage  
- **UI components**: Test user interactions, not implementation details

---

## Debugging

### Frontend

```typescript
// Use React DevTools browser extension
console.log('Character:', character);

// Debugger
debugger;
```

### Backend

```typescript
// Console logging
console.log('Request:', await c.req.json());

// Hono logger middleware
import { logger } from 'hono/logger';
app.use('*', logger());
```

### Tests

```typescript
// Use debug helper
import { render, screen, debug } from '@testing-library/react';

render(<Component />);
screen.debug(); // Prints DOM to console
```

---

## Performance Tips

### Frontend

```typescript
// Lazy load routes
const ChatPage = lazy(() => import('./features/chat/ChatPage'));

// Memoize expensive computations
const optimalTeam = useMemo(() => 
  calculateOptimalTeam(characters), 
  [characters]
);
```

### Backend

```typescript
// Cache static data
const gameDataCache = new Map();

// Batch Firestore reads
const batch = firestore.batch();
```

---

## Getting Help

### Stuck on an Error?

1. Check test output for specific error
2. Review recent changes: `git diff`
3. Check if dependencies are installed: `pnpm install`
4. Review documentation in `docs/`
5. Check GitHub issues for similar problems

### Common Issues

**"Module not found"**
```bash
# Cross-platform solution
pnpm dlx rimraf node_modules pnpm-lock.yaml
pnpm install
```

**"Port already in use"**
```bash
# Unix/Linux/macOS
lsof -ti:5173 | xargs kill  # Frontend
lsof -ti:8080 | xargs kill  # Backend

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process

# Windows (Command Prompt)
for /f "tokens=5" %a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %a
for /f "tokens=5" %a in ('netstat -ano ^| findstr :8080') do taskkill /F /PID %a
```

**"Test fails but code works"**
- Check test setup in `src/test/setup.ts`
- Ensure you're importing from '@testing-library/react'
- Verify mocks are properly configured

---

## Best Practices

### Do's ✅

- ✅ Write tests before or alongside features
- ✅ Use TypeScript strictly (no `any` types)
- ✅ Keep commits small and focused
- ✅ Use conventional commit messages
- ✅ Review your own PR before requesting review
- ✅ Keep functions small and focused
- ✅ Use meaningful variable names

### Don'ts ❌

- ❌ Commit directly to `develop` (use PRs)
- ❌ Push `.env` files (they're gitignored)
- ❌ Skip writing tests for new features
- ❌ Use `any` type unnecessarily
- ❌ Create massive commits with unrelated changes
- ❌ Force push to shared branches

---

## Next Steps

Once you're comfortable with the workflow:

1. Review [SETUP_GUIDE.md](./SETUP_GUIDE.md) for technical setup
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design (when created)
3. See GitHub issues for tasks to work on
4. Start building features!
