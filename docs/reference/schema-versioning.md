<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Schema versioning conventions

Boundaries, file layouts, and naming for versioned serialisation in this
repository. For why versioning works this way, see
[Understanding schema versioning](../explanation/understanding-schema-versioning.md).
For the steps to ship a new version, see
[Add a schema version](../how-tos/add-schema-version.md).

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

---

## Implementation: Firestore (current)

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

The committed snapshots live under `apps/web/schema-snapshots/{store}/v{n}.json`,
keyed by the `persist` store name. Each captures the **per-record entry**, not
the whole-store blob: jsoncompat can't see into a `Record` value
(`additionalProperties`), so gating the wrapper would leave the entry fields
unchecked. This matches the Firestore side, which snapshots one document rather
than the collection.

The snapshots regenerate from their Zod source through the `schemas:export` drift
hook. The base-branch widening check (`apps/api/scripts/check-schema-compat.ts`,
run in CI) scans the Firestore and local-storage snapshot roots alike: a released
version's schema may only widen.

---

## Implementation: Other boundaries

REST bodies, queue payloads, and cache entries don't yet use this pattern.
When those boundaries are introduced: stamp every payload with a `version`
field, keep one `schemas/v{n}.ts` file per version, write a strict serializer
and a union deserializer, use the same `V{n}ConceptSchema` / `V{n}Concept`
naming convention.
