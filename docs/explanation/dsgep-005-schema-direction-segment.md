<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

<!-- vale Microsoft.HeadingAcronyms = NO -->

# DSGEP-005: Schema paths include request/response direction segment

<!-- vale Microsoft.HeadingAcronyms = YES -->

- **Status**: Accepted
- **Created**: 2026-03-15
- **Accepted**: 2026-04-04
- **Authors**: Alex Brandt
- **Amends**: [DSGEP-003](dsgep-003-json-schema-strategy.md)

## Abstract

This Dungeon Studio Genshin Enhancement Proposal (DSGEP) amends the schema path convention established in [DSGEP-003](dsgep-003-json-schema-strategy.md). The original convention uses `/schemas/{module}/{name}/{version}.json`, where `{name}` is a method-scoped identifier like `get` or `patch`. The HTTP method alone doesn't distinguish request from response. This DSGEP replaces that convention with `/profiles/json-schema/{module}/{method}-{direction}-v{n}.json`, embedding both the HTTP method and the message direction (`request` or `response`) in the schema name. This matches the convention already implemented in the codebase.

## Problem statement

DSGEP-003 defines schema paths as `/schemas/{module}/{name}/{version}.json`. The `{name}` segment carries only the HTTP method (for example, `get`, `patch`). This works when each method has at most one schema, but breaks down when a method needs both a request and a response schema. For example, a PATCH operation may have a distinct request schema (the partial update body) and a distinct response schema (the full resource representation). Without a direction component, there is no slot to distinguish them.

## Context

DSGEP-003 was accepted with the path convention `/schemas/{module}/{name}/{version}.json` and a source file layout using nested directories per module and name. During implementation, the codebase adopted a flatter convention: schema files live directly under `apps/api/src/profiles/json-schema/{module}/` with filenames like `get-response-v1.ts` and serving paths like `/profiles/json-schema/profile/get-response-v1.json`. This embeds both the HTTP method and the direction in the filename, making request and response schemas distinguishable without additional directory nesting.

The codebase has seven schema modules across five domain modules (`root`, `profile`, `characters`, `teams`, `weapons`). This gap between the DSGEP-003 convention and the implementation surfaced during review of PR #478.

## Decision

Amend the DSGEP-003 path convention from:

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

The schema route stamps `$id` at serve time using the request origin, as established in DSGEP-003:

```json
{
  "$id": "https://api.genshin.dungeon.studio/profiles/json-schema/profile/get-response-v1.json"
}
```

### Unchanged decisions

All other decisions from DSGEP-003 remain in effect:

- Schema hosting at dedicated API endpoints
- `Content-Type: application/schema+json` for schema responses
- Discovery via `profile` media type parameter on `Content-Type` and `Accept`
- Stability contract using Semantic Versioning 2.0.0
- Major version transition process

## Rationale

### Why embed direction in the filename

The direction is a necessary discriminator: a PATCH endpoint may define both a request schema and a response schema. Including `request` or `response` in the name makes each schema self-describing. The flat layout avoids extra directory nesting while keeping paths short and readable.

### Why `request` and `response`

These terms are unambiguous in an HTTP context and match the language used in RFC 9110. Alternatives like `input`/`output` or `body`/`result` are less standard.

### Why a flat layout instead of nested directories

DSGEP-003 proposed nested directories (`{module}/{name}/{version}.json`). The flat layout with descriptive filenames (`{module}/{method}-{direction}-v{n}.ts`) is simpler: fewer directories, shorter import paths, and each filename is self-describing without needing to inspect the parent directory. The tradeoff is that filenames are longer, but they remain concise and regular.

## Consequences

### Positive

- **Unambiguous**: Every schema path communicates both the HTTP method and the message direction
- **Flat**: No extra directory nesting beyond the module level
- **Self-describing**: Filenames convey method, direction, and version at a glance
- **Already implemented**: The codebase already follows this convention, so no migration is needed

### Negative

- **Longer filenames**: Names like `patch-request-v1.ts` are longer than DSGEP-003's `patch/1.0.0.json`
- **No semver in path**: The shorthand `v{n}` in the path doesn't express minor or patch versions. The stability contract from DSGEP-003 still applies, and a breaking change requires a new file (for example, `get-response-v2.ts`)

## Alternatives considered

### Alternative 1: Nested directory per method with a direction subdirectory

**Approach**: `/profiles/json-schema/{module}/{method}/{direction}/{version}.json` with directories like `profile/get/response/1.0.0.json`.

**Rejected because**: adds two levels of nesting beyond the module. The flat layout achieves the same disambiguation with less structural complexity.

### Alternative 2: Keep DSGEP-003 convention and rely on implicit direction

**Approach**: continue using `/schemas/{module}/{name}/{version}.json` where `get` implicitly means the response and methods with request bodies use names like `patch-body`.

**Rejected because**: implicit conventions create ambiguity. A new contributor wouldn't know whether `patch/1.0.0.json` is the request or response schema without checking the file contents.

## Implementation notes

This DSGEP formalizes the convention already implemented in the codebase. Issue [#570](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/570) moved schema modules from `src/schemas/` to `src/profiles/json-schema/` and renamed `schemaRegistry` to `jsonSchemaRegistry`, placing JSON Schema modules alongside ALPS under a unified `profiles/` directory.

## References

- [DSGEP-003: JSON Schema presentation and discovery strategy](dsgep-003-json-schema-strategy.md): The base decision this DSGEP amends
- [Issue #479](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/479): Schema paths include request/response direction segment
- [PR #478 discussion](https://github.com/dungeon-studio/genshin.dungeon.studio/pull/478#discussion_r2935894001): Where the ambiguity was identified

## Revision history

- 2026-04-04: Accepted; updated paths from `/schemas/` to `/profiles/json-schema/` per #570
- 2026-03-15: Initial draft (DSGEP-005)
