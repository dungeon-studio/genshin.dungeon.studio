<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# GitHub Copilot instructions for genshin.dungeon.studio

> AI-only guidance for decision-making context. Linters and CONTRIBUTING.md handle the rest.

## Tech stack

- Turborepo + pnpm, TypeScript 5.9 strict mode
- **Web**: React 19 + Vite + Tailwind + shadcn/ui, zustand, TanStack Query, react-router-dom
- **API**: Hono + Node.js
- **Testing**: Not yet installed (Vitest and React Testing Library planned)

## DevContainers tools

**Pre-installed in base image** (`mcr.microsoft.com/devcontainers/typescript-node:20`):

- Node.js 20, npm, git

**Via features and postCreateCommand**:

- GitHub CLI, pre-commit, Vale via features
- pnpm 9.15.4 via npm in postCreateCommand
- reuse-tool v6.2.0 via `pipx` in postCreateCommand—a Python application installed in isolated environment
- Project dependencies and hooks via pnpm install and pre-commit install

## Not yet implemented

- Firestore, Firebase Auth, Claude MCP, Vitest, React Testing Library, Bun

## Google Cloud Platform strategy

**Projects:** three GCP projects follow the pattern `dungeon-studio-genshin-{env}`:

- **shared** (27 chars): Terraform state bucket, Workload Identity Federation (WIF) pool/provider
- **core** (27 chars): Common resources (Domain Name System, shared services) used across environments
- **dev** (30 chars): Development environment resources

Future staging and production projects: create at the 0.1.0 and 1.0.0 milestones respectively.

**Environment labeling:** the `environment` label indicates infrastructure tier and availability requirements, not deployment stage:

- **`production`**: Production-grade infrastructure requiring high availability: state storage, authentication, and shared services. Applies to shared and core projects because they contain production-critical infrastructure used by all deployment stages.
- **`dev`/`staging`**: Environment-specific resources for development or pre-production testing.

Apply labels at creation via `gcloud alpha projects update --update-labels=environment=VALUE`.

**API activation strategy:** enable APIs on-demand when implementing features, not upfront. Issues annotate required APIs—for example, #32 requires `storage.googleapis.com`. If Terraform or Cloud Build errors mention missing APIs, enable via `gcloud services enable API_NAME`.

## Documentation audiences

- **CONTRIBUTING.md**: For human contributors. High-level workflow, links to how-tos for details. Skip CI architecture and technical internals. Keep lean and linked—prefer links to existing guides over duplicating content to avoid bloat.
- **`copilot-instructions.md`**: For AI decision-making. Include technical details, CI architecture, hook behavior, dependencies, constraints.
- **docs/**: Task-specific guides organized by the [Diátaxis framework](https://diataxis.fr/). Currently contains how-tos; tutorials, reference, and explanation sections planned.

When adding documentation, consider the audience and place information accordingly.

## Repository structure

- **packages/types**: Shared types across apps
- **packages/game-data**: Static game data: characters, artifacts, reactions, weapons. Source of truth: wiki. Version = game version. Use exported helpers like `getCharacterById()`; never hard-code. Accuracy validated via manual local development; add automated tests when a test suite exists.
- **apps/web**: React frontend
- **`apps/api`**: Hono API server

## Module & package patterns

**Module philosophy:** packages are runtime modules with behavior, not just type definitions. Think Haskell-style: types include methods, behavior, and encapsulation—not just interfaces. This means:

- Emit JavaScript alongside declarations (no `emitDeclarationOnly`)
- Provide both `types` and `default` exports in package.json
- Include `main` field pointing to compiled .js entry
- Pattern matches `@genshin/game-data` for consistency

**Module extraction (Don't Repeat Yourself, or DRY, principle):** when you see the same code pattern repeated 3+ times, extract it to a reusable module. This applies to both application code and infrastructure:

- **TypeScript/React:** extract shared utilities, hooks, or components
- **Terraform:** create modules for repeated resource patterns—for example, `github_oidc_bindings` eliminates duplicate WIF binding code across projects

**Benefits:** reduces boilerplate, enforces consistency, makes updates easier by changing code in one place.

**Runtime module configuration:** workspace packages that other packages import need:

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "default": "./dist/index.js"
  }
},
"main": "./dist/index.js"
```

## State & storage patterns

- **UI state**: zustand
- **Server state**: TanStack Query
- **Persistent**: `localStorage`, Progressive Web App planned long-term
- **Long-term**: Firestore, planned
- Game data: Import from `@genshin/game-data`, use helpers

**Date serialization:** use International Organization for Standardization (ISO) 8601 strings (`string`), never `Date` objects, for JSON serialization compatibility. Type all timestamp fields (`createdAt`, `updatedAt`, etc.) as `string`.

## API & error handling

- HTTP status codes with error messages that explain how to fix the problem
- Logging: console.log today; structured JSON logging planned for Observability tools/Grafana Cloud
- Frontend: try/catch with console.error

## Testing

- Not yet configured (Vitest planned)
- When implemented: co-locate with source (Component.tsx + Component.test.tsx), group by function/method
- Coverage targets: 80%+ core, 90%+ utilities
- Manual local validation required before push

## Dependencies

- package.json is source of truth
- After changes: `pnpm install` + commit pnpm-lock.yaml
- Every import must exist in dependencies/devDependencies
- Don't add without asking

## Pre-commit hooks

**Never bypass pre-commit hooks** with `--no-verify`. If hooks fail, fix the underlying issues:

- Fix prose for Vale errors
- Rerun linters with `--fix`
- Resolve TypeScript errors
- Move secrets to environment variables

Local pre-commit hooks run automatically on every commit (except TypeScript check, which requires manual invocation via `pnpm typecheck`). When pre-commit.ci runs on PRs, it skips ESLint, Stylelint, and TypeScript checks—GitHub Actions handles these. Bypassing these checks masks problems that CI catches.

**Vale accept list:** for legitimate tool/package names that Vale flags as spelling errors, such as Stylelint or Markdownlint, add them to `.styles/config/vocabularies/Project/accept.txt` rather than rewording documentation. This maintains accuracy.

**Vale workflow:** vale fails the commit only on errors, but fix issues in this order:

1. **Resolve as many suggestions as possible**: These improve documentation quality with minimal effort: parentheses usage, acronym definitions, passive voice, word choice
2. **Resolve all warnings**: Important for professional documentation: adverbs, sentence length, acronyms, colon capitalization, future tense
3. **Fix all errors**: Non-negotiable for commit to succeed: contractions, 'e.g.' vs 'for example', profanity flags, term violations

Focus on making as many improvements as reasonable rather than doing the bare minimum to pass.

**Third-party Vale styles**: `vale sync` generates everything in `.styles/` except `.styles/config/`, which you shouldn't modify. Don't modify these files.

**Software Package Data Exchange (SPDX) headers**: all source files require SPDX headers (see [add-spdx-headers.md](../../docs/how-tos/add-spdx-headers.md)). Declare files without comment syntax in `.reuse/dep5`. The reuse pre-commit tool enforces compliance. Don't remove `.reuse/` from `.prettierignore`.

## Git workflow

**Never use `git commit --amend` or `git push --force`**. This repository uses squash merge, so:

- Each commit can be rough; pre-commit hooks catch issues
- If hooks fail, make a new commit with fixes rather than amending
- All commits become one on merge anyway
- Force pushes rewrite history and can lose work

Just commit fixes normally and push. Amend/force-push workflows are unnecessary overhead here.

## File naming conventions

- **Non-React TypeScript**: lowercase single words (`user.ts`, `team.ts`), camelCase compounds (`teamMember.ts`)
- **React components**: PascalCase (`HomePage.tsx`, `Layout.tsx`, `ChatPage.tsx`)
- **shadcn/ui components**: lowercase (`button.tsx`, `card.tsx`) - follows their convention

## When suggesting code

Follow these guidelines:

- Test alongside code
- Use strict TypeScript
- Apply domain-driven design principles
- Maintain game-data accuracy
- Verify docs match code
- Make sure code works cross-platform
- Include Software Package Data Exchange headers in new files

## Shell script standards

All bash scripts should follow these standards for reliability and safety:

- **Error handling**: Use `set -euo pipefail` at the start to catch errors in piped commands, fail on undefined variables, and exit on first error
- **Debugging output**: Enable `set -x` for visibility during development and debugging. Don't embed secrets in scripts; use environment variables instead.
- **Network resilience**: Use `curl -fsSL` to fail on HTTP errors and network issues
- **Security**: Don't include credentials, API keys, or sensitive data directly in scripts. Pass these via environment variables or secure configuration.
- **Example**:

  ```bash
  #!/bin/bash
  # SPDX-FileCopyrightText: 2026 Your Name
  # SPDX-License-Identifier: MIT
  set -euo pipefail
  set -x
  # Your commands here
  ```

The `.devcontainer/postCreateCommand.sh` script serves as the centralized location for all DevContainers provisioning. Add new tools and setup steps there. See issue #219 for extension patterns.

## Documentation preference hierarchy

When explaining decisions or complex patterns, prefer this order:

1. **Inline comments** - In the actual code where you make decisions
2. **Documentation strings** - On functions/classes/modules when inline isn't sufficient
3. **Updates to existing docs** - Modify CONTRIBUTING.md or existing how-tos if applicable
4. **New long-form documentation** - Only create if none of these fit

<!-- vale alex.Condescending = NO -->

Rationale: comments stay with code through refactors. Long form documentation gets stale and duplicates linter-enforced rules.

<!-- vale alex.Condescending = YES -->

## Documentation accuracy

Documentation must reflect the current repository state (`HEAD`), not aspirations:

- **Verify existence:** check package.json dependencies before documenting a tool as "installed" or "configured"
- **Use accurate names**: Package names should match actual imports (for example, "TanStack Query" for `@tanstack/react-query`, not "react-query")
- **Mark future plans**: Explicitly note unimplemented features as "planned" or "not yet installed" rather than documenting as if they exist
- **Test commands**: Verify that documented commands (`pnpm test`, `pnpm dev`) actually work in the current codebase

When in doubt, grep the codebase or check package files rather than assuming.

## When unsure

- Check GitHub Issues/Milestones first
- Ask before adding dependencies
- Check the codebase rather than assuming

## Terraform & Infrastructure

**Version consistency:** keep the same Terraform version across all workflows and tools:

- `.github/workflows/terraform-plan.yml`
- `.github/workflows/terraform-apply.yml`
- `.github/workflows/pre-commit.yml` (if using Terraform)

Current version: **1.9.0**. Update all three locations when upgrading Terraform to maintain consistent formatting, validation, and plan/apply behavior across local development and CI/CD pipelines.
