# GitHub Copilot Instructions for genshin.dungeon.studio

## Project Overview

This is an AI-powered team building companion for Genshin Impact. Users can:
- Track their character collection
- Build and save team compositions
- Get personalized team recommendations via AI chat interface (Claude MCP)

**Status**: Early development - establishing foundation and infrastructure first.

**Philosophy**: Test-driven development, clean git history, cross-platform compatibility, type safety.

---

## Tech Stack

### Current (Phase 1 - Infrastructure)
- **Monorepo**: Turborepo + pnpm workspaces
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm
- **Runtime**: Node.js 20+
- **Code Formatting**: Prettier

### Planned (Phase 2+)
- **Frontend**: React 19, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Hono (Node.js server), may migrate to Bun runtime later
- **Database**: Firestore
- **Auth**: Firebase Authentication
- **AI**: Claude (Anthropic) via Model Context Protocol (MCP)
- **Hosting**: GCP (Cloud Run for API, Cloud Storage for frontend)
- **Testing**: Vitest, React Testing Library

**Important**: Do NOT suggest Bun-specific code yet. It's listed in plans but not implemented.

---

## Repository Structure

```
genshin.dungeon.studio/
├── apps/
│   ├── web/          # React frontend (Vite)
│   └── api/          # Hono backend
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── game-data/    # Static game data (characters, weapons, artifacts)
├── infrastructure/   # Deployment scripts, Terraform
├── docs/             # Project documentation
└── .github/          # CI/CD workflows, instructions
```

---

## Code Style Guidelines

### TypeScript
- ✅ **Strict mode enabled** - No implicit any, strict null checks
- ✅ **No `any` types** - Use `unknown` and type guards instead
- ✅ **Explicit types for function returns** - Especially for exported functions
- ✅ **Use type imports** - `import type { ... }` for types-only imports
- ❌ **No class components** - Use functional components only
- ❌ **No enums** - Use const objects or union types instead

### React
- ✅ **Functional components** with TypeScript interfaces for props
- ✅ **Named exports** - `export function ComponentName()`
- ✅ **Props interfaces** named `ComponentNameProps`
- ✅ **Use hooks** - useState, useEffect, useMemo, useCallback appropriately
- ✅ **Early returns** for conditional rendering

### File Naming
- `kebab-case.tsx` for files
- `PascalCase` for components
- `camelCase` for functions, variables
- `SCREAMING_SNAKE_CASE` for constants

### Code Organization
- Keep functions small and focused (< 50 lines ideally)
- One component per file
- Co-locate tests with source files: `Component.tsx` + `Component.test.tsx`
- Group related features in `features/` directory

---

## Testing Requirements

### Approach: Test-Driven Development (TDD)
1. Write test first (or alongside implementation)
2. Implement feature to make test pass
3. Refactor while keeping tests green

### Testing Framework
- **Test runner**: Vitest
- **React testing**: @testing-library/react
- **Assertions**: Vitest matchers + @testing-library/jest-dom

### Coverage Expectations
- **Critical paths**: 80%+ coverage
- **Utilities/helpers**: 90%+ coverage
- **UI components**: Test user interactions, not implementation details

### Test Structure
```typescript
describe('ComponentName', () => {
  it('does expected behavior', () => {
    // Arrange, Act, Assert
  });
});
```

---

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code restructuring without behavior change
- `style:` - Formatting, no code change
- `chore:` - Maintenance tasks, dependencies

### Examples
```
feat(collection): add character card component
fix(api): handle missing Firebase credentials gracefully
test(teams): add tests for team validation logic
docs: update setup guide with testing phase
```

---

## Pull Request Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `chore/description` - Maintenance
- `docs/description` - Documentation

### PR Guidelines
1. **One PR = One Feature** - Keep PRs focused and atomic
2. **Good PR Titles** - Use conventional commit format (becomes commit message)
3. **Descriptive Body** - Bullet points of what changed and why
4. **Reference Issues** - Use "Closes #X" or "Addresses #X"
5. **Self-Review** - Review your own PR before requesting review

### Merge Strategy
- **Squash and merge** - All PR commits become one commit on develop
- PR title + body become the final commit message
- Keep commit history clean: 1 feature = 1 commit

### Before Merging
- ✅ All tests pass
- ✅ No linting errors
- ✅ TypeScript compiles without errors
- ✅ Code is formatted with Prettier
- ✅ PR description is accurate

---

## Platform Compatibility

**Critical**: This project must work on Windows, macOS, and Linux.

### ❌ NEVER Use
- `rm -rf` (use Turborepo clean or cross-platform tools)
- `&&` for sequential commands (use pnpm scripts instead)
- Hardcoded paths with `/` or `\`
- OS-specific environment variables

### ✅ ALWAYS Use
- Node.js `path` module for paths
- Cross-platform packages (e.g., `rimraf`, `del-cli`) if shell commands needed
- pnpm scripts for task orchestration
- Turborepo for build/test/lint tasks

---

## Code Review Focus Areas

When reviewing code or PRs, pay special attention to:

1. **Type Safety**
   - No `any` types
   - Proper null/undefined handling
   - Type guards where needed

2. **Testing**
   - Tests exist for new features
   - Tests are meaningful (not just for coverage)
   - Tests use Testing Library best practices

3. **Performance**
   - Avoid unnecessary re-renders (useMemo, useCallback)
   - Lazy load routes/components
   - Proper Firestore query optimization

4. **Security**
   - No hardcoded secrets/API keys
   - Proper input validation
   - Firebase security rules configured

5. **Cross-Platform**
   - No OS-specific commands
   - Paths use Node.js path module

6. **Consistency**
   - Follows established patterns
   - Matches existing code style
   - Uses shared types from packages/types

---

## Common Patterns

### Shared Types
```typescript
// Import from shared package
import type { Character, Team } from '@genshin/types';
```

### API Client Calls
```typescript
// Use try-catch for error handling
try {
  const response = await fetch('/api/characters');
  const data = await response.json();
} catch (error) {
  console.error('Failed to fetch characters:', error);
}
```

### React Components
```typescript
interface CharacterCardProps {
  character: Character;
  onClick?: () => void;
}

export function CharacterCard({ character, onClick }: CharacterCardProps) {
  return (
    <div onClick={onClick}>
      <h3>{character.name}</h3>
    </div>
  );
}
```

---

## When Suggesting Code

### Do
- ✅ Suggest tests alongside implementation
- ✅ Use TypeScript strictly
- ✅ Follow existing project structure
- ✅ Consider cross-platform compatibility
- ✅ Reference documentation in docs/
- ✅ Keep suggestions focused and minimal

### Don't
- ❌ Suggest libraries not in package.json without asking
- ❌ Use deprecated React patterns (classes, lifecycle methods)
- ❌ Skip error handling
- ❌ Ignore TypeScript errors
- ❌ Suggest Bun-specific code (not implemented yet)
- ❌ Make OS-specific assumptions

---

## Current Phase: Infrastructure Setup

We're currently in **Phase 1** - establishing monorepo foundation.

**Next steps** (don't implement these yet, but be aware):
1. Set up frontend with Vite + React
2. Set up backend with Hono
3. Add testing framework
4. Implement authentication
5. Build collection management
6. Create team builder UI
7. Integrate AI chat

**When suggesting features**: Always check if dependencies/infrastructure exist first. If suggesting a feature from later phases, mention prerequisites.

---

## Questions to Ask

If you're unsure about:
- New dependencies → Ask before suggesting
- Architecture decisions → Reference docs/SETUP_GUIDE.md
- Breaking changes → Explain trade-offs
- Alternative approaches → Present options with pros/cons

---

## Success Metrics

Good code in this project:
- ✅ Has tests that pass
- ✅ Is type-safe (TypeScript strict mode)
- ✅ Works on all platforms
- ✅ Follows established patterns
- ✅ Is well-documented (inline comments for complex logic)
- ✅ Has a clear, focused purpose

---

*These instructions will evolve as the project matures. Last updated: Phase 1 (Infrastructure Setup)*
