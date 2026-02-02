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

### Current phase 1-2 completed

- **monorepo**: Turborepo 2.7.6 + pnpm 9.15.4 workspaces
- **Language**: TypeScript 5.9.3 in strict mode
- **Package Manager**: pnpm 9+
- **Runtime**: Node.js 20+
- **Code Formatting**: Prettier 3.8
- **Frontend**: React 19.2 + Vite 7.3 + TypeScript, basic setup complete
- **Linting**: ESLint 9.39 with flat config format

### Planned phase 3+

- **Frontend Libraries**: Tailwind CSS, shadcn/ui, react-router-dom, zustand
- **API server**: Hono on Node.js, may migrate to Bun runtime later
- **Database**: Firestore
- **Auth**: Firebase Authentication
- **AI**: Claude by Anthropic via Model Context Protocol, MCP
- **Hosting**: Google Cloud Platform (GCP), including GCP Cloud Run and GCP Cloud Storage
- **Testing**: Vitest, React Testing Library

### Important

- **Canonical Version Source**: Pin tool versions to exact versions in [package.json](../package.json) `devDependencies` for hermetic deployments. Dependabot manages updates automatically. Use `package.json` as the source of truth.
- **Pre-commit Prettier**: The `mirrors-prettier` repo may lag behind the `package.json` Prettier version. Pin the pre-commit check to the latest available `mirrors-prettier` tag, even if it's older than `package.json`.
- **Pre-commit.ci skip list**: `ci.skip` should only include checks run in GitHub Actions. Keep it in sync with the workflow check list to avoid duplicate checks.
- **pre-commit/action**: `extra_args` only accepts one check id at a time. Use separate steps for multiple checks.
- **Turborepo globs**: `globalDependencies` doesn't support negated patterns such as `!**/.env.example`.
- **GitHub Actions allowlist**: Organization-level Actions policies can block workflows. If CI fails with permission errors for actions, check org-level allowlists before changing workflows.
- Don't suggest Bun-specific code yet. It's listed in plans but not implemented.
- ESLint 9.x uses flat config format. Don't use `extends`; use array spreading instead.

---

## Documentation structure

This project follows the [Diátaxis framework](https://diataxis.fr/) for documentation organization.

- **Tutorials**: Learning-oriented, step-by-step experiences. Planned.
- **How-to guides**: Goal-oriented task instructions. Location: `docs/how-tos/`.
- **Reference**: Technical descriptions such as API docs and type references. Planned.
- **Explanation**: Conceptual discussion such as architecture notes. Planned.

### Documentation locations

- `README.md` at the root is **for users deciding if the project fits their needs**. See README standard below.
- `CONTRIBUTING.md` at the root covers the contribution workflow and the story of contributing, not detailed tasks.
- `docs/how-tos/` contains task-specific guides, for example "How to set up manually without DevContainers."
- `docs/reference/` holds technical reference material.
- `docs/explanation/` holds conceptual and architectural documentation.
- **GitHub Issues and Milestones** are the source of truth for planning, phases, and the implementation roadmap.

<!-- vale Microsoft.Headings = NO -->

### README standard

<!-- vale Microsoft.Headings = YES -->

The README should help humans **identify, evaluate, and use** the project. Follow [ddbeck's README checklist](https://github.com/ddbeck/readme-checklist):

1. **Identify** the project name, address, and maintainer at the top.
2. **Evaluate** what it does. Focus on benefits rather than the tech stack. Cover who it's for and the status or maturity.
3. **Use** a quick start that emphasizes DevContainers. List prerequisites if any.
4. **Engage** with links to docs, support, and contributing. Include the license.

**Key principle**: the README shouldn't contain development roadmaps, architecture details, or tech stack justification. Those belong in:

- Tech details: `copilot-instructions.md` or `docs/explanation/`. Planned for later.
- Development roadmap: GitHub Issues/Milestones
- Code organization: CONTRIBUTING.md or GitHub repo browser
- Setup complexity: docs/how-tos/

**What not to put in README**:

- ❌ "Planned features" checklists
- ❌ Project structure diagrams
- ❌ Tech stack decisions, save for architecture docs
- ❌ Detailed development phase or roadmap sections beyond a short status like "Pre-Alpha"
- ✅ Instead, link to GitHub Issues for roadmap and CONTRIBUTING.md for setup

### When creating or updating documentation

1. **Determine the type**. Decide whether this is teaching, task solving, reference, or explaining.
2. **Place accordingly**. Use the Diátaxis structure.
3. **Link, don't duplicate**. Reference external docs such as Diátaxis itself rather than summarizing.
4. **Keep CONTRIBUTING.md focused**. Move detailed tasks to how-to guides and link back.
5. **Planning vs. documentation**

   - ❌ Don't document development phases, implementation plans, or future features in markdown docs
   - ✅ Track phases and planning in GitHub Issues and Milestones
   - ✅ Documentation should describe what **exists now**, not what's planned

6. **Unimplemented features**

   - ❌ Don't document features as working if they're not implemented yet
   - ✅ Either omit them entirely or explicitly mark them as "when implemented" with a link to the relevant issue
   - ✅ If suggesting a feature that doesn't exist, create or reference the GitHub issue for it

7. **DevContainers priority**

   - ✅ When DevContainers exist, emphasize them as the primary recommended path
   - ✅ Document manual setup as an alternative in `docs/how-tos/manual-setup.md`

8. **Documentation hygiene**
   - ✅ Keep docs lean. Remove or avoid low-signal guides until there are real, recurring issues to document
   - ✅ Use line-level Vale suppression comments for known false positives such as license badges
   - ✅ After pre-commit reports Vale issues, run Vale manually to catch warnings and suggestions once you fix errors

---

<!-- vale Microsoft.Headings = NO -->

## DevContainer configuration

<!-- vale Microsoft.Headings = YES -->

### pnpm store mount

**Don't use volume mounts for pnpm store** in devcontainer.json. Named Docker volumes mount with root ownership, causing EACCES permission errors for the `node` user.

```jsonc
// ❌ DO NOT DO THIS - causes permission errors
"mounts": [
  "source=genshin-pnpm-store,target=${containerWorkspaceFolder}/.pnpm-store,type=volume"
]
```

Instead, let pnpm use its default store location in the container. The first `pnpm install` is slower, but subsequent operations within the same container session use the cache normally.

---

## Repository structure

```text
genshin.dungeon.studio/
├── apps/
│   ├── web/          # React frontend with Vite
│   └── api/          # Hono API server
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── game-data/    # Static game data such as characters, weapons, and artifacts
├── infrastructure/   # Deployment scripts and Terraform
├── docs/             # Project documentation
└── .github/          # CI and CD workflows plus instructions
```

---

## Code style guidelines

### TypeScript

- ✅ **Strict mode enabled** - No implicit any, strict null checks
- ✅ **No `any` types** - Use `unknown` and type guards instead
- ✅ **Explicit types for function returns** - Especially for exported functions
- ✅ **Use type imports** - `import type { ... }` for types-only imports
- ✅ **No non-null assertions** - Use proper null checks instead of `!`
- ✅ **Path aliases configured** - Use `@/` for `src` imports, configured in `tsconfig` and Vite
- ❌ **No class components** - Use functional components only
- ❌ **No `enums`** - Use `const` objects or union types instead

### ESLint v9.x flat config

- ✅ **Use array export** - `export default [...]` not `defineConfig([...])`
- ✅ **Spread configs** - `...tseslint.configs.recommended` not `extends: [...]`
- ✅ **Use `ignores`** - Top-level `{ ignores: ['dist'] }` not `globalIgnores()`
- ❌ **No `eslint/config` imports** - These don't exist in ESLint 9.x

### React

- ✅ **Functional components** with TypeScript interfaces for props
- ✅ **Named exports** - `export function ComponentName()`
- ✅ **Props interfaces** named `ComponentNameProps`
- ✅ **Use hooks** - `useState`, `useEffect`, `useMemo`, `useCallback` appropriately
- ✅ **Early returns** for conditional rendering

### File naming

- `kebab-case.tsx` for files
- `PascalCase` for components
- `camelCase` for functions, variables
- `SCREAMING_SNAKE_CASE` for constants

### Code organization

- Keep functions small and focused, ideally under 50 lines
- One component per file
- Co-locate tests with source files: `Component.tsx` + `Component.test.tsx`
- Group related features in the `features/` directory

---

## Testing requirements

### Approach: Test-driven development

1. Write tests first or alongside implementation
2. Implement the feature to make the test pass
3. Refactor while keeping tests green

### Testing framework

- **Test runner**: Vitest
- **React testing**: @testing-library/react
- **Assertions**: Vitest `matchers` + @testing-library/jest-dom

### Coverage expectations

- **Critical paths**: 80%+ coverage
- **Utilities and helpers**: 90%+ coverage
- **UI components**: Test user interactions, not implementation details

### Test structure

```typescript
describe('ComponentName', () => {
  it('does expected behavior', () => {
    // Arrange, Act, Assert
  });
});
```

---

## Detailed contribution workflow

This section provides technical guidance for implementing features and fixes.

### 1. Feature development process

#### Branch creation

```bash
git checkout -b feature/description  # Use kebab-case
```

**Test-driven development**
Write tests before or alongside implementation:

```typescript
// apps/web/src/features/[feature]/ComponentName.test.tsx
describe('ComponentName', () => {
  it('expected behavior description', () => {
    // Arrange
    const data = { /* test data */ };
    // Act
    render(<ComponentName {...data} />);
    // Assert
    expect(screen.getByRole('heading', { name: /name/i })).toBeInTheDocument();
  });
});
```

Then implement to make the test pass:

```typescript
// apps/web/src/features/[feature]/ComponentName.tsx
export function ComponentName(props: ComponentNameProps) {
  return <div>{/* implementation */}</div>;
}
```

**Quality checks**
Run these before committing:

```bash
pnpm format                # Auto-format code with Prettier
pnpm tsc --noEmit         # Type check without emitting
pnpm test                 # Run all tests
pnpm lint                 # Run ESLint
```

### 2. Commit message convention

Follow [Conventional Commits](https://www.conventionalcommits.org/).

```text
<type>(<scope>): <description>

[optional body explaining why]

[optional footer: Closes #123]
```

**Types**:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code restructuring without behavior change
- `style:` - Formatting, no code change
- `chore:` - Maintenance tasks and dependencies

**Examples**:

```text
feat(collection): add character card component

- Creates reusable CharacterCard component
- Styled with Tailwind CSS
- Includes test coverage

Closes #42
```

```text
fix(api): handle missing Firebase credentials gracefully

Throws helpful error message instead of crashing.
```

### 3. Pull request workflow

#### Push and create pull request

```bash
git push -u origin feature/description
gh pr create --title "feat: Add character card component" \
  --body "Addresses #42

Changes:
- ComponentName component
- Tests for user interactions
- Integration with existing code"
```

**Pull request title format**: should match the commit message format and becomes the squash merge commit message.

**Merge strategy**: the repository uses squash merge, so all pull request commits become one commit.

**Before merge checklist**:

- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Format code with Prettier
- ✅ Tests cover critical paths, 80%+
- ✅ Pull request description is accurate

### 4. Testing standards

**Coverage targets**:

- **Critical paths**, core business logic: 80%+ coverage
- **Utilities and helpers**: 90%+ coverage
- **UI components**: Test user interactions and accessibility, not implementation details

**Testing philosophy**: use [React Testing Library](https://testing-library.com/). Query by how users interact, not by internal structure.

```typescript
// ❌ Bad: testing implementation details
container.querySelector('.character-card');
getByTestId('card-wrapper');

// ✅ Good: testing user experience
screen.getByRole('heading', { name: /character name/i });
screen.getByText('Pyro');
```

---

## Debugging GitHub Actions failures and quality issues

### ❌ Never assume; always verify

When GitHub Actions stops passing or quality checks don't pass:

1. **Fetch actual error logs** - Don't guess. Use GitHub CLI to get real data:

   ```bash
   gh run view --log <run-id>  # Get full GitHub Actions logs
   gh pr view <number> --comments  # Get PR review comments
   ```

2. **Root cause analysis** - The first error symptom often masks the real issue:

   - Frozen pnpm-lock.yaml errors usually mean dependencies changed but weren't committed
   - Type errors might point to a missing export or incorrect type definition
   - **Lint failures** should fix at the source, not work around

3. **Check pre-commit hooks locally** - Before pushing, verify all checks pass locally:

   ```bash
   # These run automatically on git commit, but can run manually:
   pnpm format      # Prettier formatting
   pnpm typecheck   # TypeScript type checking
   pnpm lint        # ESLint checking
   pnpm test        # Test suite
   ```

### Quality standards: All checks must pass

**Fix errors, warnings, and suggestions** - Don't skip any quality issues:

- **Vale linting**: Fix errors, warnings, and suggestions
- **ESLint**: Fix all errors and warnings, including performance and best-practice rules
- **TypeScript**: No `any` types, no type errors, strict mode throughout
- **Prettier**: Format all code automatically—use `pnpm format` to fix issues
- **Pre-commit hooks**: All must pass before committing. They check formatting, secrets, and linting

**Example of incomplete quality work:**

```bash
# ❌ Bad: Only fix errors, ignore warnings
vale docs/  # Shows 5 errors, 12 warnings, 30 suggestions
# → Only fixes the 5 errors, pushes with warnings still present

# ✅ Good: Fix all issues
vale docs/  # Shows 5 errors, 12 warnings, 30 suggestions
# → Fix all 47 issues, then verify with `vale docs/` again showing zero output
```

### Dependency management

**Every import must have a corresponding package**:

- If code imports from a package, that package must be in `package.json` `devDependencies` or `dependencies`
- When adding new packages to `eslint.config.js` or other files, add them to `package.json` first
- Run `pnpm install` after updating `package.json` to update the pnpm-lock.yaml file
- Commit the pnpm-lock.yaml changes along with code changes

### Documentation must match implementation

- Don't document features that don't exist
- Don't reference patterns that differ from actual code; for example don't say "update MAINTENANCE NOTE" when files don't use that format
- If docs refer to a specific comment format, verify all files follow it or update docs to reflect reality
- Code examples in documentation must use the same patterns as actual implementation, for example use `WEAPON_STAT_TYPES.CRIT_DMG`, not string literals

---

## Pull request workflow

### Branch naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `chore/description` - Maintenance
- `docs/description` - Documentation

### Pull request guidelines

1. **One pull request equals one feature**. Keep pull requests focused and atomic.
2. **Good pull request titles**. Use the conventional commit format so it becomes the commit message.
3. **Descriptive body**. Use bullet points that explain what changed and why.
4. **Reference issues**. Use Closes #X or Addresses #X.
5. **Self-review**. Review your own pull request before requesting review.

### Merge strategy

- **Squash and merge**. All pull request commits become one commit on develop.
- The pull request title and body become the final commit message.
- Keep commit history clean. One feature equals one commit.

### Before merging

- ✅ All tests pass
- ✅ No linting errors
- ✅ TypeScript compiles without errors
- ✅ Format code with Prettier
- ✅ Pull request description is accurate
- ✅ All review comments addressed (use `gh pr view <number> --comments` to verify)
- ✅ Pre-commit hooks pass locally before pushing

### Addressing review comments

**Fetch and fix all feedback**:

1. Before pushing changes, always check for latest comments:

   ```bash
   gh api repos/OWNER/REPO/pulls/NUMBER/comments --paginate | \
     jq -r '.[] | "\(.path):\(.line) - \(.body)"'
   ```

2. Address each comment completely—don't skip suggestions:
   <!-- vale alex.ProfanityUnlikely = NO -->
   - Comments labeled "improvement" still need fixing
   - Documentation and code examples matter as much as code logic
   - Data accuracy is important; for example, correct weapon versions
   <!-- vale alex.ProfanityUnlikely = YES -->
3. Batch related fixes when possible to keep history clean

4. After fixes, verify quality checks still pass:

   ```bash
   pnpm typecheck && pnpm lint && pnpm format
   ```

---

## Platform compatibility

**Critical**: this project must work on Windows, macOS, and Linux.

### ❌ Never use

- `rm -rf`. Use Turborepo clean or cross-platform tools.
- `&&` for sequential commands. Use pnpm scripts instead.
- hardcoded paths with `/` or `\`
- OS-specific environment variables

### ✅ Always use

- Node.js `path` module for paths
- Cross-platform packages such as `rimraf` and `del-cli` when you need shell commands
- pnpm scripts for task orchestration
- Turborepo for build, test, and lint tasks

---

## Code review focus areas

When reviewing code or pull requests, pay extra attention to:

1. **Type safety**

   - No `any` types
   - Proper null/undefined handling
   - Type guards where needed

2. **Testing**

   - Tests exist for new features
   - Tests are meaningful, not just for coverage
   - Tests use Testing Library best practices

3. **Performance**

   - Avoid unnecessary re-renders with `useMemo` and `useCallback`
   - Lazy load routes and components
   - Optimize Firestore queries

4. **Security**

   - No hardcoded secrets or API keys
   - Proper input validation
   - Configure Firebase security rules

5. **Cross-platform**

   - No OS-specific commands
   - Paths use the Node.js `path` module

6. **Consistency**

   - Follows established patterns
   - Matches existing code style
   - Uses shared types from packages/types

7. **Documentation accuracy**
   - Code examples in docs match actual implementation
   - Export patterns are consistent, prefer named exports
   - Phase and status markers are up to date
   - Cross-platform commands in all documentation

---

## Common patterns

### Shared types

```typescript
// Import from shared package
import type { Character, Team } from '@genshin/types';
```

### API client calls

```typescript
// Use try-catch for error handling
try {
  const response = await fetch('/api/characters');
  const data = await response.json();
} catch (error) {
  console.error('Failed to fetch characters:', error);
}
```

### React components

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

## Code comments and local documentation

**Philosophy**: prefer inline comments in code over external documentation for explaining decisions, trade-offs, and subtle logic. Documentation should live close to the code it describes.

### When to comment

Comment liberally for:

- **Decisions and trade-offs**: Explain why you chose one approach over another
- **Subtle logic**: Complex algorithms, business rules, or hard-to-follow implementations
- **Workarounds**: Temporary fixes or browser quirks with issue or ticket references
- **Performance considerations**: Explain why you use certain patterns, such as memoization and lazy loading
- **External dependencies**: Integration points or third-party API quirks

**Examples**:

```typescript
// Memoize to prevent unnecessary re-renders since characters array changes frequently
// from Firebase updates. This is a known bottleneck for large collections with 100+ characters.
const memoizedCharacters = useMemo(() => characters.map((c) => new Character(c)), [characters]);

// Firebase listener doesn't trigger on subcollection changes, so we need to
// manually refetch when teams change. See https://github.com/firebase/firebase-js-sdk/issues/1234.
const handleTeamUpdate = useCallback(async () => {
  await refetchCharacters();
}, []);

// Work around Vite's CommonJS plugin limitation with dynamic imports.
// Can be removed once we upgrade to Vite 6+
const config = await import('./config.js').then((m) => m.default);
```

### When not to comment

Don't comment for:

- **Self-documenting code**: `const isValidEmail = email.includes('@')` needs no comment
- **Straightforward iterations or assignments**: `teams.map(t => t.characters)` is clear
- **Inferred type information**: TypeScript types already document intent
- **Trivial error handling**: Standard try-catch patterns don't need explanation

**Bad examples** of unnecessary comments:

```typescript
// ❌ Loop through teams
teams.forEach(team => {
  // ❌ Render team card
  return <TeamCard key={team.id} />;
});

// ❌ Set loading state
setLoading(true);
```

### Comment format

Use clear, conversational English.

```typescript
// Bad: Too terse
// calc avg dmg from artifacts

// Good: Explains the why and what explicitly
// Calculate average damage across all artifacts to handle Firestore
// pagination limit of 20 docs. See performanceTests.md for benchmarks.
const avgDamage = calculateAverageDamage(artifacts);
```

---

<!-- vale Microsoft.Headings = NO -->

## When suggesting code

<!-- vale Microsoft.Headings = YES -->

### Do

- ✅ Suggest tests alongside implementation
- ✅ Use TypeScript in strict mode
- ✅ Follow existing project structure
- ✅ Consider cross-platform compatibility
- ✅ Reference documentation in docs/
- ✅ Keep suggestions focused and minimal

<!-- vale alex.ProfanityUnlikely = NO -->

- ✅ Maintain data accuracy; for example correct game versions and weapon stats

<!-- vale alex.ProfanityUnlikely = YES -->

- ✅ Use constants instead of string literals for maintainability
- ✅ Verify code examples in documentation match implementation patterns

### Don't

- ❌ Suggest libraries not in package.json without asking
- ❌ Use deprecated React patterns such as classes and lifecycle methods
- ❌ Skip error handling
- ❌ Ignore TypeScript errors
- ❌ Suggest Bun-specific code that isn't implemented yet
- ❌ Make OS-specific assumptions
- ❌ Use inconsistent patterns across the same codebase
- ❌ Document features as working if they aren't implemented yet
<!-- vale alex.ProfanityUnlikely = YES -->

---

## Continuous integration and delivery, plus security scanning

### Workflow patterns and maintenance

GitHub Actions workflows should include maintenance notes documenting when to update them:

- When you add new programming languages to the monorepo
- When build processes change and require custom build steps
- When you add new workspaces with different languages and runtime systems

**Example**: see `.github/workflows/codeql.yml` for the maintenance notes pattern. Copy this structure to other workflows to keep them synchronized with the monorepo's evolving architecture.

### Security scanning schedule alignment

Coordinate security scanning schedules across tools for operational consistency:

- **CodeQL**: Configured with `schedule: { day: 'friday', time: '18:00' }`
<!-- vale Google.Parens = NO -->
- **Dependabot**: Runs Friday at 18:00 Coordinated Universal Time (UTC) for aligned security updates
<!-- vale Google.Parens = YES -->
- New security scanning tools should use the same schedule when possible

This reduces notification fatigue and simplifies monitoring windows.

## Dependabot maintenance

**Important**: when adding new workspaces or packages to the monorepo, update `.github/dependabot.yml` to include them.

- **New app**, for example `apps/api`: Add an npm entry with the directory path `/apps/api` and appropriate semantic groups
- **New package**, for example `packages/utils`: Add an npm entry with the directory `/packages/{name}`
- **New language or ecosystem**, for example Python or Go: Add a new package-ecosystem entry
- **New workflows**: Covered by the `github-actions` package-ecosystem entry with `directory: '/'` that scans workflows for action updates

See the maintenance section in `.github/dependabot.yml` for detailed instructions and examples. Without updating Dependabot, new workspaces won't get automated dependency updates.

**When suggesting features**: always check if dependencies or infrastructure exist first. Reference GitHub Issues and Milestones for current phase requirements and blocking dependencies.

---

## Handling pull request reviews

When addressing Copilot pull request review comments:

1. **Fetch inline comments**. Use `gh api repos/.../pulls/{pr}/comments --paginate` to see all review feedback in all review cycles.
2. **Prioritize comprehensively**. Address all issues, not just critical ones. Suggestions for improvement and consistency matter as much as bug fixes.
3. **Batch fixes**. Group related changes in single commits when possible to keep history clean.
4. **Verify changes**. Run full quality checks after fixes:

   ```bash
   pnpm typecheck && pnpm lint && pnpm format
   ```

5. **Update docs**. If code examples in docs are wrong, fix them alongside the code changes.
6. **Fetch fresh feedback** before pushing. Copilot may add additional comments as review cycles progress. Use `gh pr view <number> --comments` to check for the latest feedback.
7. **Iterate systematically**. If there are multiple review cycles, address each cycle completely before pushing the next batch of fixes.

**Key principle**: Address all review feedback comprehensively. Comments marked as "suggestion" or "improvement" aren't optional—they represent opportunities for code quality and consistency.

<!-- vale Google.Parens = NO -->
<!-- vale Google.Colons = NO -->

## Questions to ask

<!-- vale Google.Parens = YES -->
<!-- vale Google.Colons = YES -->

If you're unsure about:

- New dependencies. Ask before suggesting.
- Architecture decisions. Reference docs/SETUP_GUIDE.md.
- Breaking changes. Explain trade-offs.
- Alternative approaches. Present options with advantages and disadvantages.

---

## Success metrics

Good code in this project:

- ✅ Has tests that pass
- ✅ Is type-safe. Use TypeScript strict mode.
- ✅ Works on all platforms
- ✅ Follows established patterns
- ✅ Is well-documented. Use inline comments for complex logic.
- ✅ Has a clear, focused purpose

---

These instructions evolve as the project matures. Last updated: phase 2, Basic Frontend Setup Complete, PR #80
