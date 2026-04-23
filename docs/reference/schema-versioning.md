<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Schema versioning conventions

Any shared serialisation boundary is a version skew hazard: deployments are
never instantaneous, caches outlive the pods that filled them, and rollback
returns old readers to a store already touched by new writers. **Parseable is
not the same as compatible.** This applies to Firestore documents, REST bodies,
queue payloads, cache entries, and any future wire format.

---

## The two-role model

**Writers are strict.** Emit only the current schema version. Never emit a
superset shaped by historical compatibility. Every payload carries a version
stamp; if the shape changes, the stamp changes.

**Readers accept the union of all supported writers.** Detect the stamped
version, validate against that version's schema, and migrate to the current
shape. Old payloads stay readable without weakening the write type.

The strict write type and the union read type are distinct—don't share them.

---

## Boundary taxonomy

| Boundary            | Shared medium          | Skew window                           |
| ------------------- | ---------------------- | ------------------------------------- |
| Firestore documents | Database collection    | Until all documents are backfilled    |
| REST API            | HTTP                   | Until all clients are updated         |
| Queue / event bus   | Message broker         | Until all consumers drain the queue   |
| Cache               | Redis / Memcache / CDN | Until TTL expires or cache is flushed |

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

## Implementation: Other boundaries

REST bodies, queue payloads, and cache entries don't yet use this pattern.
When those boundaries are introduced: stamp every payload with a `version`
field, keep one `schemas/v{n}.ts` file per version, write a strict serializer
and a union deserializer, use the same `V{n}ConceptSchema` / `V{n}Concept`
naming convention.

---

## Adding a new schema version

1. Create `schemas/v{n}.ts`. Define `V{n}ConceptSchema`, export `type V{n}Concept`
   and the `v{n}` descriptor. Import `V{n-1}Concept` and write `up()`.

2. Update `schemas/index.ts`. Add `v{n}` to `versionMap`, bump `CURRENT_VERSION`,
   re-export `type V{n}Concept`.

3. Update the boundary file. Update imports and re-exports. Update the
   serializer's return type to `V{n}Concept`; emit only the current stamp and
   the new shape.

4. Update the test file. Add a `makeV{n}Payload()` fixture. Verify migration
   from every prior version and that the serializer stamps `CURRENT_VERSION`.

The deserializer doesn't change; Verzod handles the new version automatically
once `versionMap` includes it.

---

## What not to do

**Don't add optional fields to an existing version for compatibility.**
The type weakens over time, stops expressing the real domain model, and lets
impossible states become routine. Every new shape gets its own version.

**Don't remove a schema version while payloads at that version still live in
the shared medium.** Dropping a version makes those payloads unreadable at the
next deployment. See _Retiring old versions_.

**Don't widen the serializer's return type to cover older shapes.** The writer
must be as strict as the current schema, not a superset of all historical ones.

---

## Retiring old versions

A version is safe to retire when no payload in the shared medium carries its
stamp. Lifecycle:

1. Ship the new version. Writers emit it immediately; readers accept both.
2. Measure reads from the old-version branch.
3. Rewrite or wait for the medium to drain.
4. When the old-version read count reaches zero, delete `v{n-1}.ts`, remove it
   from `versionMap`, and remove the re-export.

---

## Missing CI checks

- **Subsumption check.** No automated check verifies read-direction compatibility
  (`V{n-1}Schema` values still accepted after migration to `V{n}Schema`). A
  one-keyword tightening—`maximum` → `exclusiveMaximum`—silently breaks old
  payloads. Tool: `jsoncompat` (Ostrow, SRECon Americas 2026).

- **Old-version read metrics.** No instrumentation counts traversals of `up()`
  paths, so retiring a version safely requires a manual audit of the medium.

- **Breaking-change detection in CI.** Nothing blocks a PR that narrows a Zod
  schema in a way that rejects previously valid payloads.

---

## Further reading

Robbie Ostrow (OpenAI), [Escaping Version Skew: Formalizing compatibility in a
world of partial rollouts](https://www.usenix.org/conference/srecon26americas/presentation/ostrow),
SRECon Americas 2026. Source for the two-role model, the optionalslop
anti-pattern, the subsumption checker approach, and the `jsoncompat` tool.
