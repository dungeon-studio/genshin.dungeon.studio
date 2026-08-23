<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Schema versioning conventions

Boundaries, file layouts, and naming for versioned serialisation in this
repository. For why versioning works this way, see
[Understanding schema versioning](../explanation/understanding-schema-versioning.md).
For the steps, see [Add a schema version](../how-tos/add-schema-version.md).

---

## Boundary taxonomy

| Boundary            | Shared medium          | Skew window                                     |
| ------------------- | ---------------------- | ----------------------------------------------- |
| Firestore documents | Database collection    | Until all documents are backfilled              |
| Local storage       | Browser origin storage | Until the user clears it or a build migrates it |
| REST API            | HTTP                   | Until all clients are updated                   |
| Queue / event bus   | Message broker         | Until all consumers drain the queue             |
| Cache               | Redis / Memcache / CDN | Until TTL expires or cache is flushed           |

The skew window determines how many old writer versions the reader must tolerate.

Where the version travels differs by boundary. Firestore documents, local
storage, queue payloads, and cache entries stamp it in the payload. REST
carries it out of band, in the `profile` media type parameter, because HTTP
already has a negotiation mechanism and the body stays free of metadata.

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

REST bodies carry no `version` field. The version travels out of band, in the
`profile` media type parameter on `Content-Type` and `Accept`, naming a JSON
Schema served at its own URL. See
[DSGEP-003](../explanation/dsgep-003-json-schema-strategy.md) for the
discovery mechanism and the rationale for keeping metadata out of the body,
and [DSGEP-005](../explanation/dsgep-005-schema-direction-segment.md) for the
`{method}-{direction}-v{n}` schema path convention.

The acceptor set is declared per route, as the profile list passed to
`negotiateContent([...])` for responses and `negotiateRequestSchema([...])`
for request bodies. Adding a version to a list widens what that route accepts;
removing one narrows it. A client that sends no `profile` gets the first entry,
so the current version leads the list.

The strict-write / union-read split holds at the handler types.
`validateRequestBody()` validates the body against whichever version the
client negotiated, so a handler's body type is the union over the versions its
route accepts. Serialisation emits the current version alone—a response shape
is never a superset assembled from several versions.

Retiring a version means withdrawing it from the route's list and from the
schema endpoints, which is the major version transition process in
[DSGEP-003](../explanation/dsgep-003-json-schema-strategy.md#major-version-transition-process).

---

## Implementation: Other boundaries

Queue payloads and cache entries don't yet use this pattern. Both are in-band
boundaries like Firestore: when they're introduced, stamp every payload with a
`version` field, keep one `schemas/v{n}.ts` file per version, write a strict
serializer and a union deserializer, use the same `V{n}ConceptSchema` /
`V{n}Concept` naming convention.
