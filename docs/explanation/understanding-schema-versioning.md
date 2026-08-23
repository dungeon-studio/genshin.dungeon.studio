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
superset shaped by historical compatibility. Every payload declares its
version; if the shape changes, the declared version changes.

**Readers accept the union of all supported writers.** Determine the payload's
version, validate against that version's schema, and migrate to the current
shape. Old payloads stay readable without weakening the write type.

The strict write type and the union read type are distinct—don't share them.

How the version reaches the reader is the boundary's choice. A stored payload
carries it in band, as a field the reader looks at first. HTTP carries it out
of band, in the `profile` media type parameter, and the acceptor set is the
list of versions each route negotiates over—see
[DSGEP-003](dsgep-003-json-schema-strategy.md) for why the body holds no
metadata. Both are the same two roles.

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

The narrowing rule is invisible to review. The `exclusiveMaximum` diff
type-checks and passes every test written against the current shape. The
payloads it breaks are already in the medium, and nothing in the change points
at them. No reviewer catches that reliably across a schema of any size, so a
subsumption checker decides it instead: `schema-compat` fails the pull request
when a released version stops accepting its own data.

The comparison runs between the branch and its base, version by version. The
alternative—asking whether v0 subsumes v1—tests the wrong property: consecutive
versions are free to differ, because the `up()` migration bridges them. What
must hold is that each released version still accepts the payloads written
under it. The base branch's copy of that version is the only record of what
those payloads look like.

---

## Retiring old versions

A version is safe to retire when no payload in the shared medium carries its
stamp. Establishing that means examining the medium itself. Read volume at a
version falls to zero as soon as those payloads go cold, which happens long
before the payloads are gone—a document nobody opens is still a document that
breaks on the deployment that drops its version.

Only a medium that expires its own contents, such as a cache TTL or a drained
queue, reaches that state by itself. Stored payloads have to be rewritten.

`schema-compat` refuses to drop a released version regardless of what the
medium shows, so a retirement means changing the check too.

---

## Further reading

Robbie Ostrow (OpenAI), [Escaping Version Skew: Formalizing compatibility in a
world of partial rollouts](https://www.usenix.org/conference/srecon26americas/presentation/ostrow),
SRECon Americas 2026. Source for the two-role model, the optionalslop
anti-pattern, the subsumption checker approach, and the `jsoncompat` tool.
