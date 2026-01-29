# GitHub Copilot Instructions for genshin.dungeon.studio

> **⚠️ NOTE:** This file is FOR AI ASSISTANTS ONLY. Human contributors should not read this for code style or contribution guidelines. Instead:
>
> - See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution workflow
> - See [docs/](../docs/) for human-readable documentation
> - Rely on linters (ESLint, Prettier) and formatters for code style

---

## Project Overview

This is an AI-powered team building companion for Genshin Impact. Users can:

- Track their character collection
- Build and save team compositions
- Get personalized team recommendations via AI chat interface (Claude MCP)

**Status**: Early development - establishing foundation and infrastructure first.

**Philosophy**: Test-driven development, clean git history, cross-platform compatibility, type safety.

---

## Tech Stack

### Current (Phase 1-2 Completed)

- **Monorepo**: Turborepo 2.7.6 + pnpm 9.15.4 workspaces
- **Language**: TypeScript 5.9.3 (strict mode)
- **Package Manager**: pnpm 9+
- **Runtime**: Node.js 20+
- **Code Formatting**: Prettier 3.8
- **Frontend**: React 19.2 + Vite 7.3 + TypeScript (basic setup complete)
- **Linting**: ESLint 9.39 with flat config format

### Planned (Phase 3+)

- **Frontend Libraries**: Tailwind CSS, shadcn/ui, react-router-dom, zustand
- **Backend**: Hono (Node.js server), may migrate to Bun runtime later
- **Database**: Firestore
- **Auth**: Firebase Authentication
- **AI**: Claude (Anthropic) via Model Context Protocol (MCP)
- **Hosting**: GCP (Cloud Run for API, Cloud Storage for frontend)
- **Testing**: Vitest, React Testing Library

**Important**:

- Do NOT suggest Bun-specific code yet. It's listed in plans but not implemented.
- ESLint 9.x uses flat config format - no `extends` property, use array spreading instead.

---

## Documentation Structure

This project follows the [Diátaxis framework](https://diataxis.fr/) for documentation organization:

- **Tutorials** (learning-oriented): Step-by-step learning experiences - not yet implemented
- **How-To Guides** (goal-oriented): Task-focused instructions → `docs/how-tos/`
- **Reference** (information-oriented): Technical descriptions → API docs, type references (future)
- **Explanation** (understanding-oriented): Conceptual discussion → Architecture docs (future)

### Documentation Locations

- `CONTRIBUTING.md` (root): Contribution workflow - focused on the "story" of contributing, not detailed tasks
- `docs/SETUP_GUIDE.md`: Initial setup tutorial
- `docs/how-tos/`: Task-specific guides (e.g., "How to add UI components")
- `docs/reference/`: Technical reference material (future)
- `docs/explanation/`: Conceptual/architectural documentation (future)

### When Creating/Updating Documentation

1. **Determine the type**: Is this teaching, task-solving, reference, or explaining?
2. **Place accordingly**: Use the Diátaxis structure
3. **Link, don't duplicate**: Reference external docs (like Diátaxis itself) rather than summarizing
4. **Keep CONTRIBUTING.md focused**: Extract detailed tasks to how-tos, link back

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
- ✅ **No non-null assertions** - Use proper null checks instead of `!`
- ✅ **Path aliases configured** - Use `@/` for src imports (configured in tsconfig + vite)
- ❌ **No class components** - Use functional components only
- ❌ **No enums** - Use const objects or union types instead

### ESLint (v9.x Flat Config)

- ✅ **Use array export** - `export default [...]` not `defineConfig([...])`
- ✅ **Spread configs** - `...tseslint.configs.recommended` not `extends: [...]`
- ✅ **Use `ignores`** - Top-level `{ ignores: ['dist'] }` not `globalIgnores()`
- ❌ **No `eslint/config` imports** - These don't exist in ESLint 9.x

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

7. **Documentation Accuracy**
   - Code examples in docs match actual implementation
   - Export patterns are consistent (prefer named exports)
   - Phase/status markers are up-to-date
   - Cross-platform commands in all documentation

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

## Current Phase: Frontend Dependencies

We're currently in **Phase 2** - basic frontend is set up, now adding dependencies.

**Completed**:

- ✅ Phase 1: Monorepo infrastructure (Turborepo + pnpm)
- ✅ Phase 2a: Basic Vite + React 19 + TypeScript setup (PR #80)

**Next steps** (in priority order):

1. Issue #81: Configure Dependabot for dependency management
2. Issue #22: Install core frontend dependencies (react-router, zustand, etc.)
3. Issue #20: Configure Tailwind CSS
4. Issue #21: Set up shadcn/ui
5. Set up backend with Hono
6. Add testing framework (Vitest)
7. Implement authentication
8. Build collection management
9. Create team builder UI
10. Integrate AI chat

**When suggesting features**: Always check if dependencies/infrastructure exist first. If suggesting a feature from later phases, mention prerequisites.

---

## Handling PR Reviews

When addressing Copilot PR review comments:

1. **Fetch inline comments** - Use `gh api repos/.../pulls/{pr}/comments` to see all review feedback
2. **Prioritize issues** - Critical (breaks build) > Consistency > Suggestions
3. **Batch fixes** - Group related changes in single commits
4. **Verify changes** - Run `pnpm build` and `pnpm lint` after fixes
5. **Update docs** - If code examples in docs are wrong, fix them too

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

_These instructions will evolve as the project matures. Last updated: Phase 2 (Basic Frontend Setup Complete - PR #80)_
