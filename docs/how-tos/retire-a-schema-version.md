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
2. Measure reads from the old-version branch.
3. Rewrite or wait for the medium to drain.
4. When the old-version read count reaches zero, delete `v{n-1}.ts`, remove it
   from `versionMap`, and remove the re-export.
