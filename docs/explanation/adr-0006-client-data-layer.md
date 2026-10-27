---
status: proposed
date: 2026-10-27
decision-makers: Alex Brandt
---

# Client data layer for server-owned state

## Context and problem statement

The web app holds two client copies of server data: a zustand store per feature
and the TanStack Query cache. The [write paths](../reference/data-flow-write-paths.md)
and [conversions](../reference/data-flow-conversions.md) references show
characters, weapons, and teams each keeping those copies in step their own way,
through these hand-written mechanisms:

- **Store mirror:** the zustand copy of server data that views read.
- **Reconcile effect:** copies each refetch from the query cache into the store.
- **Guarded rollback:** reverts a failed write unless a newer edit replaced it.
- **Sender check:** drops a response that arrives after its sender signed out.
- **Query sync:** cancels refetches when a write starts and refetches after the
  last write ends.

The reconcile effect is also a layer skip. The [layers](../reference/data-flow-layers.md)
reference lists it with the view and feature-hook skips that lint doesn't
catch. The same reference lists rules the store repeats from the hook and the
server. It also shows the query layer building every request path itself,
though the API serves Collection+JSON links and write templates.

Which client data layer removes the most of these mechanisms, gives a layer
stack lint can enforce, and keeps these four modes apart?

- **Local:** signed out, data on this device only. Only teams have it, because
  [issue #563](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/563)
  made collections sign-in only.
- **Offline:** signed in, writes queued. Issue #563 asked for it, and
  [issue #1762](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1762)
  owns it.
- **Online:** writes in flight.
- **Remote:** the server holds the truth in Firestore, behind the API.

## Decision drivers

- Remove hand-written synchronization code rather than move it.
- Hold server data in one client copy, as the repository's state rule asks:
  zustand for UI state, TanStack Query for server state.
- Each layer imports only the one below, enforced by lint as the API's are.
- Reach resources through the API's links and templates, not hand-built paths.
- Keep Local, Offline, Online, and Remote modes distinct and testable.
- Offline can arrive later without reworking the other modes.
- A queued write never replays, rolls back, or toasts under another account.
- Bundle size and dependency count stay proportionate to what they remove.
- The layer survives library minor releases without rework.

## Considered options

- TanStack Query alone
- TanStack DB
- Ketting
- Status quo, refactored

## Decision outcome

The chosen option is TanStack Query alone, with a query layer that follows the
API's links. It's the only option that leaves one client copy of server data
without a new runtime package. It's also the layer the state rule already
names. Ketting showed that following links removes every hand-built path.
Its Collection+JSON support needed a parser written in the app, though, and
its React bindings no longer get releases. So the query layer follows links
itself.

- **Authority:** the server holds the truth for reads and writes.
- **Client copy:** the TanStack Query cache is the only client copy of server
  data. UI state alone stays in zustand. A signed-out visitor's teams live in a
  cache entry that's never fetched.
- **Writes:** the query layer owns optimistic writes. Each write is in one of
  four states: pending, paused while offline, rolled back after failing, or
  settled.
- **Conflicts:** the server keeps the last write. The client keeps a pending
  edit over an older refetch, and refetches once the last write to a feature
  settles.
- **Navigation:** the query layer starts at the API root and follows its links,
  item links, and write templates. It builds no request paths.
- **Layers:** lint enforces the three zones in the layers section. Views go through feature
  hooks, and only the query layer reaches the fetch wrapper.
- **Offline:** issue #1762 persists paused writes with TanStack's persistence
  packages. A restored write re-checks the signed-in account before it sends.

### Consequences

- Good, because the store mirror and reconcile effect go from every feature,
  and with them layer skip 2.
- Good, because the client stops building paths, so an API path change no
  longer breaks it.
- Neutral, because the rules the store repeats from the hook and the server,
  such as team composition and team names, move into pure helpers. Merging
  each with its other copies is separate work.
- Bad, because the guarded rollback, sender check, and query sync stay
  hand-written, in shared helpers.
- Bad, because the line count rises slightly: the stores' edit logic moves into
  pure helpers rather than going away.
- Bad, because characters and account deletion still need the same move and
  import fixes the prototypes left out.
- Bad, because no prototype combines TanStack Query with link following. The
  Ketting prototype is the evidence that links reach every weapon and team
  resource.

### Confirmation

The lint zones in `apps/web/eslint.config.js` fail any import that skips a
layer. The web tests keep covering rollback while another write is in flight, a
refetch that would overwrite a pending edit, and a response that arrives after
sign-out.

## Pros and cons of the options

### Measurements

The [issue #1760](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1760)
prototypes produced these numbers. Line counts cover non-test web source.
Changes start from `develop` at commit `c928fbc8`, with a 286.89 KB compressed
bundle and 1,516 locked packages. The TanStack and Ketting prototypes cover
weapons and teams. The status-quo prototypes also cover characters. Rows marked
"with offline replay" add the queue owned by
[issue #1762](https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1762).

| Option                               | Lines added / removed | Compressed bundle change | Packages added, direct / all | Web tests     | Lint violations left |
| ------------------------------------ | --------------------- | ------------------------ | ---------------------------- | ------------- | -------------------- |
| TanStack Query alone                 | 787 / 682             | +1.18 KB                 | 0 / 0                        | Pass          | 7                    |
| TanStack Query, with offline replay  | 848 / 684             | +2.82 KB                 | 2 / 3                        | Pass          | 7                    |
| TanStack DB                          | 720 / 738             | +99.31 KB                | 3 / 7                        | Pass          | 10                   |
| TanStack DB, with offline replay     | 844 / 739             | +107.90 KB               | 4 / 8                        | Pass          | 10                   |
| Ketting                              | 905 / 726             | +22.87 KB                | 1 / 12                       | Pass          | 7                    |
| Status quo, refactored               | 328 / 355             | −0.03 KB                 | 0 / 0                        | Pass          | 0                    |
| Status quo without collection stores | 460 / 572             | −0.06 KB                 | 0 / 0                        | 6 of 307 fail | 0                    |

### Layers each option enforces

Three lint zones express the [layer stack](../reference/data-flow-layers.md):
views import only feature hooks, only the query layer imports the fetch
wrapper, and stores import neither. The baseline commit breaks them 13 times.

The status quo clears every violation with 109 / 57 lines of import fixes,
counted in its measurement rows. The other options need the same fixes in the
code their prototypes left alone: characters and account deletion, plus
sign-out for TanStack DB.

Weapons and teams build 7 request paths by hand on the baseline commit. Ketting's
prototype builds none. The others keep building them.

### Mechanisms each option removes

The TanStack and Ketting columns describe weapons and teams. Characters keep
today's mechanisms in those prototypes. The status-quo column describes the
refactored variant. Removing the weapon and character stores also removes their
store mirror and reconcile effect, so only teams keep them.

| Mechanism        | TanStack Query alone                 | TanStack DB                         | Ketting                         | Status quo              |
| ---------------- | ------------------------------------ | ----------------------------------- | ------------------------------- | ----------------------- |
| Store mirror     | Removed                              | Removed                             | Removed                         | Kept                    |
| Reconcile effect | Removed                              | Removed                             | Removed                         | Kept                    |
| Guarded rollback | Kept, in three places                | Replaced by the library's           | Kept, in an app write helper    | Kept, in one helper     |
| Sender check     | Kept, before every request and toast | Replaced by one collection per user | Kept, as one client per account | Kept                    |
| Query sync       | Kept, in shared helpers              | Removed, the library owns it        | Kept, in an app write helper    | Kept, in shared helpers |

### Modes each option supports

| Mode                | TanStack Query alone                          | TanStack DB                                       | Ketting                             | Status quo                            |
| ------------------- | --------------------------------------------- | ------------------------------------------------- | ----------------------------------- | ------------------------------------- |
| Local               | A cache entry that's never fetched            | A local-only collection                           | A seeded local document             | Unchanged in-memory store             |
| Offline             | Writes pause, and a reload loses them         | Writes fail and roll back                         | Writes fail and roll back           | Writes pause, and a reload loses them |
| Offline with replay | Paused writes survive a reload in a unit test | A per-user queue survives a reload in a unit test | Not offered by the library          | Not built                             |
| Online              | Optimistic, writes to one entity in order     | Optimistic, adds included                         | Optimistic, through an app helper   | Optimistic, unchanged                 |
| Remote              | The last write to finish refetches            | Refetches on focus and reconnect                  | The last successful write refetches | Each feature's reconcile effect       |

### TanStack Query alone

Optimistic writes in the query cache, writes to one entity run in order, and
paused writes kept in browser storage by TanStack's persistence packages.

- Good, because it removes the store mirror and reconcile effect for about
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
  24 hours. Without offline replay, account data stays in memory only.

<!-- vale Microsoft.HeadingAcronyms = NO -->

### TanStack DB

<!-- vale Microsoft.HeadingAcronyms = YES -->

TanStack DB 0.15 collections over the existing query client, with optimistic
transactions and a per-user offline queue.

- Good, because it removes the most mechanisms: the store mirror, the
  reconcile effect, the guarded rollback, and query sync.
- Good, because weapon adds become optimistic.
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
- Bad, because lint can't keep store and query layers apart: a collection is
  both.

### Ketting

Ketting 9.3, a hypermedia client, holds each resource and follows the API's
links from its root.

- Good, because the client builds no request paths: it follows the root's links,
  item links, and write templates.
- Bad, because its Collection+JSON support skips item data and templates and
  can't write a Collection+JSON body, so the prototype parses documents itself.
- Bad, because its React bindings last shipped in 2022 and expect React 18.
- Bad, because optimistic writes, the guarded rollback, the sender check, and
  query sync all move into a write helper the app owns.
- Bad, because nothing queues offline, and the library offers no queue.

### Status quo, refactored

Keep zustand and the query cache, and restructure the code with steps from
Fowler's refactoring catalogue that preserve behaviour. The result has one
shared write helper, shared query and mutation hooks, and views that read only
through feature hooks.

- Good, because it adds no dependency and doesn't change the bundle.
- Good, because it clears every layer violation without changing behaviour.
- Good, because removing the weapon and character stores is a small further
  step: collections require sign-in, so those stores hold only server data.
- Neutral, because that further step changes behaviour: a refetch can
  overwrite a re-add made while a failing removal was in flight.
- Bad, because zustand keeps a second copy of server data, which breaks the
  state rule.
- Bad, because the guarded rollback, sender check, and query sync stay
  hand-written.
- Bad, because offline replay would need each write stored as data, a cache
  persistence package, and a merge in the teams reconcile effect.

## More information

Prototyping skipped these options:

- **Firestore client SDK with its offline cache**, because it bypasses the API
  contract.
- **Replicache, Zero, RxDB, or Dexie Cloud**, because each needs its own sync
  server.
- **Legend-State's sync plugin**, because it calls a hand-written function for
  each create, read, update, and delete instead of following the API's links.
- **XState**, because it models the current states rather than removing them.
