<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Schema versioning conventions

Boundaries, file layouts, and naming for versioned serialisation in this
repository. For why versioning works this way, see
[Understanding schema versioning](../explanation/understanding-schema-versioning.md).
For the steps, see [Add a schema version](../how-tos/add-schema-version.md).

---

## Boundary taxonomy

| Boundary            | Shared medium          | Version travels                             | Skew window                                     |
| ------------------- | ---------------------- | ------------------------------------------- | ----------------------------------------------- |
| Firestore documents | Database collection    | In band, `version` field                    | Until all documents are backfilled              |
| Local storage       | Browser origin storage | In band, `persist` version                  | Until the user clears it or a build migrates it |
| REST API            | HTTP                   | Out of band, `profile` media type parameter | Until all clients are updated                   |
| Queue / event bus   | Message broker         | In band, `version` field                    | Until all consumers drain the queue             |
| Cache               | Redis / Memcache / CDN | In band, `version` field                    | Until TTL expires or cache is flushed           |

The skew window determines how many old writer versions the reader must
tolerate. For why REST alone versions out of band, see
[Understanding schema versioning](../explanation/understanding-schema-versioning.md#the-two-role-model).

---

## Implementation: Firestore

Firestore repositories in `apps/api/src/repositories/` use Verzod.

```text
schemas/
  v0.ts          V0ConceptSchema, V0Concept, v0 descriptor
  v1.ts          V1ConceptSchema, V1Concept, v1 descriptor, up() migration
  index.ts       entity, CURRENT_VERSION, re-exports of versioned types
document.ts      fromDocument(), toDocument() — the public boundary
```

`toDocument()` is the strict writer; `fromDocument()` delegates to
`entity.safeParse()`, which detects the version, validates, and walks the
`up()` chain to the current shape.

### Naming

| Tier              | Pattern                         | Example                      |
| ----------------- | ------------------------------- | ---------------------------- |
| Zod schema object | `V{n}ConceptSchema`             | `V1CharacterSchema`          |
| TypeScript type   | `V{n}Concept` for every version | `V0Character`, `V1Character` |
| Verzod descriptor | `v{n}`                          | `v0`, `v1`                   |
| Verzod entity     | `entity`                        | `entity`                     |
| Version constant  | `CURRENT_VERSION`               | `CURRENT_VERSION`            |

Version numbers appear on every exported type—there's no unversioned
`Character` because "latest" changes meaning silently when a new version ships.

---

## Implementation: Local storage (zustand persist)

The `apps/web` stores that use zustand's `persist` middleware version their
snapshots the same way, without Verzod—`persist` owns version dispatch. Each
store keeps a Zod schema per version under
`src/features/.../schemas/v{n}.ts`, stamps every write through `persist`'s
`version`, and validates the old snapshot in `migrate` when the store reloads.
`migrate` drops records that no longer satisfy the domain model; a signed-in
user re-merges from the server afterward, so a dropped local record is never a
real loss.

---

## Implementation: REST API

The `profile` media type parameter on `Content-Type` and `Accept` carries the
version, naming a JSON Schema served at its own URL.
[DSGEP-003](../explanation/dsgep-003-json-schema-strategy.md) decides that
mechanism; [DSGEP-005](../explanation/dsgep-005-schema-direction-segment.md)
decides the `{method}-{direction}-v{n}` schema paths under
`apps/api/src/profiles/json-schema/{module}/`.

A route declares its **acceptor set** as the profile list passed to
`negotiateContent([...])` for responses and `negotiateRequestSchema([...])`
for request bodies. Adding a version to that list widens what the route
accepts; removing one narrows it. A client that names no `profile` gets the
first entry, so the current version leads the list.

The strict write type and the union read type land on the handler.
`validateRequestBody()` validates against whichever version the client
negotiated, so a handler's body type is the union over its route's acceptor
set. Serialisation emits the current version alone.

Retiring a version withdraws it from every acceptor set and from the schema
endpoints, following DSGEP-003's [major version transition
process](../explanation/dsgep-003-json-schema-strategy.md#major-version-transition-process).

---

## Implementation: Other boundaries

Queue payloads and cache entries don't yet use this pattern. Both are in-band
boundaries like Firestore: when they're introduced, stamp every payload with a
`version` field, keep one `schemas/v{n}.ts` file per version, write a strict
serializer and a union deserializer, use the same `V{n}ConceptSchema` /
`V{n}Concept` naming convention.
