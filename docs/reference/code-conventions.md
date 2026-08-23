<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Code conventions

Conventions for how code in this repository is named, organized, and documented. Everything here is a judgment no tool can make. What a tool can decide lives in that tool's configuration, not on this page. For the contribution workflow and the checks a pull request has to pass, see [CONTRIBUTING.md](../../CONTRIBUTING.md).

---

## Code comments

Comments are the exception, not the rule. Don't restate what the code does—the reader can read it. Earn each comment by capturing what the code can't show: the _why_ behind it.

Warranted cases:

- Decisions and trade-offs—why you chose this approach
- Workarounds—temporary fixes with issue references
- Performance-sensitive code—explain the optimization
- External dependencies—integration quirks or API specifics

## Documentation strings

Reach for a documentation string when a name and signature together can't convey a module, function, or type's contract. Inline comments explain _why_ a line works. A documentation string explains what an interface is for and how to call it correctly. Write it as a TSDoc `/** */` block directly preceding the declaration.

What it has to carry:

- **Don't restate the code.** A summary the reader could write from the signature earns nothing and rots when the code changes. Over `getCharacterById(id: CharacterId): Character | undefined`, a documentation string reading "returns the character with the given id" says less than the signature already does. What the signature can't say is that `undefined` means the roster hasn't shipped that character yet, so a caller rendering a saved build has to handle it.
- **Say when a caller reaches for this.** Where two interfaces overlap, each one names the case it serves and points at the other. Choosing between them shouldn't require reading both implementations.
- **Name the sharp edges.** Preconditions, failure modes, side effects, and ordering requirements are invisible in a type, as is anything else a caller would otherwise discover in production.

Prose carries most of what a documentation string says. A TSDoc tag earns its place when it attaches a fact to a named part of the signature:

- `@param` and `@returns`: when a name leaves the meaning open, such as a unit, a coordinate space, or a sentinel value. A `@param id - the id` line is noise.
- `@throws`: for every error the caller has to catch. TypeScript can't express this, so the documentation string is the only record.
- `@remarks`: for background that would otherwise bury the summary. Keep the first paragraph to a single sentence a reader can skim.
- `@example`: for an interface whose shape alone doesn't convey the correct call, such as one with a construction order.
- `@see`: for the specification, issue, or upstream document the behavior follows.

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

## Naming conventions

Use descriptive, specific names for files and modules. Avoid generic names like "helpers." For example, name a shared test auth module `auth-requests.ts`, not `helpers.ts`.

## Shared types

Branded types in `packages/domain/` each get their own file (for example, `uuid.ts`, `iso-timestamp.ts`). Keep the guard that narrows to the brand in that same file, so the check travels with the type.

Rules about whether a value is legal, rather than whether it's well-formed, go in a sibling `*-validation.ts`.

## React components

Colocate a small helper component in the same file as its only caller, as a private function that isn't exported. Promote it to its own file when a second caller appears.

Apply Tailwind utility classes directly rather than inline `style` objects, and merge conditional class names with `cn()` from `@/lib/utils`. A value only the browser can compute—a measured offset, a percentage from live data—is the exception.

## Tests

Structure:

- `describe` blocks mirror the module or component under test.
- Name tests as plain-English sentences starting with a verb: `it('returns characters filtered by element')`. A title opening on an acronym or a constant keeps its case: `it('PUTs the requested level')`.
- Follow Arrange, Act, Assert within each test.

Component tests query the way a user finds things—by accessible role or label (`screen.getByRole('heading')`, `screen.getByLabelText('Email')`). Reach for a test ID only when no accessible query works.

Mock network calls at the fetch or adapter boundary, not inside library internals.

For what to assert, see the testing principles in [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Test utilities

Shared API test utilities live in `apps/api/src/test/` with descriptive file names. The directory name is load-bearing: [`apps/api/tsconfig.build.json`](../../apps/api/tsconfig.build.json) and the shared ESLint config both key off the `test/` segment, so renaming it changes what ships in the build and which rules apply.

## Platform compatibility

This project runs on Windows, macOS, and Linux. CI doesn't: every runner is Linux.

- Use Node.js `path` module for paths, not hardcoded `/` or `\`
- Use cross-platform approaches for file operations
- Avoid OS-specific environment variables
