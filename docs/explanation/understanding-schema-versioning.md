<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Understanding schema versioning

Any shared serialisation boundary is a version skew hazard: deployments are
never instantaneous, caches outlive the pods that filled them, and rollback
returns old readers to a store already touched by new writers. **Parseable is
not the same as compatible.** This applies to Firestore documents, REST bodies,
queue payloads, cache entries, and any future wire format.

For the boundaries, file layouts, and naming this repository uses, see
[Schema versioning conventions](../reference/schema-versioning.md).

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

---

## Further reading

Robbie Ostrow (OpenAI), [Escaping Version Skew: Formalizing compatibility in a
world of partial rollouts](https://www.usenix.org/conference/srecon26americas/presentation/ostrow),
SRECon Americas 2026. Source for the two-role model, the optionalslop
anti-pattern, the subsumption checker approach, and the `jsoncompat` tool.
