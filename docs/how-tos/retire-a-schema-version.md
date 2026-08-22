<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Retire a schema version

This guide explains how to drop a schema version once nothing in the shared
medium still carries its stamp. Dropping it earlier makes those payloads
unreadable at the next deployment; for the safety criterion, see
[Retiring old versions](../explanation/understanding-schema-versioning.md#retiring-old-versions).

---

1. Ship the new version by following
   [Add a schema version](add-schema-version.md).
2. Rewrite every document still at the old version. Reading one and writing it
   back stamps it at the current version.
3. Confirm none remains by scanning the collection. Don't filter on
   `schemaVersion` to retire version 0—those documents predate the field, and a
   query skips documents lacking the field it filters on. A quiet
   migrated-read log doesn't establish this either.
4. Delete `v{n-1}.ts`, remove it from `versionMap`, and remove the re-export.
