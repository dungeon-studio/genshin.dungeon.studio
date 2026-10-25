---
status: proposed
date: 2026-10-25
decision-makers: Alex Brandt
---

# Client data layer for server-owned state

## Context and problem statement

The web app holds two client copies of server data: a zustand store per feature
and the TanStack Query cache. The [write paths](../reference/data-flow-write-paths.md)
and [conversions](../reference/data-flow-conversions.md) references show
characters, weapons, and teams each keeping those copies in step their own way,
through these hand-written mechanisms:

- **Reconcile effect:** copies each refetch from the query cache into the store.
- **Additive merge:** reconciles the device's characters with the account's on
  refetch, never removing one.
- **Sign-in push:** sends characters recorded while signed out, once per
  sign-in.
- **Guarded rollback:** reverts a failed write unless a newer edit replaced it.
- **Sender check:** drops a response that arrives after its sender signed out.
- **Query sync:** cancels refetches when a write starts and refetches after the
  last write ends.

Which client data layer removes the most of these, while keeping four modes
apart?

- **Local:** signed out, data on this device only.
- **Offline:** signed in, writes queued.
- **Online:** writes in flight.
- **Remote:** the server holds the truth in Firestore, behind the API.

Each prototype covers weapons in full, and characters for Local mode and the
sign-in push. Weapons have no Local mode, because the server mints their
instance identifiers. [Issue #1760](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1760)
records the measurements. [Issue #1133](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1133)
makes the decision. No prototype merges.

## Decision drivers

- Remove hand-written synchronization code rather than move it.
- Keep Local, Offline, Online, and Remote modes distinct and testable.
- A queued write never replays, rolls back, or toasts under another account.
- Bundle size and dependency count stay proportionate to what they remove.
- API stability: the layer shouldn't need rework on every minor release.

## Considered options

- TanStack Query alone
- TanStack DB
- Status quo with a shared write helper

## Decision outcome

Pending [issue #1133](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1133).

## Pros and cons of the options

### Measurements

Each prototype starts from `develop` at `8f87a630`, whose web bundle is
1,032.92 KB, or 303.87 KB compressed. Line counts are non-test source under
`apps/web`. Package counts are direct dependencies, then every package new to
`pnpm-lock.yaml`.

| Option                         | Lines added / removed | Compressed bundle change | Packages added |
| ------------------------------ | --------------------- | ------------------------ | -------------- |
| TanStack Query alone           | 693 / 754             | +1.02 KB                 | 2 / 3          |
| TanStack DB, weapons only      | 536 / 313             | +107.07 KB               | 5 / 8          |
| Status quo with a write helper | 199 / 197             | +0.10 KB                 | 0 / 0          |

The TanStack DB character spike isn't wired in. Its row counts the new code but
not the deletions wiring it in would bring, mostly in `use-character-collection.ts`
and `use-character-collection-api.ts`.

### Mechanisms each option removes

| Mechanism        | TanStack Query alone        | TanStack DB               | Status quo with a write helper |
| ---------------- | --------------------------- | ------------------------- | ------------------------------ |
| Store mirror     | Removed                     | Removed for weapons       | Kept                           |
| Reconcile effect | Removed                     | Removed for weapons       | Kept                           |
| Additive merge   | Removed                     | Kept, inside the push     | Kept                           |
| Sign-in push     | Kept, about 20 lines        | Kept                      | Kept                           |
| Guarded rollback | Kept                        | Replaced by the library's | Kept, in one helper            |
| Sender check     | Kept, needed in more places | Kept, in two places       | Kept, in one helper            |
| Query sync       | Moved to mutation defaults  | Removed for weapons       | Kept                           |

### Modes each option supports

| Mode    | TanStack Query alone                            | TanStack DB                                     | Status quo with a write helper              |
| ------- | ----------------------------------------------- | ----------------------------------------------- | ------------------------------------------- |
| Local   | Hand-written storage module with the migration  | Storage collection, synced across tabs          | Unchanged persisted store                   |
| Offline | Paused writes survive a reload, untested        | Queues in one tab only, no reads after a reload | Nothing queues                              |
| Online  | Optimistic, writes to one entity run in order   | Optimistic, adds included                       | Optimistic, every write in one helper       |
| Remote  | A refetch shows server truth, removals included | Per-user collections refetch from the server    | Per-feature reconcile, merge for characters |

### TanStack Query alone

Optimistic writes through `onMutate` and `onError`, writes to one entity
serialized with mutation `scope`, and paused mutations saved to `localStorage`
with `@tanstack/react-query-persist-client` and `@tanstack/query-sync-storage-persister`.

- Good, because it removes the most code and the second client copy for about
  1 KB of bundle.
- Neutral, because the guarded rollback survives. The optimistic update runs
  before the scope queue waits, so a failed earlier write could otherwise
  overwrite a newer one.
- Bad, because the sender check spreads. A paused write needs one before it
  replays, and every `onError` needs one before it toasts. The prototype failed
  one test showing a reverted-write toast after sign-out.
- Bad, because the sign-out purge drops the departing user's queued writes.
- Bad, because account data stays in `localStorage` for up to 24 hours, where
  weapons were memory-only.

<!-- vale Microsoft.HeadingAcronyms = NO -->

### TanStack DB

<!-- vale Microsoft.HeadingAcronyms = YES -->

`@tanstack/db` 0.15.2 with `@tanstack/react-db`, `@tanstack/query-db-collection`,
and `@tanstack/offline-transactions`, layered on the existing query client.

- Good, because weapon adds become optimistic through a temporary identifier,
  which removes the in-flight duplicate guard.
- Bad, because the compressed bundle grows by about 35% for weapons alone.
- Bad, because a replay after a crash can create a duplicate weapon:
  `POST /weapons` ignores the key the outbox sends to mark a replay.
- Bad, because a failed write also rolls back later pending writes to the same
  row, where the guarded rollback keeps the newer edit.
- Bad, because the default leader lock name covers the whole origin, so each
  user needs their own lock.
- Bad, because the library is pre-1.0 and churning. Five minor releases landed
  between 0.11.0 on 2026-09-30 and 0.15.0 on 2026-10-15. The 0.15.0 release
  notes flag a breaking change.
- Bad, because the library's storage format carries no version. The character
  schema migration runs once on import, and a rollback to an older build loses
  the moved data.

### Status quo with a write helper

Keep the zustand mirrors and route every write through one
`useOptimisticWrite` helper, as [issue #1533](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1533)
proposes.

- Good, because it adds no dependency and doesn't change the bundle.
- Good, because each write settles on its own promise, which fixes
  [issue #1534](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1534)
  for characters and weapons.
- Bad, because the net line count is flat: it consolidates the synchronization
  code without removing it.
- Bad, because an offline queue needs each mutation stored as data and a cache
  persistence package. The weapon and team reconcile effects would also need a
  merge, so a reconnect doesn't wipe queued edits.

## More information

These options fell out before prototyping:

- **Firestore client SDK with its offline cache**, because it bypasses the API
  contract.
- **Replicache, Zero, RxDB, or Dexie Cloud**, because each needs its own sync
  server.
- **XState**, because it models the current states rather than removing them.
