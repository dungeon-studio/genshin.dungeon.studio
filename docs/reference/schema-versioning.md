<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Schema versioning conventions

Boundaries, file layouts, naming, and the automated compatibility gate for
versioned serialisation in this repository. For why versioning works this way, see
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

## Implementation: Other boundaries

REST bodies, queue payloads, and cache entries don't yet use this pattern.
When those boundaries are introduced: stamp every payload with a `version`
field, keep one `schemas/v{n}.ts` file per version, write a strict serializer
and a union deserializer, use the same `V{n}ConceptSchema` / `V{n}Concept`
naming convention.

---

## Compatibility gate

Two checks hold the versioning rules. `schema-snapshots` runs on every commit
and keeps the committed JSON Schema snapshots faithful to their Zod source.
`schema-compat` runs on every pull request and proves that each version the base
branch shipped still accepts the data stored under it.

A released version's schema may only widen. Two changes fail the gate.

**Narrowing a released version.** Add `v{n+1}` with a migration instead of
editing `v{n}`.

**Dropping a released version.** Deleting a version orphans the data still
stored under it. No exemption exists.

Versions the branch adds beyond the base carry no constraint—a new version is
free to be as strict as its domain model demands.

Without `origin/develop` present, a local `schema-compat` run compares the
branch with itself and proves nothing.

The wiring—snapshot roots, commands, base-ref resolution—lives in
`.pre-commit-config.yaml` and `apps/api/scripts/check-schema-compat.ts`. Each
app's `scripts/schema-registry.ts` lists the gated schemas and records why a
snapshot captures one entry rather than the whole collection.
