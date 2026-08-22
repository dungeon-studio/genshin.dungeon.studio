<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Understanding schema versioning

Any shared serialisation boundary is a version skew hazard: deployments are
never instantaneous, caches outlive the pods that filled them, and rollback
returns old readers to a store already touched by new writers. **Parseable is
not the same as compatible.** This applies to Firestore documents, REST bodies,
queue payloads, cache entries, and any future wire format.

For the boundaries, file layouts, and naming this repository uses, see
[Schema versioning conventions](../reference/schema-versioning.md). To ship a
version, see [Add a schema version](../how-tos/add-schema-version.md).

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
next deployment. See [Retiring old versions](#retiring-old-versions).

**Don't widen the serializer's return type to cover older shapes.** The writer
must be as strict as the current schema, not a superset of all historical ones.

**Don't tighten a version's schema after it ships.** A one-keyword
change—`maximum` → `exclusiveMaximum`—still parses but rejects payloads that
were valid when they were written. Every narrowing gets a new version.

---

## Why a checker holds the rules

That last rule is invisible to review. The `exclusiveMaximum` diff type-checks
and passes every test written against the current shape; the payloads it breaks
are the ones already sitting in the medium, and nothing in the change points at
them. No reviewer catches that reliably across a schema of any size, so a
subsumption checker decides it instead. The
[compatibility gate](../reference/schema-versioning.md#compatibility-gate)
compares JSON Schema renderings of each version with `jsoncompat` and fails the
pull request when a released version stops accepting its own data.

The comparison runs between the branch and its base, version by version. The
alternative—asking whether v0 subsumes v1—tests a property this repository
doesn't want: consecutive versions are free to be unrelated, because the `up()`
migration bridges them. What must hold is that each released version still
accepts the payloads written under it, and the last-shipped copy of that
version is the only honest statement of what those payloads look like.

That framing also decides where the gate runs. A base-branch comparison needs a
merge target, which a commit doesn't have, so the proof is a pull request job
rather than a pre-commit hook. Only the drift check—do the committed snapshots
still match their Zod source?—is a pure function of the working tree, and that
one is a hook.

---

## Why the snapshots hold one record

`jsoncompat` reasons about named properties. A `Record` renders as
`additionalProperties`, and the checker treats the value schema underneath it
as opaque, so a gate pointed at a whole-store blob would report compatibility
while every field inside the records went unchecked. A snapshot of the entry
puts the fields that actually change back under the checker. The Firestore side
lands in the same place for the same reason: the snapshot is one document, not
the collection.

---

## Retiring old versions

A version is safe to retire when no payload in the shared medium carries its
stamp. Establishing that means examining the medium itself. Read volume at a
version falls to zero as soon as those payloads go cold, which happens long
before the payloads are gone—a document nobody opens is still a document that
breaks on the deployment that drops its version.

Only a medium that expires its own contents, such as a cache TTL or a drained
queue, reaches that state by itself. Stored payloads have to be rewritten.

The gate offers no way to record that conclusion: deleting a snapshot the base
branch shipped always fails the pull request. No version has needed retiring
yet, so no exemption exists and the first real retirement designs it.

---

## Further reading

Robbie Ostrow (OpenAI), [Escaping Version Skew: Formalizing compatibility in a
world of partial rollouts](https://www.usenix.org/conference/srecon26americas/presentation/ostrow),
SRECon Americas 2026. Source for the two-role model, the optionalslop
anti-pattern, the subsumption checker approach, and the `jsoncompat` tool.
