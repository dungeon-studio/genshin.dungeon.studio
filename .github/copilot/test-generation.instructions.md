<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Test generation instructions

## Framework (planned)

The project plans to use **Vitest** as the test runner and **React Testing
Library** for component tests. Generate tests targeting this stack.

## File placement

- Colocate test files next to source files: `foo.ts` → `foo.test.ts`,
  `HomePage.tsx` → `HomePage.test.tsx`.
- Use the `.test.ts` / `.test.tsx` suffix, not `.spec`.

## Structure

- Use `describe` blocks that mirror the module or component name.
- Use `it` (not `test`) for individual cases.
- Write test names as plain-English sentences starting with a verb:
  `it('returns characters filtered by element')`.
- Follow Arrange → Act → Assert within each test.

## Assertions

- Prefer `expect(...).toBe()` for primitives, `expect(...).toEqual()` for
  objects and arrays.
- Use `expect(...).toMatchInlineSnapshot()` sparingly and only for small,
  stable outputs.
- Avoid snapshot tests for UI components; assert on behavior and accessible
  roles instead.

## React component tests

- Query by accessible role or label: `screen.getByRole('heading')`,
  `screen.getByLabelText('Email')`.
- Avoid querying by test ID unless no accessible alternative exists.
- Use `userEvent` over `fireEvent` for realistic interactions.
- Test behavior (what the user sees and does), not implementation details.

## Data and mocking

- Use `@genshin/game-data` helpers to build realistic test fixtures.
- Mock network calls at the fetch/adapter level, not inside library internals.
- Prefer small, focused mocks; avoid mocking modules you own when integration
  tests suffice.

## SPDX

- Start every test file with the standard SPDX header.
