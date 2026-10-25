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
describes the prototypes.

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

Line counts cover non-test web source. The bundle change starts from 303.87 KB
compressed. Package counts are direct dependencies, then all new packages.

| Option                         | Lines added / removed | Compressed bundle change | Packages added |
| ------------------------------ | --------------------- | ------------------------ | -------------- |
| TanStack Query alone           | 693 / 754             | +1.02 KB                 | 2 / 3          |
| TanStack DB, weapons only      | 272 / 313             | +107.07 KB               | 5 / 8          |
| Status quo with a write helper | 199 / 197             | +0.10 KB                 | 0 / 0          |

### Mechanisms each option removes

| Mechanism        | TanStack Query alone        | TanStack DB               | Status quo with a write helper |
| ---------------- | --------------------------- | ------------------------- | ------------------------------ |
| Store mirror     | Removed                     | Removed for weapons       | Kept                           |
| Reconcile effect | Removed                     | Removed for weapons       | Kept                           |
| Additive merge   | Removed                     | Kept, inside the push     | Kept                           |
| Sign-in push     | Kept, about 20 lines        | Kept                      | Kept                           |
| Guarded rollback | Kept                        | Replaced by the library's | Kept, in one helper            |
| Sender check     | Kept, needed in more places | Kept, in two places       | Kept, in one helper            |
| Query sync       | Kept, in shared write setup | Removed for weapons       | Kept                           |

### Modes each option supports

| Mode    | TanStack Query alone                            | TanStack DB                                     | Status quo with a write helper              |
| ------- | ----------------------------------------------- | ----------------------------------------------- | ------------------------------------------- |
| Local   | Hand-written storage module with the migration  | Storage collection, synced across tabs          | Unchanged persisted store                   |
| Offline | Paused writes survive a reload, unverified      | Queues in one tab only, no reads after a reload | Nothing queues                              |
| Online  | Optimistic, writes to one entity run in order   | Optimistic, adds included                       | Optimistic, every write in one helper       |
| Remote  | A refetch shows server truth, removals included | Per-user collections refetch from the server    | Per-feature reconcile, merge for characters |

### TanStack Query alone

Optimistic writes in the query cache, writes to one entity run in order, and
paused writes kept in browser storage by TanStack's persistence packages.

- Good, because it removes the most code and the second client copy for about
  1 KB of bundle.
- Neutral, because the guarded rollback survives. An optimistic update applies
  before earlier writes to the same entity finish, so one of those failing could
  otherwise overwrite it.
- Bad, because the sender check spreads. A paused write needs one before it
  replays, and every failure needs one before it toasts.
- Bad, because signing out drops the departing user's queued writes.
- Bad, because account data stays in browser storage for up to 24 hours, where
  weapons were memory-only.

<!-- vale Microsoft.HeadingAcronyms = NO -->

### TanStack DB

<!-- vale Microsoft.HeadingAcronyms = YES -->

TanStack DB 0.15 collections over the existing query client, with optimistic
transactions and an offline outbox.

- Good, because weapon adds become optimistic through a temporary identifier,
  which removes the in-flight duplicate guard.
- Bad, because the compressed bundle grows by about 35% for weapons alone.
- Bad, because a replay after a crash can create a duplicate weapon: the API
  doesn't recognize a replayed add.
- Bad, because a failed write also rolls back later pending writes to the same
  row, where the guarded rollback keeps the newer edit.
- Bad, because the outbox's default lock spans the whole site, so each user
  needs their own.
- Bad, because the library is pre-1.0 and churning, with five minor releases in
  October 2026, one of them breaking.
- Bad, because the library's storage format carries no version. The character
  migration runs once and moves the data, so an older build can't read it.

### Status quo with a write helper

Keep the zustand mirrors and route every write through one shared helper, as
[issue #1533](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1533)
proposes.

- Good, because it adds no dependency and doesn't change the bundle.
- Good, because a failed write rolls back even while a later write is in
  flight, which fixes [issue #1534](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1534).
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
