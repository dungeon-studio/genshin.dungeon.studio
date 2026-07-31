<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Code conventions

Conventions for how code in this repository is named, organized, and documented. For the contribution workflow itself, see [CONTRIBUTING.md](../../CONTRIBUTING.md).

---

## Code comments

Comments are the exception, not the rule. Don't restate what the code does—the reader can read it. Earn each comment by capturing what the code can't show: the _why_ behind it.

Warranted cases:

- Decisions and trade-offs—why you chose this approach
- Workarounds—temporary fixes with issue references
- Performance-sensitive code—explain the optimization
- External dependencies—integration quirks or API specifics

## Documentation strings

Reach for a documentation string when a name alone can't convey a module or function's purpose or contract. State what it's for and when to use it over an alternative. Inline comments explain _why_ a line works. A documentation string explains _what_ an interface is for.

## Documentation strategy

When documenting decisions or conventions, prefer the highest-priority location that fits:

1. **Inline comments**: explain _why_ code works a certain way.
2. **Documentation strings**: explain module or function purpose when the name isn't sufficient.
3. **`docs/`**: task-specific how-tos, references, and explanations following the [Diátaxis](https://diataxis.fr/) framework.
4. **`CONTRIBUTING.md`**: high-level human workflow guidance and project conventions.
5. **`.github/copilot-instructions.md`**: AI-specific decision rules.

Avoid duplicating the same guidance across multiple locations. Place it once at the most appropriate level and link to it from others.

## Naming conventions

Use descriptive, specific names for files and modules. Avoid generic names like "helpers." For example, name a shared test auth module `auth-requests.ts`, not `helpers.ts`.

## Shared types

Branded types in `packages/domain/` each get their own file (for example, `uuid.ts`, `iso-timestamp.ts`). Export both the type and any related validation functions from the same file.

## Test utilities

Shared API test utilities live in `apps/api/src/test/` with descriptive file names. The build excludes this directory via `tsconfig.build.json`.

---

## Platform compatibility

This project runs on Windows, macOS, and Linux.

- Use Node.js `path` module for paths, not hardcoded `/` or `\`
- Use cross-platform approaches for file operations
- Avoid OS-specific environment variables
