<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

<!-- vale Microsoft.Headings = NO -->

# Check for unused dependencies

<!-- vale Microsoft.Headings = YES -->

[knip](https://knip.dev) runs as a pre-commit hook on every commit, and in CI
via the `pre-commit.yml` workflow. Use this guide to reproduce its findings
directly or check changes before committing.

## Run the check

```bash
pnpm knip
```

knip analyzes the whole workspace graph at once, so it's not file-scoped. It
needs dependencies installed first:

```bash
pnpm install
```

The pre-commit hook runs the same check on every commit. To run it on demand:

```bash
pre-commit run knip --all-files
```

## What blocks a pull request

knip reports several categories at two levels, configured in `knip.jsonc`:

- **Blocking** (CI fails): unused dependencies, unused files, unlisted
  dependencies, and unlisted or unresolved binaries. These are unambiguous, so
  fix them before merge.
- **Warn** (reported, doesn't fail CI): unused exports, types, enum members,
  and duplicate exports. These surface dead code without blocking, because the
  existing surface mixes intentional public API with genuine dead code.

## Fix a finding

For an unused dependency, remove it from the offending workspace:

```bash
pnpm --filter @genshin/web remove <package>
```

For an unused file, delete it or wire it into an entry point. For a warned
unused export, remove the `export` keyword if nothing outside the file needs it.

Some findings are false positives: a binary knip can't resolve, a file reached
only at runtime, or a dependency loaded by tooling knip doesn't parse. Record
each exception in `knip.jsonc` with a comment explaining why, rather than
silencing the whole category.
