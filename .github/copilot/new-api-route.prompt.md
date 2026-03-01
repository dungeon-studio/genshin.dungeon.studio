---
description: Scaffold a new Hono API route
agent: agent
argument-hint: Resource name (plural, lowercase) and HTTP methods
tools: ['editFiles', 'codebase', 'runInTerminal']
---

# New API route

Follow the conventions in [code-generation.instructions.md](code-generation.instructions.md)
and [REST API conventions](../../docs/reference/rest-api-conventions.md).

Add a new REST resource route to `apps/api`.

Use [main.ts](../../apps/api/src/main.ts) as a reference for middleware.
The global error handler currently serializes `HTTPException` responses as
`{ "error": string, "status": "error" }` JSON; the numeric HTTP status code
is only in the HTTP response status. When the API migrates to RFC 9457
Problem Details, update these routes to match.

## Inputs

- Resource name (plural, lowercase): `${input:resource}`
- HTTP methods needed: `${input:methods}`

## Requirements

1. Create `apps/api/src/${input:resource}/routes.ts` with the route handlers.
2. Start the file with the SPDX header.
3. Follow the REST conventions:
   - Resource-oriented paths: `/api/${input:resource}`.
   - Correct HTTP method semantics.
   - Use `HTTPException` for errors; the global error handler formats the
     response.
   - Use cursor-based pagination for list endpoints (`limit` and `cursor`).
4. Wire the route into [main.ts](../../apps/api/src/main.ts) using
   `app.route()`.
5. Keep handlers thin; extract business logic into separate modules.
6. Run `pnpm typecheck` to verify the route compiles.
