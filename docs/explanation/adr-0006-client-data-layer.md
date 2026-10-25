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
characters, weapons, and teams each keeping those copies in step their own way.
Hand-written guarded rollbacks, reconcile effects, an additive merge, and a
sign-in push hold them together. Which client data layer removes the most of
that, while keeping the four modes below apart?

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
- Status quo with a shared optimistic-write helper

## Decision outcome

Pending [issue #1133](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1133).

## Pros and cons of the options

Each prototype starts from `develop` at `8f87a630`, whose web bundle is
1,032.92 KB, or 303.87 KB compressed. Line counts are non-test source under
`apps/web`. Package counts are direct dependencies, then every package new to
`pnpm-lock.yaml`.

| Option                        | Lines added / removed | Compressed bundle change | Packages added |
| ----------------------------- | --------------------- | ------------------------ | -------------- |
| TanStack Query alone          | 693 / 754             | +1.02 KB                 | 2 / 3          |
| TanStack DB, weapons only     | 536 / 313             | +107.07 KB               | 5 / 8          |
| Status quo with shared helper | 199 / 197             | +0.10 KB                 | 0 / 0          |

The TanStack DB character spike isn't wired in. Its row counts the new code but
not the deletions wiring it in would bring, mostly in `use-character-collection.ts`
and `use-character-collection-api.ts`.

### TanStack Query alone

Optimistic writes through `onMutate` and `onError`, writes to one entity
serialized with mutation `scope`, and paused mutations saved to `localStorage`
with `@tanstack/react-query-persist-client` and `@tanstack/query-sync-storage-persister`.

- Good, because it removes both zustand mirror stores, the reconcile effects,
  the additive merge, `PUSHED_FOR_KEY`, and `useSenderBoundMutate`, for a net
  61 fewer lines.
- Good, because a refetch shows server truth, including removals made on
  another device.
- Good, because the sign-in push shrinks to about 20 lines and clears the local
  copy after sending it.
- Good, because it adds one transitive package and about 1 KB to the compressed
  bundle.
- Neutral, because Local mode for characters needs a hand-written storage
  module that keeps the existing versioned migration.
- Neutral, because guarded rollbacks survive. The optimistic update runs before
  the scope queue waits, so a failed earlier write could otherwise overwrite a
  newer one.
- Bad, because replaying a paused write needs a sender check before it sends,
  and the sign-out purge drops the departing user's queued writes.
- Bad, because error toasts still need a sender check in every `onError`. The
  prototype failed one test showing a reverted-write toast after sign-out.
- Bad, because account data stays in `localStorage` for up to 24 hours, where
  weapons were memory-only.
- Bad, because offline replay after a reload rests on reading the library
  source, not on a run.

<!-- vale Microsoft.HeadingAcronyms = NO -->

### TanStack DB

<!-- vale Microsoft.HeadingAcronyms = YES -->

`@tanstack/db` 0.15.2 with `@tanstack/react-db`, `@tanstack/query-db-collection`,
and `@tanstack/offline-transactions`, layered on the existing query client.

- Good, because weapon adds become optimistic through a temporary identifier
  swapped for the server's, which removes the in-flight duplicate guard.
- Good, because it removes the weapon zustand store, its guarded rollbacks, and
  its reconcile effect.
- Good, because a `localStorage` collection gives characters Local mode with
  cross-tab sync.
- Bad, because the compressed bundle grows by 107 KB, about 35%, for weapons
  alone.
- Bad, because the outbox queues writes only in the tab holding leadership, and
  only once that tab has acquired it. Writes from any other tab are online only.
- Bad, because the default leader lock name covers the whole origin, so each
  user needs their own lock.
- Bad, because `POST /weapons` ignores the key the outbox sends to mark a
  replay, so a replay after a crash can create a duplicate weapon.
- Bad, because a query collection doesn't survive a reload, so a signed-in
  reload while offline shows nothing. The character store keeps a copy today.
- Bad, because a failed write also rolls back later pending writes to the same
  row. Today's guarded rollback keeps the newer edit.
- Bad, because the library is pre-1.0 and churning. Five minor releases landed
  between 0.11.0 on 2026-09-30 and 0.15.0 on 2026-10-15, and the 0.15.0
  release notes flag a breaking change.
- Bad, because the library's storage format carries no version. The character
  schema migration runs once on import, and a rollback to an older build loses
  the moved data.

### Status quo with a shared optimistic-write helper

Keep the zustand mirrors and route every write through one
`useOptimisticWrite` helper, as [issue #1533](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1533)
proposes.

- Good, because it adds no dependency and doesn't change the bundle.
- Good, because the guarded rollback, toast wording, sender check, and
  signed-out branch live in one place across characters, weapons, and teams.
- Good, because each write settles on its own promise, which fixes
  [issue #1534](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1534)
  for characters and weapons.
- Bad, because the net line count is flat: it consolidates the synchronization
  code without removing it.
- Bad, because the reconcile effects, the additive merge, the sign-in push, and
  both client copies remain per feature.
- Bad, because nothing queues writes while offline. A queue needs each mutation
  stored as data and a cache persistence package. The weapon and team reconcile
  effects would also need a merge, so a reconnect doesn't wipe queued edits.

## More information

These options fell out before prototyping:

- **Firestore client SDK with its offline cache**, because it bypasses the API
  contract.
- **Replicache, Zero, RxDB, or Dexie Cloud**, because each needs its own sync
  server.
- **XState**, because it models the current states rather than removing them.
