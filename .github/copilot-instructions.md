<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# GitHub Copilot instructions for Genshin Dungeon Studio

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

- GitHub CLI, pre-commit, Vale (features)
- pnpm 9.15.4 (via npm in postCreateCommand)
- reuse-tool v6.2.0 (via `pipx` in postCreateCommand - Python application, installed in isolated environment)
- Project dependencies and pre-commit setup (pnpm install, pre-commit install)

## Not yet implemented

- Firestore, Firebase Auth, Claude MCP, Vitest, React Testing Library, Bun

## Google Cloud Platform (GCP) strategy

**Current project**: `dungeon-studio-genshin-dev` (display name: `develop-genshin-dungeon-studio`) hosts all develop environment resources.

Create future release and production environments as separate projects when needed (at the 0.1.0 and 1.0.0 milestones respectively), following the same naming pattern.

**Environment labeling**: apply project labels at creation via `gcloud alpha projects update --update-labels=KEY=VALUE`. (Note: `--update-labels` is currently alpha-only in gcloud; the stable `gcloud projects update` doesn't support incremental label updates.)

Label format: `environment=develop` (extends to `release` and `production` when those projects are created).

**API activation strategy**: don't enable APIs upfront. Defer until you deploy the service that needs them.

- Annotate issues with their required APIs (for example, #32 Cloud Storage → `storage.googleapis.com`).
- Enable APIs only when implementing the corresponding feature (for example, "Create Firestore database" → enable `firestore.googleapis.com`).
- If `gcloud` or Cloud Build complains about a missing API, enable it on-demand via `gcloud services enable API_NAME`.

**Infrastructure as Code (Terraform)**: manage all GCP infrastructure through Terraform, never manual gcloud commands.

- All infrastructure defined in `infrastructure/terraform/` with modules organized by bounded context (`web`, `api`, `firestore`)
- Environment-specific configuration via Terraform variable files (develop.tfvars, release.tfvars, production.tfvars)
- Store remote state in the shared GCP project's Terraform state bucket for multi-environment coordination
- Cloud Build triggers apply Terraform automatically on infrastructure changes

**Multi-environment per-resource strategy**: each environment (develop, release, production) gets its own GCP project with separate instances of all resources.

- **Benefits** include data isolation (develop Firestore never touches production), independent scaling, safe schema migrations, and clear cost tracking per environment
- **One Firestore per environment** in its respective GCP project for user data storage
- **One Cloud Storage bucket per environment** for web assets
- **One Cloud Run service per environment** for the API service
- **Promotion** uses release/production GCP projects and applies the same Terraform with environment-specific variable files

**Bounded context modules**: terraform modules organized by service/domain, not utility type.

- **`web` module**: Cloud Storage bucket, Cloud Build pipeline, Cloud DNS record
- **`api` module**: Cloud Run service, service account, IAM role bindings for Firestore/Storage access
- **`firestore` module**: Firestore database instances with environment-specific settings
- Each module encapsulates its infrastructure contract and security model
- Benefits: Cohesion (related resources stay together), clear ownership, reuse across environments

## Documentation audiences

- **CONTRIBUTING.md**: For human contributors. High-level workflow, links to how-tos for details. Skip CI architecture and technical internals. Keep lean and linked—prefer links to existing guides over duplicating content to avoid bloat.
- **`copilot-instructions.md`** (this file): For AI decision-making. Include technical details, CI architecture, check behavior, dependencies, constraints.
- **docs/**: Task-specific guides organized by the [Diátaxis framework](https://diataxis.fr/). Currently contains how-tos; tutorials, reference, and explanation sections planned.

When adding documentation, consider the audience and place information accordingly.

## Repository structure

- **packages/types**: shared types across apps
- **packages/game-data**: static game data (characters, artifacts, reactions, weapons). Source of truth: wiki. Version = game version. Use exported helpers (for example, `getCharacterById()`), never hard-code. Accuracy validated via manual local development; add automated tests when a test suite exists.
- **apps/web**: React frontend
- **`apps/api`**: Hono API server

## Module & package patterns

**Module philosophy**: packages are runtime modules with behavior, not just type definitions. Think Haskell-style: types include methods, behavior, and encapsulation—not just interfaces. This means:

- Emit JavaScript alongside declarations (no `emitDeclarationOnly`)
- Provide both `types` and `default` exports in package.json
- Include `main` field pointing to compiled .js entry
- Pattern matches `@genshin/game-data` for consistency

**Runtime module configuration**: workspace packages that other packages import need:

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

- **UI state** uses zustand
- **Server state** uses TanStack Query
- **Persistent** storage uses `localStorage` (Progressive Web App, planned long-term)
- **Long-term** storage uses Firestore (planned)
- Game data: import from `@genshin/game-data`, use helpers

**Date serialization**: use ISO 8601 strings (`string`), never `Date` objects, for JSON serialization compatibility. All timestamp fields (`createdAt`, `updatedAt`, etc.) should be typed as `string`.

## API & error handling

- HTTP status codes with user-actionable error messages
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

Local pre-commit hooks run automatically on every commit (except TypeScript check, which requires manual invocation via `pnpm typecheck`). When pre-commit.ci runs on PRs, it skips ESLint, Stylelint, and TypeScript checks (GitHub Actions handles these). Bypassing hooks masks problems that CI catches.

**Vale accept list**: for legitimate tool/package names that Vale flags as spelling errors (for example, Stylelint, Markdownlint), add them to `.styles/config/vocabularies/Project/accept.txt` rather than rewording documentation. This maintains accuracy.

**Vale error handling**: vale fails only on errors. However, handle warnings and suggestions as best as is practical:

- Fix all **errors** (non-negotiable: contractions, passive voice, profanity flags, etc.)
- Fix **warnings** when doing documentation work (important: adverbs, sentence length, acronyms, voice issues)
- Address **suggestions** if they improve readability without excessive effort

**Third-party Vale styles**: everything in `.styles/` except `.styles/config/` is generated by `vale sync` and is overwritten. Don't modify these files.

**SPDX headers**: all source files require SPDX headers (see [add-spdx-headers.md](../../docs/how-tos/add-spdx-headers.md)). Files without comment syntax should be declared in `.reuse/dep5`. The reuse pre-commit check enforces compliance. Don't remove `.reuse/` from `.prettierignore`.

## Git workflow

**Never use `git commit --amend` or `git push --force`**. This repository uses squash merge, so:

- Each commit can be rough; pre-commit hooks catch issues
- If hooks fail, make a new commit with fixes rather than amending
- All commits become one on merge anyway
- Force pushes rewrite history and can lose work

Just commit fixes normally and push. Amend/force-push workflows are unnecessary overhead here.

## File naming conventions

- **Non-React TypeScript** (types, models, utilities): lowercase single words (`user.ts`, `team.ts`), camelCase compounds (`teamMember.ts`)
- **React components**: PascalCase (`HomePage.tsx`, `Layout.tsx`, `ChatPage.tsx`)
- **shadcn/ui components**: lowercase (`button.tsx`, `card.tsx`) - follows their convention

## When suggesting code

Test alongside code; strict TypeScript; domain-driven design; maintain game-data accuracy; verify docs match code; cross-platform compatible; include SPDX headers in new files.

## Shell script standards

All bash scripts should follow these standards for reliability and safety:

- **Error handling**: use `set -euo pipefail` at the start to catch errors in piped commands, fail on undefined variables, and exit on first error
- **Debugging output**: enable `set -x` for visibility during development and debugging. Don't embed secrets in scripts; use environment variables instead.
- **Network resilience**: use `curl -fsSL` to fail on HTTP errors and network issues
- **Security**: don't include credentials, API keys, or sensitive data directly in scripts. Pass these via environment variables or secure configuration.
- **Example**: use this template:

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

1. **Inline comments** - In the actual code where decisions are made
2. **Documentation strings** - On functions/classes/modules when inline isn't sufficient
3. **Updates to existing docs** - Modify CONTRIBUTING.md or existing how-tos if applicable
4. **New long-form documentation** - Only create if none of the above fit

<!-- vale alex.Condescending = NO -->

Rationale: comments stay with code through refactors. Long form documentation gets stale and duplicates linter-enforced rules.

<!-- vale alex.Condescending = YES -->

## Documentation accuracy

Documentation must reflect the current repository state (HEAD), not aspirations:

- **Verify existence**: check package.json dependencies before documenting a tool as "installed" or "configured"
- **Use accurate names**: package names should match actual imports (for example, "TanStack Query" for `@tanstack/react-query`, not "react-query")
- **Mark future plans**: explicitly note unimplemented features as "planned" or "not yet installed" rather than documenting as if they exist
- **Test commands**: verify that documented commands (`pnpm test`, `pnpm dev`) actually work in the current codebase

When in doubt, grep the codebase or check package files rather than assuming.

## When unsure

- Check GitHub Issues/Milestones first
- Ask before adding dependencies
- Verify against codebase, don't assume
