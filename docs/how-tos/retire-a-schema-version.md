<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Retire a schema version

This guide explains how to drop a schema version once nothing in the shared
medium still carries its stamp. Dropping it earlier makes those payloads
unreadable at the next deployment; for the safety criterion, see
[Retiring old versions](../explanation/understanding-schema-versioning.md#retiring-old-versions).

---

1. Ship the new version by following
   [Add a schema version](add-schema-version.md). Writers emit the new stamp
   immediately; readers accept both.
2. Rewrite every document still at the old version. Reading one and writing it
   back stamps it at the current version, so a pass over the collection drives
   the count to zero. Nothing in Firestore expires on its own, so waiting
   doesn't.
3. Confirm none remains by enumerating the collection. When retiring version 0,
   filtering on `schemaVersion` misses the documents you want. They predate the
   field, and a query skips documents lacking the field it filters on.
4. Delete `v{n-1}.ts`, remove it from `versionMap`, and remove the re-export.

---

The migrated-read log (`fromVersion`/`toVersion`) tracks the rewrite's
progress, not its completion. A document nobody reads never logs a line, so a
quiet window says only that nothing arrived during it. Step 3 is what settles
the question.
