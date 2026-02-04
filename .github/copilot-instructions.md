<!-- vale Microsoft.Headings = NO -->

# GitHub Copilot instructions for Genshin Dungeon Studio

<!-- vale Microsoft.Headings = YES -->

> **⚠️ NOTE:** This file is for AI assistants only. Human contributors shouldn't read this for code style or contribution guidelines. Instead:
>
> - See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution workflow
> - See [docs/](../docs/) for human-readable documentation
> - Rely on linters such as ESLint and Prettier, plus formatters, for code style

---

## Project overview

This is an AI-powered team building companion for Genshin Impact. Users can:

- Track their character collection
- Build and save team compositions
- Get personalized team recommendations via an AI chat interface with Claude MCP

**Status**: early development. The focus is on foundation and infrastructure first.

**Philosophy**: test-driven development, clean git history, cross-platform compatibility, type safety.

---

## Tech stack

### Current phase 1-2

- **monorepo**: Turborepo 2.7.6 + pnpm 9.15.4
- **Language**: TypeScript 5.9.3 in strict mode
- **Runtime**: Node.js 20+
- **Frontend**: React 19.2 + Vite 7.3
- **Linting**: ESLint 9.39 with flat config format
- **Code Formatting**: Prettier 3.8

### Planned phase 3+

- **Frontend Libraries**: Tailwind CSS, shadcn/ui, react-router-dom, zustand
- **API server**: Hono on Node.js (may migrate to Bun later)
- **Database**: Firestore | **Auth**: Firebase Authentication
- **AI**: Claude via Model Context Protocol (MCP)
- **Hosting**: Google Cloud Platform (Cloud Run, Cloud Storage)
- **Testing**: Vitest, React Testing Library

### Important notes

- **Version pinning**: Use exact versions in `package.json` dev dependencies. Dependabot manages updates.
- **Pre-commit Prettier**: Pin to latest available `mirrors-prettier` tag, even if older than `package.json`.
- **Pre-commit.ci skip**: Only include checks run in GitHub Actions to avoid duplication.
- **pre-commit/action**: `extra_args` accepts one check id at a time.
- **Turborepo globs**: Doesn't support negated patterns like `!**/.env.example`.
- **GitHub Actions**: Check org-level allowlists if CI fails with permission errors.
- **Bun**: Not implemented yet, don't suggest Bun-specific code.
- **ESLint 9.x**: Uses flat config format. Use array spreading, not `extends`.

---

## Documentation structure

<!-- vale Google.Passive = NO -->
<!-- vale Microsoft.Passive = NO -->

Follows [Diátaxis framework](https://diataxis.fr/) with tutorials, how-to guides in `docs/how-tos/`, reference material, and explanations. Most sections are planned except how-to guides.

<!-- vale Microsoft.Passive = YES -->
<!-- vale Google.Passive = YES -->

### Documentation locations

- `README.md` - For users deciding if the project fits their needs
- `CONTRIBUTING.md` - Contribution workflow and story
- `docs/how-tos/` - Task-specific guides
- `docs/reference/` - Technical reference, planned
- `docs/explanation/` - Architecture and concepts, planned
- **GitHub Issues/Milestones** - Planning and roadmap

<!-- vale Microsoft.Headings = NO -->

### README standard

<!-- vale Microsoft.Headings = YES -->

Follow [ddbeck's README checklist](https://github.com/ddbeck/readme-checklist):

1. **Identify** - Project name, address, maintainer
2. **Evaluate** - What it does, who it's for, status/maturity
3. **Use** - Quick start emphasizing DevContainers
4. **Engage** - Links to docs, support, contributing, license

**Avoid in README** - planned features checklists, project structure diagrams, tech stack justifications, detailed roadmaps. Link to GitHub Issues for roadmap, CONTRIBUTING.md for setup.

### Documentation guidelines

1. **Determine type** - Teaching, task-solving, reference, or explaining
2. **Place accordingly** - Use Diátaxis structure
3. **Link, don't duplicate** - Reference external docs
4. **Keep CONTRIBUTING.md focused** - Move detailed tasks to how-to guides
5. **Document what exists now** - Track planning in GitHub Issues, not markdown docs
6. **Mark unimplemented features** - Either omit or explicitly mark "when implemented" with issue link
7. **DevContainers priority** - Emphasize DevContainers, document manual setup in `docs/how-tos/manual-setup.md`
8. **Documentation hygiene** - Keep docs lean; use line-level Vale suppression for known false positives; run Vale manually after pre-commit

---

## DevContainer notes

**pnpm store mount** - don't use volume mounts in devcontainer.json. Named volumes mount with root ownership, causing EACCES errors for `node` user. Let pnpm use default store location.

**Vite dev server** - configure to listen on all interfaces with host set to `0.0.0.0` for DevContainer access. Default `localhost` won't be reachable from host.

---

## Repository structure

```text
genshin.dungeon.studio/
├── apps/
│   ├── web/          # React frontend with Vite
│   └── api/          # Hono API server
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── game-data/    # Static game data
├── infrastructure/   # Deployment scripts and Terraform
├── docs/             # Project documentation
└── .github/          # CI/CD workflows and instructions
```

---

## Code style guidelines

### TypeScript

- ✅ Strict mode, no `any`, use `unknown` + type guards
- ✅ Explicit return types for exported functions
- ✅ Type-only imports with `import type { ... }`
- ✅ Proper null checks, no non-null assertions `!`
- ✅ Path aliases: `@/` for `src` imports
- ❌ No class components, use functional only
- ❌ No `enums`, use `const` objects or union types

### ESLint v9.x flat config

- ✅ Array export: `export default [...]`
- ✅ Spread configs: `...tseslint.configs.recommended`
- ✅ Use `ignores` at top-level: `{ ignores: ['dist'] }`
- ❌ No `extends` or `eslint/config` imports

### React

- ✅ Functional components with TypeScript interfaces
- ✅ Named exports: `export function ComponentName()`
- ✅ Props interfaces named `ComponentNameProps`
- ✅ Use hooks appropriately
- ✅ Early returns for conditional rendering
- ✅ `NavLink` for navigation to provide active state
- ✅ Add `end` prop to root route "/" to prevent showing active on all routes

### Accessibility

- ✅ Semantic HTML5 elements: `nav`, `main`, `header`, `footer`
  <!-- vale Google.Acronyms = NO -->
  <!-- vale Microsoft.Acronyms = NO -->
- ✅ ARIA labels on navigation: `<nav aria-label="Main navigation">`
- ✅ `aria-hidden="true"` on decorative emojis/icons
  <!-- vale Google.Acronyms = YES -->
  <!-- vale Microsoft.Acronyms = YES -->
- ✅ Keyboard navigation must work for all interactive elements

### Import organization

Group imports: external libraries first, then internal components, blank line between groups. Alphabetize within groups. Remove unused imports.

### File naming

- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`

### Code organization

- Keep functions under 50 lines
- One component per file
- Co-locate tests: `Component.tsx` + `Component.test.tsx`
- Group related features in `features/` directory

---

## Testing

### Approach

Test-driven development. Write tests first or alongside implementation.

### Framework

- **Runner**: Vitest
- **React**: @testing-library/react
<!-- vale Vale.Spelling = NO -->
- **Assertions** - Vitest matchers plus @testing-library/jest-dom
<!-- vale Vale.Spelling = YES -->

**Important** - before creating test files, verify testing dependencies exist in package.json. Missing dependencies cause TypeScript build errors.

### Coverage targets

- Critical paths - 80%+
- Utilities/helpers - 90%+
- UI components - test user interactions, not implementation details

### Test structure

```typescript
describe('ComponentName', () => {
  it('does expected behavior', () => {
    // Arrange, Act, Assert
  });
});
```

---

## Contribution workflow

### Branch creation

```bash
git checkout -b feature/description  # Use kebab-case
```

### Development

1. Write tests before/alongside implementation
2. Implement feature to make tests pass
3. Run quality checks:

```bash
pnpm format      # Prettier
pnpm tsc --noEmit  # Type check
pnpm test        # Run tests
pnpm lint        # ESLint
```

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <description>

[optional body]

[optional footer: Closes #123]
```

**Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`

**Example**:

```text
feat(collection): add character card component

- Creates reusable CharacterCard component
- Styled with Tailwind CSS
- Includes test coverage

Closes #42
```

### Pull request workflow

#### Branch naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `chore/description` - Maintenance
- `docs/description` - Documentation

#### Pull request guidelines

1. One pull request equals one feature
2. Use conventional commit format for title that becomes squash merge commit message
3. Descriptive body with bullet points
4. Reference issues with "Closes #X" or "Addresses #X"
5. Self-review before requesting review

#### Merge strategy

- **Squash and merge** - All commits become one on develop
- Pull request title/body becomes final commit message
- Don't amend commits during review; just make new commits because everything gets squashed

#### Before merging

- ✅ All tests pass
- ✅ No linting errors
- ✅ TypeScript compiles without errors
- ✅ Code formatted with Prettier
- ✅ Pull request description accurate
- ✅ All review comments addressed
- ✅ Pre-commit hooks pass locally

#### Addressing review comments

Respond to each comment with one of these approaches:

- "Fixed in [commit]" with link to commit
- "Won't fix because" with explanation of reasoning
- "Created #X" with link to follow-up issue

Mark conversations as resolved only after reviewer confirms or you've provided clear reasoning.

---

## Debugging GitHub Actions and quality issues

### Never assume; always verify

Fetch actual error logs using GitHub CLI:

```bash
gh run view --log <run-id>
gh run list --limit 10
```

### Quality standards

<!-- vale Microsoft.Vocab = NO -->

**All checks must pass** including errors, warnings, and suggestions. Vale shows three alert levels. Fix them all.

<!-- vale Microsoft.Vocab = YES -->

```bash
# ❌ Bad - Only fixes errors, ignores warnings
vale docs/  # Shows 5 errors, 42 suggestions
# → Only fixes 5 errors, pushes with warnings present

# ✅ Good - Fixes all issues
vale docs/  # Fix all 47 issues
vale docs/  # Verify zero output
```

### Dependency management

Check security vulnerabilities in GitHub advisory DB before adding dependencies. Use exact versions in package.json.

### Documentation must match implementation

Don't document features as working if not implemented. Either omit or mark "when implemented" with issue link.

---

## Platform compatibility

### Never use

- Platform-specific paths with `\` on Windows
- Shell-specific commands like `cmd` or PowerShell
- hardcoded platform checks

### Always use

- Cross-platform path methods like `path.join()` or `path.resolve()`
- Cross-platform commands like `npm` or `git`
- Feature detection over platform detection

---

## Code review focus areas

1. **Type safety** - No `any`, proper null checks, explicit return types
2. **Test coverage** - Critical paths 80%+, tests for user interactions
3. **Accessibility** - Semantic HTML, ARIA labels, keyboard navigation <!-- vale Google.Acronyms = NO --> <!-- vale Microsoft.Acronyms = NO -->
4. **Security** - Input validation, no secrets, dependency vulnerabilities checked
5. **Performance** - Appropriate memoization, avoid unnecessary re-renders
6. **Error handling** - Graceful failures, helpful error messages
7. **Code organization** - Functions under 50 lines, one component per file

---

## Common patterns

### Shared types

```typescript
// packages/types/src/index.ts
export interface Character {
  id: string;
  name: string;
  element: string;
}
```

### API client calls

```typescript
// Use standard fetch with error handling
const response = await fetch('/api/characters');
if (!response.ok) throw new Error('Failed to fetch');
const data = await response.json();
```

### React components

```typescript
interface ComponentProps { name: string; }
export function Component({ name }: ComponentProps) {
  return <div>{name}</div>;
}
```

---

## Code comments and local documentation

### When to comment

<!-- vale alex.Condescending = NO -->

- Reasons behind non-obvious decisions
<!-- vale alex.Condescending = YES -->
- Complex algorithms or business logic
- Workarounds for known issues, with issue links
- Public API documentation with JSDoc <!-- vale Google.Acronyms = NO --> <!-- vale Vale.Spelling = NO -->

### When not to comment

- Explanations of straightforward code
- Redundant explanations of variable names
- Commented-out code; use git history instead
- TODO comments without issue links

### Comment format

```typescript
// Single-line comments for brief explanations

/**
 * Multi-line JSDoc for public APIs
 * @param name - Parameter description
 * @returns Return value description
 */
export function publicFunction(name: string): string {
  // implementation
}
```

---

## Code suggestion guidelines

### Do

- Provide minimal, focused examples
- Show both good ✅ and bad ❌ patterns
- Include TypeScript types
- Explain reasons for choices that aren't immediately clear

### Don't

- Suggest large refactors for small issues
- Include boilerplate without explanation
- Use placeholder values without noting they're examples
- Suggest features not in tech stack

---

## Continuous integration and security

### Workflow patterns

- **pre-commit.yml** - Runs ESLint on every PR
- **build.yml** - Runs full build pipeline including type checking and build
<!-- vale Vale.Terms = NO -->
- **codeql.yml** - Security scanning
<!-- vale Vale.Terms = YES -->

Keep `.pre-commit-config.yaml` skip list in sync with workflows to avoid duplicate checks.

### Security scanning

CodeQL runs on push to develop/main and on PRs. Dependabot checks dependencies weekly and opens PRs for updates.

---

## Dependabot maintenance

Dependabot opens PRs for dependency updates. Review and merge them. For major version updates, check changelog for breaking changes.

---

## Handling pull request reviews

1. Read all comments before responding
2. Respond to each comment with action taken or reasoning
3. Ask clarifying questions if feedback is unclear
4. Mark resolved only after reviewer confirms or clear reasoning provided
5. Push follow-up commits; don't amend because squash merge handles history

---

## Questions to ask

When uncertain:

- What's the minimal change to achieve the goal?
- Are there existing patterns to follow?
- Do tests cover the critical paths?
- Does this work cross-platform?
- Are there security implications?
- Does documentation need updating?

---

## Success metrics

- All tests pass
- No linting or type errors
- 80%+ coverage on critical paths
- Pull request review approval
- Clean git history with one commit per feature
- Documentation up to date
