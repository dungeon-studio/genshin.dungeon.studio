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
5. **`AGENTS.md`**: AI-specific decision rules.

Avoid duplicating the same guidance across multiple locations. Place it once at the most appropriate level and link to it from others.

### AI tool configuration files

`AGENTS.md` holds the AI decision rules. A tool that reads `AGENTS.md` needs no file of its own. A tool that reads only its own path gets a file pointing at `AGENTS.md`, carrying nothing but behavior specific to that tool. Claude Code is the second case today: [`CLAUDE.md`](../../CLAUDE.md) imports `AGENTS.md` and adds only rules that are false for every other agent.

A rule holding for more than one tool belongs in `AGENTS.md`.

A new root-level instruction file needs two entries before it passes the gate:

- An ignore in [`.ls-lint.yml`](../../.ls-lint.yml), which otherwise rejects the upper-case name.
- A section in [`.vale.ini`](../../.vale.ini), so Vale checks it mechanically instead of for prose voice.

## Naming conventions

Use descriptive, specific names for files and modules. Avoid generic names like "helpers." For example, name a shared test auth module `auth-requests.ts`, not `helpers.ts`.

## Shared types

Branded types in `packages/domain/` each get their own file (for example, `uuid.ts`, `iso-timestamp.ts`). Export both the type and any related validation functions from the same file.

## React components

Page and layout components use function declarations (`export function CharactersPage()`). Reserve `const` with `React.forwardRef` for `shadcn/ui` primitives.

Colocate a small helper component in the same file as its only caller, as a private function that isn't exported. Promote it to its own file when a second caller appears.

Apply Tailwind utility classes directly rather than inline `style` objects, and merge conditional class names with `cn()` from `@/lib/utils`.

## Tests

Structure:

- `describe` blocks mirror the module or component under test.
- Use `it`, not `test`.
- Name tests as plain-English sentences starting with a verb: `it('returns characters filtered by element')`.
- Follow Arrange, Act, Assert within each test.

Component tests query the way a user finds things—by accessible role or label (`screen.getByRole('heading')`, `screen.getByLabelText('Email')`). Reach for a test ID only when no accessible query works. Drive interactions with `userEvent` rather than `fireEvent`, and avoid snapshot tests for components; assert on behavior and accessible roles instead.

Mock network calls at the fetch or adapter boundary, not inside library internals.

For what to assert, see the testing principles in [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Test utilities

Shared API test utilities live in `apps/api/src/test/` with descriptive file names. The build excludes this directory via `tsconfig.build.json`.

---

## Platform compatibility

This project runs on Windows, macOS, and Linux.

- Use Node.js `path` module for paths, not hardcoded `/` or `\`
- Use cross-platform approaches for file operations
- Avoid OS-specific environment variables
