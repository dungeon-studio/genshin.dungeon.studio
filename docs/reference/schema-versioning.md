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

Two automated checks hold the versioning rules. Both read the committed JSON
Schema snapshots, which `z.toJSONSchema()` renders from the Zod source.

| Check              | Where it runs                                        | Command                                    | Fails when                                                     |
| ------------------ | ---------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| `schema-snapshots` | `pre-commit`, on any change under a schema directory | `pnpm turbo run schemas:export`            | A committed snapshot differs from its Zod source               |
| `schema-compat`    | `ci.yml`, pull requests only                         | `pnpm --filter @genshin/api schemas:check` | A version the base branch shipped stops accepting its own data |

`schemas:export` also refuses to write when `CURRENT_VERSION` doesn't point at
the newest defined version.

`schema-compat` reads its base branch from `SCHEMA_COMPAT_BASE`, which the job
sets to the pull request's target. Run locally, the script defaults to
`origin/develop`. It falls back to `HEAD` when that ref is absent, which
compares the branch with itself and proves nothing.

### Snapshot roots

| Root                                               | Captures                   |
| -------------------------------------------------- | -------------------------- |
| `apps/api/schema-snapshots/{repository}/v{n}.json` | One Firestore document     |
| `apps/web/schema-snapshots/{store}/v{n}.json`      | One `persist` store record |

Each captures a single record rather than the collection or the whole-store
blob—see
[Why the snapshots hold one record](../explanation/understanding-schema-versioning.md#why-the-snapshots-hold-one-record).

### What fails the gate

`schema-compat` asks jsoncompat whether each base-branch snapshot is
deserializer-compatible with its counterpart on the branch: the branch's schema
must still accept everything the base's did. Two changes fail it.

**Narrowing a released version.** Editing `v{n}.ts` so its snapshot rejects a
payload the base branch accepted. Widen it back, or add `v{n+1}` with a
migration and leave `v{n}` alone.

**Dropping a released version.** Deleting a snapshot the base branch shipped
orphans data still stored under it. There is no exemption list; restore the
version and re-export.

Versions the branch adds beyond the base carry no constraint—a new version is
free to be as strict as its domain model demands.
