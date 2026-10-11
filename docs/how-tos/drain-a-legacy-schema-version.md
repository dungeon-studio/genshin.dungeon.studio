<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Drain a legacy schema version

This guide rewrites every Firestore document stored at an older schema version
at the current one, then confirms none remain. It's for operators with access
to the target `dungeon-studio-genshin-*` project.

Removing the drained version's schema isn't covered: `schema-compat` rejects a
pull request that deletes a released snapshot.

## Prerequisites

- [Firestore credentials](configure-firestore-credentials.md) for the target
  project.
- The release that added the current version serves all traffic and won't roll
  back. A build older than that version can't read a rewritten document.

## 1) Count the documents at each version

```bash
pnpm --filter @genshin/api documents:sweep
```

The run is read-only. Investigate any `invalid` count before going on: those
documents already fail every read, and the rewrite skips them.

## 2) Rewrite the legacy documents

```bash
pnpm --filter @genshin/api documents:sweep --write
```

## 3) Confirm none remain

Repeat step 1. Draining is complete once no repository reports a count for the
version.
