<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

<!-- vale Microsoft.HeadingAcronyms = NO -->

# DSGEP-003: JSON Schema presentation and discovery strategy

<!-- vale Microsoft.HeadingAcronyms = YES -->

- **Status**: Draft
- **Created**: 2026-03-01
- **Authors**: Alex Brandt

## Abstract

This Dungeon Studio Genshin Enhancement Proposal (DSGEP) defines how the API publishes, exposes, and versions JSON Schemas. It establishes schema hosting at dedicated API endpoints, a canonical URI pattern, a discovery mechanism using the `profile` media type parameter, and a stability contract distinguishing breaking from non-breaking changes.

## Problem statement

The REST API conventions in `rest-api-conventions.md`, specifically [Principle 4](../reference/rest-api-conventions.md), require a published JSON Schema for every request and response shape. Several planned features depend on schema discovery and URI decisions, but no architectural decision exists for:

- Where the API hosts schemas and how clients retrieve them
- What the canonical schema URI looks like
- How clients discover which schema describes a given response
- What stability guarantees published schemas carry
- What constitutes a breaking versus non-breaking schema change

Without these decisions, each feature would make ad-hoc choices, creating inconsistency in the API contract.

## Context

### Current state

The `apps/api` application is early stage, built on Hono with a small number of routes defined in `apps/api/src/main.ts`. The codebase has begun organizing domain modules: `profile` exists with a `json/` subdirectory, but modules such as `team` and `teams` aren't yet present. This DSGEP uses the target module structure in examples and implementation notes. The REST conventions reference JSON Schema 2020-12 and content negotiation via `Accept` and `Content-Type` headers.

### Relevant standards

- [JSON Schema 2020-12](https://json-schema.org/draft/2020-12): The schema vocabulary
- [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288): Web Linking, which defines `Link` header syntax and relation types
- [RFC 6906](https://www.rfc-editor.org/rfc/rfc6906): The `profile` link relation type
- [RFC 6838](https://www.rfc-editor.org/rfc/rfc6838): Media type registration, referenced by Principle 4

## Decision

### 1. Schema hosting: Dedicated API endpoints

Serve schemas from the API itself at dedicated endpoints under the `/schemas` path. Schema source files live alongside their domain module in `apps/api/src/{module}/json/schemas/{name}/` as versioned `.json` files. Each module owns the schemas for its resource representations. Every schema carries a [Semantic Versioning 2.0.0](https://semver.org/) version from initial publication.

The public endpoint uses a hierarchical namespace matching the module structure:

```text
GET /schemas/{module}/{name}/{version}.json   → specific version
GET /schemas/{module}/{name}.json             → latest version (redirect)
```

Where `{module}` matches the domain module name, `{name}` is a lowercase, hyphen-separated identifier for the schema within that module, and `{version}` is a semver version string. The unversioned path redirects to the latest version, giving clients a stable entry point. Since modules already map to public API route segments, this mirrors a structure clients already know.

Examples:

```text
GET /schemas/profile/get/1.0.0.json     → version 1.0.0 of the profile get schema
GET /schemas/profile/get.json           → redirects to latest version
GET /schemas/profile/patch/1.0.0.json   → version 1.0.0 of the profile patch schema
GET /schemas/team/get/1.2.0.json        → version 1.2.0 of the team get schema
GET /schemas/teams/member.json          → redirects to latest version
```

This avoids name collisions without requiring global naming conventions. Each module manages its own schema names and versions independently.

The API serves schemas with `Content-Type: application/schema+json` as defined by the JSON Schema specification.

<!-- vale Microsoft.HeadingAcronyms = NO -->

### 2. Schema URI structure

<!-- vale Microsoft.HeadingAcronyms = YES -->

Each schema declares a canonical `$id` using the API's production base address:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://api.genshin.dungeon.studio/schemas/team/get/1.0.0.json",
  "title": "Team",
  "type": "object",
  "properties": {}
}
```

The `$id` includes the version, making each version a distinct, immutable schema. The API endpoint path mirrors the `$id` path segment so that resolving the `$id` retrieves the schema directly.

### 3. Discovery mechanism: `profile` media type parameter

API responses include a `profile` parameter on the `Content-Type` header referencing the schema that describes the response body:

```http
HTTP/1.1 200 OK
Content-Type: application/json; profile="/schemas/team/get/1.0.0.json"

{"name": "Vaporize Core", "members": []}
```

This mirrors the client-side mechanism: clients send `Accept: application/json; profile="..."` to request a specific schema version, and the server responds with `Content-Type: application/json; profile="..."` to confirm which schema describes the response. Both directions use the same RFC 6906 `profile` semantics on the standard content negotiation headers.

This approach:

- Provides symmetric content negotiation: `profile` on `Accept` for requests and `Content-Type` for responses
- Keeps schema discovery within the standard content negotiation mechanism
- Works with HTTP's existing `Accept`/`Content-Type` negotiation model

Examples in this document use relative URI references for readability. Implementations use absolute URIs matching the `$id` of the schema.

### 4. Stability contract

Every published schema carries a [Semantic Versioning 2.0.0](https://semver.org/) version. The version communicates the nature of changes:

#### Major version: Breaking changes

Increment the major version for changes that can break existing consumers:

- Removing a property
- Renaming a property
- Changing a property's type, such as `string` to `number`
- Adding a property to the `required` array
- Narrowing a constraint, such as reducing `maxLength` or adding a `pattern`
- Removing a value from an `enum`
- Changing the structure of a nested object

#### Minor version: Non-breaking additions

Increment the minor version for backward-compatible additions:

- Adding a new **optional** property without a `required` entry
- Adding a new value to an `enum` that clients treat as extensible
- Relaxing a constraint, such as increasing `maxLength` or removing a `pattern`

#### Patch version: Documentation-only changes

Increment the patch version for changes that don't affect validation:

- Updating `title`, `description`, or `examples`
- Fixing typos in metadata fields
- Adding `$comment` annotations

#### Major version transition process

When a major version increment is necessary:

1. Publish the new version at its own endpoint, such as `/schemas/team/get/2.0.0.json`
2. Update the latest alias at `/schemas/team/get.json` to redirect to the new version
3. Previous version endpoints return a `Link` header with `rel="successor-version"` pointing to the new version (using the relation type from [RFC 5829](https://www.rfc-editor.org/rfc/rfc5829) with RFC 8288 `Link` header syntax, distinct from the `profile`-based discovery mechanism)
4. Mark the previous major version as deprecated
5. After 12 months of deprecation, remove the previous version schema endpoints (they return `410 Gone`). Resource endpoints respond with `406 Not Acceptable` when a client requests a removed schema via `profile`.

Versioned schema URIs are immutable: once published, a schema at a given version never changes for as long as it remains available. Clients pinning to a specific version can rely on its structure remaining stable throughout the deprecation period.

#### Client compatibility during transitions

During a major version transition, clients signal which representation they expect using the `Accept` header with a `profile` parameter referencing the schema URI:

```http
GET /teams/abc123 HTTP/1.1
Accept: application/json; profile="/schemas/team/get/1.0.0.json"
```

The API uses the `profile` value to determine which response shape to serve:

- If the profile matches an active schema version, the API responds with that shape and the corresponding `Content-Type: application/json; profile="..."` header
- If the profile references a deprecated schema still within the 12-month deprecation window, the API responds with the requested shape and includes a `Sunset` header ([RFC 8594](https://www.rfc-editor.org/rfc/rfc8594)) indicating when the API removes the schema version
- If the profile references a removed schema, the API responds with `406 Not Acceptable` because the resource still exists but the requested representation is no longer available. The schema endpoint itself returns `410 Gone`.
- If the client omits the profile, the API serves the latest version

This creates symmetric content negotiation: clients declare the schema they expect via `Accept`, and the server confirms the schema it used via `Content-Type`.

## Rationale

### Why dedicated endpoints over inline schemas

Inline schemas that embed `$schema` references in every response bloat payloads and mix data with metadata. Dedicated endpoints keep schemas independently cacheable, addressable, and reusable across documentation and tooling.

### Why `profile` parameter over `Link` headers

RFC 8288 `Link` headers with `rel="describedby"` are a common discovery mechanism, but they exist outside the content negotiation model. Since clients already use `profile` on `Accept` to request a specific schema version, using `profile` on `Content-Type` in the response creates symmetric negotiation. Both directions use the same parameter on the standard content negotiation headers, making the protocol easier to understand and implement.

### Why serve from the API rather than a separate host

Co-hosting schemas with the API keeps the `$id` and the retrieval address identical, avoids cross-origin complexity, and ensures schemas deploy atomically with the API code they describe. The schema files live alongside the route handlers, making it natural to update both together.

### Why semver for all schemas from the start

Versioning every schema from initial publication ensures consistency: clients always know how to interpret changes by comparing version numbers. Without upfront versioning, schemas remain unversioned until a breaking change forces a name-based distinction like `get-v2.json`, creating inconsistency between first-version schemas and later schemas. The semver model communicates the nature of a change (major, minor, patch) directly, which ad-hoc naming can't express.

## Consequences

### Positive

- **Discoverable**: Clients find schemas through standard HTTP mechanisms without out-of-band documentation
- **cacheable**: Versioned schema URIs are immutable while available, allowing aggressive caching. The latest alias uses short-lived caching to reflect updates. Negotiated API responses require `Vary: Accept` so shared caches distinguish between schema versions
- **Tooling-friendly**: Standard JSON Schema 2020-12 with a resolvable `$id` works with validators, code generators, and documentation tools
- **Atomic deployment**: Schemas deploy with the API, so they're always in sync with the routes they describe

### Negative

- **Per-response overhead**: Every response needs a `profile` parameter on `Content-Type`, requiring middleware that maps routes to schema versions
- **Schema file maintenance**: Each request and response shape needs a hand-authored schema file kept in sync with the implementation
- **Version file management**: Major version bumps require publishing a new version file and managing a transition period for the previous version

### Neutral

- **No runtime validation requirement**: This DSGEP defines schema publication and discovery. Whether the API validates incoming requests against schemas at runtime is a separate decision.

## Alternatives considered

### Alternative 1: Documentation-only schemas

**Approach**: publish schemas only in documentation, such as an OpenAPI spec, not as live API endpoints.

**Rejected because**:

- Schemas drift from actual API behavior without automated serving
- Clients can't programmatically discover schemas at runtime
- Violates Principle 4's intent that schemas are discoverable alongside representations

### Alternative 2: OpenAPI specification as the schema source

**Approach**: define schemas exclusively in an OpenAPI document and derive everything from it.

**Rejected because**:

- OpenAPI schemas use a subset of JSON Schema; some JSON Schema 2020-12 features don't map cleanly
- Couples schema publication to a specific documentation format
- The project can adopt OpenAPI later and reference the published schemas, keeping concerns separate

### Alternative 3: `Link` header with `rel="describedby"` for discovery

**Approach**: use `Link: </schemas/team/get/1.0.0.json>; rel="describedby"` headers on responses instead of the `profile` parameter on `Content-Type`.

**Rejected because**:

- Asymmetric: clients would use `profile` on `Accept` but the server would use a different mechanism, the `Link` header, in the response
- `Link` headers exist outside the content negotiation model, adding a separate discovery channel
- The `profile` parameter on `Content-Type` directly mirrors the `profile` parameter on `Accept`, creating a simpler and more consistent protocol

### Alternative 4: Ad-hoc schema naming without versions

**Approach**: keep schemas unversioned by default and use distinct file names such as `get-v2.json` only when breaking changes occur.

**Rejected because**:

- Creates inconsistency between first-version schemas (unversioned) and later schemas (ad-hoc versioned)
- Doesn't communicate whether a change is additive or breaking
- Clients can't compare version numbers to determine compatibility

## Implementation notes

### Schema file location

Schema source files live alongside their domain module:

```text
apps/api/src/
├── profile/
│   └── json/
│       └── schemas/
│           ├── get/
│           │   └── 1.0.0.json
│           └── patch/
│               └── 1.0.0.json
├── team/
│   └── json/
│       └── schemas/
│           └── get/
│               ├── 1.0.0.json
│               └── 1.1.0.json
└── teams/
    └── json/
        └── schemas/
            └── member/
                └── 1.0.0.json
```

Cross-cutting schemas live under a module named for their concern, such as `apps/api/src/health/json/` for health check shapes. Representations defined by external standards with their own media type, such as `application/problem+json` from RFC 9457, don't need project-specific schemas.

### Hono middleware

A `schemaProfile` middleware maps route patterns to schema versions and sets the `profile` parameter on the `Content-Type` header:

```typescript
// Middleware adds profile parameter to Content-Type header
app.use('/teams/*', schemaProfile('teams', 'member', '1.0.0'));
```

### Serving schema files

A Hono route serves schema files from module `json/` directories under the hierarchical `/schemas/{module}/{name}` namespace:

```typescript
// Serve specific version
app.get('/schemas/:module/:name/:version.json', async (c) => {
  // Resolve from apps/api/src/{module}/json/schemas/{name}/{version}.json
  // Serve with application/schema+json content type
});

// Latest alias — redirect to the current version
app.get('/schemas/:module/:name.json', async (c) => {
  // Determine latest version from apps/api/src/{module}/json/schemas/{name}/
  // Redirect to /schemas/{module}/{name}/{latest}.json
});
```

## References

- [`rest-api-conventions.md`](../reference/rest-api-conventions.md): Principle 4, predictable representation shapes
- [JSON Schema 2020-12](https://json-schema.org/draft/2020-12): Schema vocabulary
<!-- vale alex.Condescending = NO -->

- [RFC 5829: Link Relation Types for Simple Version Navigation](https://www.rfc-editor.org/rfc/rfc5829): `successor-version` relation type for major version transitions

<!-- vale alex.Condescending = YES -->

- [RFC 8288: Web Linking](https://www.rfc-editor.org/rfc/rfc8288): `Link` header syntax
- [RFC 8594: The Sunset HTTP Header Field](https://www.rfc-editor.org/rfc/rfc8594): `Sunset` header for communicating deprecation timelines
- [RFC 6906: The `profile` Link Relation Type](https://www.rfc-editor.org/rfc/rfc6906): `profile` parameter semantics for schema discovery
- [RFC 6838: Media Type Registration](https://www.rfc-editor.org/rfc/rfc6838): Media type conventions
- [Semantic Versioning 2.0.0](https://semver.org/): Schema version numbering convention
- [dsgep-001-wif-architecture.md](dsgep-001-wif-architecture.md): Related DSGEP

## Revision history

- 2026-03-01: Initial draft (DSGEP-003)
