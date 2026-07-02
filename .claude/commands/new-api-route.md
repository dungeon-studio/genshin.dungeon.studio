---
description: Scaffold a new Hono API route
argument-hint: '[resource] [methods]'
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# New API route

Follow the conventions in
[`code-generation.instructions.md`](../../.github/copilot/code-generation.instructions.md)
and the [REST API conventions](../../docs/reference/rest-api-conventions.md).

Add a new REST resource route to `apps/api`. Use an existing route such as
[`characters.ts`](../../apps/api/src/routes/characters.ts) as a reference.

## Inputs

- Resource name (plural, lowercase): **$1**
- HTTP methods needed: **$2**

## Requirements

1. Create `apps/api/src/routes/$1.ts`, one file per resource with a kebab-case
   file name.
2. Start the file with the SPDX header.
3. Follow the REST conventions:
   - Resource-oriented paths: `/api/$1`.
   - Correct HTTP method semantics.
   - Use `HTTPException` for errors; the global error handler in
     [`app.ts`](../../apps/api/src/app.ts) formats responses as RFC 9457
     Problem Details (`application/problem+json`).
   - Use cursor-based pagination for list endpoints (`limit` and `cursor`).
4. Wire the route into [`app.ts`](../../apps/api/src/app.ts) with
   `app.route('/api/$1', ...)`, alongside the other `app.route()` calls and
   before the `app.route('/', root(app))` registration (root discovers the
   other routes, so it must stay last).
5. Keep handlers thin; extract business logic into separate modules.
6. Run `pnpm turbo run typecheck` to verify the route compiles.
