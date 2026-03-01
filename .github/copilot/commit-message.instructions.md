<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Commit message instructions

Follow both **Conventional Commits** (for the type prefix) and the **seven
rules of a great Git commit message**.

## Format

```text
<type>(<optional scope>): <subject>

<optional body>

<optional footer>
```

## The seven rules

1. Separate subject from body with a blank line.
2. Limit the subject line to 50 characters.
3. Capitalize the subject line (the part after the type prefix).
4. Don't end the subject line with a period.
5. Use the imperative mood in the subject line ("Add feature," not "Added"
   or "Adds").
6. Wrap the body at 72 characters.
7. Use the body to explain **what** and **why**, not how.

## Allowed types

Use the prefixes defined in `CONTRIBUTING.md`:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `test:` adding or updating tests
- `refactor:` code restructuring
- `style:` formatting
- `chore:` maintenance

## Scopes

Use the workspace package name when the change is scoped to one package:

- `feat(web):` change in `apps/web`
- `fix(api):` change in `apps/api`
- `refactor(game-data):` change in `packages/game-data`
- `chore(types):` change in `packages/types`
- `docs:` cross-cutting documentation (no scope needed)
- `chore(infra):` Terraform and infrastructure changes

Omit the scope for cross-cutting changes that touch multiple packages.

## Examples

```text
feat(web): Add character filter to collection page

Filter characters by element and weapon type using
@genshin/game-data helpers. The filter state is managed
with a zustand store to persist selections across navigation.

Closes #42
```

```text
fix(api): Return 404 for unknown character IDs
```

```text
chore: Upgrade TypeScript to 5.9.1
```
