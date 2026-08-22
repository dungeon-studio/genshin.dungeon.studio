<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Add a schema version

This guide explains how to ship a new schema version at a serialisation
boundary. Follow it whenever the shape changes, rather than loosening the
version already in use.

For the file layouts and naming this repository uses, see
[Schema versioning conventions](../reference/schema-versioning.md). For why a
shape change needs a new version, see
[Understanding schema versioning](../explanation/understanding-schema-versioning.md).

---

## 1) Create the version module

Create `schemas/v{n}.ts`. Define `V{n}ConceptSchema`, export
`type V{n}Concept` and the `v{n}` descriptor. Import `V{n-1}Concept` and write
`up()`.

## 2) Register the version

Update `schemas/index.ts`. Add `v{n}` to `versionMap`, bump `CURRENT_VERSION`,
re-export `type V{n}Concept`.

## 3) Update the boundary file

Update imports and re-exports. Update the serializer's return type to
`V{n}Concept`; emit only the current stamp and the new shape.

## 4) Update the tests

Add a `makeV{n}Payload()` fixture. Verify migration from every prior version
and that the serializer stamps `CURRENT_VERSION`.

---

The deserializer doesn't change; Verzod handles the new version automatically
once `versionMap` includes it.
