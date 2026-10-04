---
status: accepted
date: 2026-04-04
decision-makers: Alex Brandt
amends: ADR-0003
---

<!-- vale Microsoft.HeadingAcronyms = NO -->

# Schema paths include request/response direction segment

<!-- vale Microsoft.HeadingAcronyms = YES -->

## Context and problem statement

[ADR-0003](adr-0003-json-schema-strategy.md) defines schema paths as `/schemas/{module}/{name}/{version}.json`. The `{name}` segment carries only the HTTP method (for example, `get`, `patch`). This works when each method has at most one schema, but breaks down when a method needs both a request and a response schema. For example, a PATCH operation may have a distinct request schema (the partial update body) and a distinct response schema (the full resource representation). Without a direction component, there is no slot to distinguish them.

ADR-0003 also set a source file layout using nested directories per module and name. During implementation, the codebase adopted a flatter convention: schema files live directly under `apps/api/src/profiles/json-schema/{module}/` with filenames like `get-response-v1.ts` and serving paths like `/profiles/json-schema/profile/get-response-v1.json`. This embeds both the HTTP method and the direction in the filename, making request and response schemas distinguishable without additional directory nesting.

The codebase has seven schema modules across five domain modules (`root`, `profile`, `characters`, `teams`, `weapons`). The gap between the ADR-0003 convention and the implementation surfaced during review of PR #478.

## Decision drivers

- A PATCH endpoint may define both a request schema and a response schema, so the path needs a direction discriminator.
- Each schema name should describe itself without inspecting its parent directory or its contents.
- The convention should match what the codebase already implements.

## Considered options

- Flat `{method}-{direction}-v{n}` filenames per module
- A nested directory per method with a direction subdirectory
- The ADR-0003 convention, with direction left implicit

## Decision outcome

Chosen option: flat `{method}-{direction}-v{n}` filenames per module. The ADR-0003 path convention changes from:

```text
/schemas/{module}/{name}/{version}.json
```

to:

```text
/profiles/json-schema/{module}/{method}-{direction}-v{n}.json
```

Where:

- `{module}` matches the domain module name (for example, `profile`, `characters`)
- `{method}` is the lowercase HTTP method (for example, `get`, `put`, `patch`, `post`)
- `{direction}` is either `request` or `response`
- `{n}` is a shorthand version number (for example, `1`, `2`)

### Examples

```text
GET /profiles/json-schema/profile/get-response-v1.json       → profile GET response schema v1
GET /profiles/json-schema/profile/patch-request-v1.json       → profile PATCH request body schema v1
GET /profiles/json-schema/characters/put-request-v1.json      → character PUT request body schema v1
GET /profiles/json-schema/teams/put-request-v1.json           → team PUT request body schema v1
GET /profiles/json-schema/weapons/post-request-v1.json        → weapon creation request schema v1
GET /profiles/json-schema/weapons/patch-request-v1.json       → weapon update request schema v1
GET /profiles/json-schema/root/get-response-v1.json           → API root response schema v1
```

### Source file layout

Schema source files under `apps/api/src/profiles/json-schema/` use a flat layout per module:

```text
apps/api/src/profiles/json-schema/
├── characters/
│   └── put-request-v1.ts
├── profile/
│   ├── get-response-v1.ts
│   └── patch-request-v1.ts
├── root/
│   └── get-response-v1.ts
├── teams/
│   └── put-request-v1.ts
├── weapons/
│   ├── patch-request-v1.ts
│   └── post-request-v1.ts
├── json-schema-profile.ts
├── registry.ts
└── registry.test.ts
```

File names use the pattern `{method}-{direction}-v{n}.ts`. The serving path mirrors the filename: `/profiles/json-schema/{module}/{method}-{direction}-v{n}.json`.

### Schema `$id` values

The schema route stamps `$id` at serve time using the request origin:

```json
{
  "$id": "https://api.genshin.dungeon.studio/profiles/json-schema/profile/get-response-v1.json"
}
```

### Unchanged decisions

All other decisions from ADR-0003 remain in effect:

- Schema hosting at dedicated API endpoints
- `Content-Type: application/schema+json` for schema responses
- Discovery via `profile` media type parameter on `Content-Type` and `Accept`
- Stability contract using Semantic Versioning 2.0.0
- Major version transition process

### Consequences

- Good, because every schema path communicates both the HTTP method and the message direction.
- Good, because there is no directory nesting beyond the module level.
- Good, because filenames convey method, direction, and version at a glance.
- Good, because the codebase already follows this convention, so nothing needs migrating.
- Bad, because names like `patch-request-v1.ts` are longer than ADR-0003's `patch/1.0.0.json`.
- Bad, because the shorthand `v{n}` in the path doesn't express minor or patch versions. The stability contract from ADR-0003 still applies, and a breaking change requires a new file (for example, `get-response-v2.ts`).

## Pros and cons of the options

### Flat `{method}-{direction}-v{n}` filenames

- Good, because `request` and `response` are unambiguous in an HTTP context and match the language of RFC 9110. Alternatives like `input`/`output` or `body`/`result` are less standard.
- Good, because it has fewer directories and shorter import paths than nested directories, and each filename describes itself.
- Bad, because filenames are longer, though they stay concise and regular.

### Nested directory per method with a direction subdirectory

`/profiles/json-schema/{module}/{method}/{direction}/{version}.json`, with directories like `profile/get/response/1.0.0.json`.

- Bad, because it adds two levels of nesting beyond the module, where the flat layout achieves the same disambiguation with less structure.

### ADR-0003 convention with implicit direction

Keep `/schemas/{module}/{name}/{version}.json`, where `get` implicitly means the response and methods with request bodies use names like `patch-body`.

- Bad, because implicit conventions create ambiguity. A new contributor wouldn't know whether `patch/1.0.0.json` is the request or response schema without checking the file contents.

## More information

This record formalizes the convention already implemented in the codebase. Issue [#570](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/570) moved schema modules from `src/schemas/` to `src/profiles/json-schema/` and renamed `schemaRegistry` to `jsonSchemaRegistry`, placing JSON Schema modules alongside ALPS under a unified `profiles/` directory. Alex Brandt drafted the record on 2026-03-15 and accepted it on 2026-04-04 with those paths.

- [ADR-0003](adr-0003-json-schema-strategy.md), the base decision this record amends
- [`schema-versioning.md`](../reference/schema-versioning.md), for how `v{n}` in these paths relates to the repository's wider versioning model
- [Issue #479](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/479), Schema paths include request/response direction segment
- [PR #478 discussion](https://github.com/dungeon-studio/genshin.dungeon.studio/pull/478#discussion_r2935894001), where the ambiguity surfaced
