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
- **Guarded rollback:** reverts a failed write unless a newer edit replaced it.
- **Sender check:** drops a response that arrives after its sender signed out.
- **Query sync:** cancels refetches when a write starts and refetches after the
  last write ends.

The reconcile effect is also a layer skip: the [layers](../reference/data-flow-layers.md)
reference lists it with the view and feature-hook skips that lint doesn't
catch. Which client data layer removes the most of these mechanisms, gives a
layer stack lint can enforce, and keeps four modes apart?

- **Local:** signed out, data on this device only. Only teams have it, because
  collections are sign-in only.
- **Offline:** signed in, writes queued. [Issue #1762](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1762)
  owns it.
- **Online:** writes in flight.
- **Remote:** the server holds the truth in Firestore, behind the API.

Each prototype covers weapons, for the signed-in path, and teams, for Local
mode. [Issue #1760](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1760)
describes the prototypes.

## Decision drivers

- Remove hand-written synchronization code rather than move it.
- Each layer imports only the one below, enforced by lint as the API's are.
- Keep Local, Offline, Online, and Remote modes distinct and testable, and
  leave room to add Offline later without rework.
- A queued write never replays, rolls back, or toasts under another account.
- Bundle size and dependency count stay proportionate to what they remove.
- API stability: the layer shouldn't need rework on every minor release.

## Considered options

- TanStack Query alone
- TanStack DB
- Status quo, refactored

## Decision outcome

Pending [issue #1133](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1133).

## Pros and cons of the options

### Measurements

Line counts cover non-test web source. Changes start from `develop` at commit `c928fbc8`, with a 286.89 KB
compressed bundle and 1,516 locked packages. The TanStack prototypes cover
weapons and teams. The status-quo prototypes also cover characters. Rows marked
"with offline replay" add the queue that issue #1762 owns.

| Option                               | Lines added / removed | Compressed bundle change | Packages added, direct / all | Web tests     |
| ------------------------------------ | --------------------- | ------------------------ | ---------------------------- | ------------- |
| TanStack Query alone                 | 787 / 682             | +1.18 KB                 | 0 / 0                        | Pass          |
| TanStack Query, with offline replay  | 848 / 684             | +2.82 KB                 | 2 / 3                        | Pass          |
| TanStack DB                          | 720 / 738             | +99.31 KB                | 3 / 7                        | Pass          |
| TanStack DB, with offline replay     | 844 / 739             | +107.90 KB               | 4 / 8                        | Pass          |
| Status quo, refactored               | 328 / 355             | −0.03 KB                 | 0 / 0                        | Pass          |
| Status quo without collection stores | 460 / 572             | −0.06 KB                 | 0 / 0                        | 6 of 307 fail |

The status-quo rows include 109 / 57 lines of import fixes that clear every
layer violation. Either TanStack option needs the same fixes for the code its
prototype left alone.

### Layers each option enforces

Three lint zones express the [layer stack](../reference/data-flow-layers.md):
views import only feature hooks, only the query layer imports the fetch
wrapper, and stores import neither. That commit breaks them 13 times.

| Layer check                    | TanStack Query alone                  | TanStack DB                                  | Status quo                                         |
| ------------------------------ | ------------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| Lint violations left           | 7, in characters and account deletion | 10, the same plus sign-out                   | 0                                                  |
| Store layer                    | None for weapons and teams            | A collection is store and query layer in one | Kept                                               |
| Query cache copied into stores | Characters only                       | Characters only                              | All three, or teams only without collection stores |

### Mechanisms each option removes

| Mechanism        | TanStack Query alone                 | TanStack DB                         | Status quo                                            |
| ---------------- | ------------------------------------ | ----------------------------------- | ----------------------------------------------------- |
| Store mirror     | Removed for weapons and teams        | Removed for weapons and teams       | Kept, or removed for collections without their stores |
| Reconcile effect | Removed for weapons and teams        | Removed for weapons and teams       | Kept, or removed for collections without their stores |
| Guarded rollback | Kept, in three places                | Replaced by the library's           | Kept, in one helper                                   |
| Sender check     | Kept, before every request and toast | Replaced by one collection per user | Kept                                                  |
| Query sync       | Kept, in shared helpers              | Removed, the library owns it        | Kept, in shared helpers                               |

### Modes each option supports

| Mode                | TanStack Query alone                          | TanStack DB                                       | Status quo                            |
| ------------------- | --------------------------------------------- | ------------------------------------------------- | ------------------------------------- |
| Local               | A cache entry that's never fetched            | A local-only collection                           | Unchanged in-memory store             |
| Offline             | Writes pause, and a reload loses them         | Writes fail and roll back                         | Writes pause, and a reload loses them |
| Offline with replay | Paused writes survive a reload in a unit test | A per-user queue survives a reload in a unit test | Not built                             |
| Online              | Optimistic, writes to one entity in order     | Optimistic, adds included                         | Optimistic, unchanged                 |
| Remote              | The last write to finish refetches            | Refetches on focus and reconnect                  | Each feature copies its refetch       |

### TanStack Query alone

Optimistic writes in the query cache, writes to one entity run in order, and
paused writes kept in browser storage by TanStack's persistence packages.

- Good, because it removes the second client copy and the copy step for about
  1 KB, with no new package until offline replay.
- Good, because signed-out teams need no store.
- Neutral, because the line count rises: the stores' edit logic moves into pure
  helpers rather than going away.
- Bad, because the guarded rollback and the sender check survive, and the
  sender check spreads to every request and every failure toast.
- Bad, because a replayed write restored while signed out goes out without a
  token. Its rejection rolls back the departed user's data and toasts the
  visitor.
- Bad, because offline replay keeps account data in browser storage for up to
  24 hours, where weapons and teams were memory-only.

<!-- vale Microsoft.HeadingAcronyms = NO -->

### TanStack DB

<!-- vale Microsoft.HeadingAcronyms = YES -->

TanStack DB 0.15 collections over the existing query client, with optimistic
transactions and a per-user offline queue.

- Good, because it removes the most mechanisms: the store mirror, the copy
  step, the guarded rollback, and query sync.
- Good, because weapon adds become optimistic through a temporary identifier.
- Bad, because the compressed bundle grows by about 35%.
- Bad, because without the queue an offline write fails at once, where today it
  pauses.
- Bad, because a retried weapon add can create a duplicate: the API doesn't
  recognize a replayed add.
- Bad, because the queue outlives sign-out. It replays at that user's next sign-in,
  where an old team save can overwrite newer edits from another device.
- Bad, because the library is pre-1.0 and churning, with four minor releases in
  October 2026. The queue package pins one exact version, so the two upgrade
  together.
- Bad, because lint can't keep store and query layers apart when one module is
  both.

### Status quo, refactored

Keep zustand and the query cache, and restructure the code with steps from
Fowler's refactoring catalogue that preserve behaviour. The result has one
shared write helper, shared query and mutation hooks, and views that read only
through feature hooks.

- Good, because it adds no dependency and doesn't change the bundle.
- Good, because it clears every layer violation without changing behaviour.
- Good, because removing the weapon and character stores is a small further
  step, since signing in is now required for collections.
- Neutral, because that further step changes behaviour: a refetch can
  overwrite a re-add made while a failing removal was in flight.
- Bad, because the guarded rollback, sender check, and query sync stay
  hand-written.
- Bad, because offline replay would need each write stored as data, a cache
  persistence package, and a merge in the teams copy step.

## More information

These options fell out before prototyping:

- **Firestore client SDK with its offline cache**, because it bypasses the API
  contract.
- **Replicache, Zero, RxDB, or Dexie Cloud**, because each needs its own sync
  server.
- **XState**, because it models the current states rather than removing them.
