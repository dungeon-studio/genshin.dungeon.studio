<<<<<<< HEAD
<!-- vale Microsoft.Headings = NO -->

# GitHub Copilot instructions for Genshin Dungeon Studio

<!-- vale Microsoft.Headings = YES -->

> **⚠️ NOTE:** This file is for AI assistants only. Human contributors shouldn't read this for code style or contribution guidelines. Instead:
>
> - See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution workflow
> - See [docs/](../docs/) for human-readable documentation
> - Rely on linters such as ESLint and Prettier, plus formatters, for code style
=======
<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# GitHub Copilot instructions for Genshin Dungeon Studio
>>>>>>> develop

> AI-only guidance for decision-making context. Linters and CONTRIBUTING.md handle the rest.

<<<<<<< HEAD
## Project overview
=======
## Tech stack
>>>>>>> develop

- Turborepo + pnpm, TypeScript 5.9 strict mode
- **Web**: React 19 + Vite + Tailwind + shadcn/ui, zustand, TanStack Query, react-router-dom
- **API**: Hono + Node.js
- **Testing**: Not yet installed (Vitest and React Testing Library planned)

<<<<<<< HEAD
- Track their character collection
- Build and save team compositions
- Get personalized team recommendations via an AI chat interface with Claude MCP

**Status**: early development. The focus is on foundation and infrastructure first.

**Philosophy**: test-driven development, clean git history, cross-platform compatibility, type safety.
=======
## DevContainers tools

**Pre-installed in base image** (`mcr.microsoft.com/devcontainers/typescript-node:20`):

- Node.js 20, npm, git
>>>>>>> develop

**Via features and postCreateCommand**:

<<<<<<< HEAD
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
=======
- GitHub CLI, pre-commit, Vale (features)
- pnpm 9.15.4 (via npm in postCreateCommand)
- reuse-tool v6.2.0 (via `pipx` in postCreateCommand - Python application, installed in isolated environment)
- Project dependencies and hooks (pnpm install, pre-commit install)

## Not yet implemented

- Firestore, Firebase Auth, Claude MCP, Vitest, React Testing Library, Bun

## Documentation audiences

- **CONTRIBUTING.md**: For human contributors. High-level workflow, links to how-tos for details. Skip CI architecture and technical internals. Keep lean and linked—prefer links to existing guides over duplicating content to avoid bloat.
- **`copilot-instructions.md`** (this file): For AI decision-making. Include technical details, CI architecture, hook behavior, dependencies, constraints.
- **docs/**: Task-specific guides organized by the [Diátaxis framework](https://diataxis.fr/). Currently contains how-tos; tutorials, reference, and explanation sections planned.

When adding documentation, consider the audience and place information accordingly.

## Repository structure
>>>>>>> develop

- **packages/types**: Shared types across apps
- **packages/game-data**: Static game data (characters, artifacts, reactions, weapons). Source of truth: wiki. Version = game version. Use exported helpers (for example, `getCharacterById()`), never hard-code. Accuracy validated via manual local development; add automated tests when a test suite exists.
- **apps/web**: React frontend
- **`apps/api`**: Hono API server

<<<<<<< HEAD
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
=======
## State & storage patterns

- **UI state**: zustand
- **Server state**: TanStack Query
- **Persistent**: `localStorage` (Progressive Web App, planned long-term)
- **Long-term**: Firestore (planned)
- Game data: Import from `@genshin/game-data`, use helpers

## API & error handling

- HTTP status codes with user-actionable error messages
- Logging: console.log today; structured JSON logging planned for Observability tools/Grafana Cloud
- Frontend: try/catch with console.error

## Testing

- Not yet configured (Vitest planned)
- When implemented: co-locate with source (Component.tsx + Component.test.tsx), group by function/method
- Coverage targets: 80%+ core, 90%+ utilities
- Manual local validation required before push
>>>>>>> develop

## Dependencies

<<<<<<< HEAD
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
=======
- package.json is source of truth
- After changes: `pnpm install` + commit pnpm-lock.yaml
- Every import must exist in dependencies/devDependencies
- Don't add without asking

## Pre-commit hooks

**Never bypass pre-commit hooks** with `--no-verify`. If hooks fail, fix the underlying issues:

- Fix prose for Vale errors
- Rerun linters with `--fix`
- Resolve TypeScript errors properly
- Move secrets to environment variables

Local pre-commit hooks run automatically on every commit (except TypeScript check, which requires manual invocation via `pnpm typecheck`). When pre-commit.ci runs on PRs, it skips ESLint, Stylelint, and TypeScript checks (GitHub Actions handles these). Bypassing hooks masks problems that CI will catch.

**Vale accept list**: for legitimate tool/package names that Vale flags as spelling errors (for example, Stylelint, Markdownlint), add them to `.styles/config/vocabularies/Project/accept.txt` rather than rewording documentation. This maintains accuracy.

**Vale error handling**: Vale fails only on errors. However, handle warnings and suggestions as best as is practical:
>>>>>>> develop

- Fix all **errors** (non-negotiable: contractions, passive voice, profanity flags, etc.)
- Fix **warnings** when doing documentation work (important: adverbs, sentence length, acronyms, voice issues)
- Address **suggestions** if they improve readability without excessive effort

<<<<<<< HEAD
<!-- vale Microsoft.Headings = NO -->

## DevContainer configuration

<!-- vale Microsoft.Headings = YES -->

### pnpm store mount

**Don't use volume mounts for pnpm store** in devcontainer.json. Named Docker volumes mount with root ownership, causing EACCES permission errors for the `node` user.
=======
**Third-party Vale styles**: everything in `.styles/` except `.styles/config/` is generated by `vale sync` and will be overwritten. Don't modify these files.

**SPDX headers**: all source files require SPDX headers (see [add-spdx-headers.md](../../docs/how-tos/add-spdx-headers.md)). Files without comment syntax should be declared in `.reuse/dep5`. The reuse pre-commit hook enforces compliance. Don't remove `.reuse/` from `.prettierignore`.

## Git workflow
>>>>>>> develop

**Never use `git commit --amend` or `git push --force`**. This repository uses squash merge, so:

<<<<<<< HEAD
Instead, let pnpm use its default store location in the container. The first `pnpm install` is slower, but subsequent operations within the same container session use the cache normally.
=======
- Each commit can be rough; pre-commit hooks will catch issues
- If hooks fail, make a new commit with fixes rather than amending
- All commits become one on merge anyway
- Force pushes rewrite history unnecessarily and can lose work
>>>>>>> develop

Just commit fixes normally and push. Amend/force-push workflows are unnecessary overhead here.

<<<<<<< HEAD
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
=======
## When suggesting code

Test alongside code; strict TypeScript; domain-driven design; maintain game-data accuracy; verify docs match code; cross-platform compatible; include SPDX headers in new files.
>>>>>>> develop

## Documentation preference hierarchy

<<<<<<< HEAD
## Code style guidelines
=======
When explaining decisions or complex patterns, prefer this order:
>>>>>>> develop

1. **Inline comments** - In the actual code where decisions are made
2. **Documentation strings** - On functions/classes/modules when inline isn't sufficient
3. **Updates to existing docs** - Modify CONTRIBUTING.md or existing how-tos if applicable
4. **New long-form documentation** - Only create if none of the above fit

<<<<<<< HEAD
- ✅ **Strict mode enabled** - No implicit any, strict null checks
- ✅ **No `any` types** - Use `unknown` and type guards instead
- ✅ **Explicit types for function returns** - Especially for exported functions
- ✅ **Use type imports** - `import type { ... }` for types-only imports
- ✅ **No non-null assertions** - Use proper null checks instead of `!`
- ✅ **Path aliases configured** - Use `@/` for `src` imports, configured in `tsconfig` and Vite
- ❌ **No class components** - Use functional components only
- ❌ **No `enums`** - Use `const` objects or union types instead

### ESLint v9.x flat config
=======
<!-- vale alex.Condescending = NO -->

Rationale: Comments stay with code through refactors. Long form documentation gets stale and duplicates linter-enforced rules.
>>>>>>> develop

<!-- vale alex.Condescending = YES -->

## Documentation accuracy

<<<<<<< HEAD
- ✅ **Functional components** with TypeScript interfaces for props
- ✅ **Named exports** - `export function ComponentName()`
- ✅ **Props interfaces** named `ComponentNameProps`
- ✅ **Use hooks** - `useState`, `useEffect`, `useMemo`, `useCallback` appropriately
- ✅ **Early returns** for conditional rendering

### File naming
=======
Documentation must reflect the current repository state (HEAD), not aspirations:

- **Verify existence**: Check package.json dependencies before documenting a tool as "installed" or "configured"
- **Use accurate names**: Package names should match actual imports (for example, "TanStack Query" for `@tanstack/react-query`, not "react-query")
- **Mark future plans**: Explicitly note unimplemented features as "planned" or "not yet installed" rather than documenting as if they exist
- **Test commands**: Verify that documented commands (`pnpm test`, `pnpm dev`) actually work in the current codebase
>>>>>>> develop

When in doubt, grep the codebase or check package files rather than assuming.

<<<<<<< HEAD
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
4. **Reference issues**. Use "Closes #X" or "Addresses #X."
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

### Don't

- ❌ Suggest libraries not in package.json without asking
- ❌ Use deprecated React patterns such as classes and lifecycle methods
- ❌ Skip error handling
- ❌ Ignore TypeScript errors
- ❌ Suggest Bun-specific code that isn't implemented yet
- ❌ Make OS-specific assumptions

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

1. **Fetch inline comments**. Use `gh api repos/.../pulls/{pr}/comments` to see all review feedback.
2. **Prioritize issues**. Critical, breaks build, then consistency, then suggestions.
3. **Batch fixes**. Group related changes in single commits.
4. **Verify changes**. Run `pnpm build` and `pnpm lint` after fixes.
5. **Update docs**. If code examples in docs are wrong, fix them too.

## Questions to ask

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
=======
## When unsure

- Check GitHub Issues/Milestones first
- Ask before adding dependencies
- Verify against codebase, don't assume
>>>>>>> develop
