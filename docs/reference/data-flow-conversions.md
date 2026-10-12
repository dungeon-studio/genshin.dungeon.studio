<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Data conversions

The representations user data takes between
[Firestore and the zustand store](data-flow.md#level-0), and the conversions
done in more than one layer.

## Inbound

Every feature runs the same chain:

1. The API reads a document through the repository's `fromDocument`, which
   migrates it to the current version and asserts domain invariants. For teams
   it also pads a short `members` array to four.
2. The list route serialises the page to Collection+JSON with
   `characterListDocument`, `weaponListDocument`, or `teamListDocument`.
3. The query layer asserts the document and converts each item with
   `deserialiseCharacter`, `deserialiseWeapon`, or `deserialiseTeam`.
4. The query layer folds the items into its cache shape.
5. The reconcile effect turns the cache shape into the store shape.

| Feature    | Cache shape, step 4                                    | Store shape, step 5                                      |
| ---------- | ------------------------------------------------------ | -------------------------------------------------------- |
| Characters | `toCharacterCollection`: record keyed by `CharacterId` | `mergeCollections`: additive, higher constellation wins  |
| Weapons    | `toWeaponRecord`: record keyed by instance ID          | identity: `setWeapons` stores the cache shape            |
| Teams      | `parseTeamsResponse`: array of `CollectionTeam`        | `collectionTeamsToStore`: four slots over `initialTeams` |

Teams read one page. Characters and weapons follow `next` links to the end.

A mutation response skips step 1. The repository builds it in memory, and the
route serialises it with `characterItemDocument`, `weaponItemDocument`, or, for
a weapon add, `weaponListDocument`.

## Outbound

1. The client builds the request body. Characters and weapons write it inline.
   Teams convert the store's team with `teamToSavePayload`, which sends the
   domain members unchanged.
2. The API validates the body against the request schema.
3. For teams, the route parses the members and checks them against the user's
   characters, weapons, and other teams.
4. For characters and teams, the repository merges the body into the stored
   record with `nextCharacter` or `nextTeam`.
5. The repository's `toDocument` stamps the current schema version.

## Conversions in more than one layer

- **Timestamps.** The server mints `createdAt` and `updatedAt` on every save
  and keeps the stored `createdAt`. The client mints them on every character and
  team store edit, on every character merge, and for every unsaved team slot.
  The weapon store never mints them. Weapons show the server's values as soon as
  a write succeeds. Teams show them after a refetch. Characters show them only
  where the server's level is at least the local one.
- **Empty team defaults.** The client's `createEmptyTeam` and the server's
  `nextTeam` each define the default name and the four empty member slots.
- **Team name rules.** The client trims a name and falls back to the default
  when it's blank. The server doesn't trim and accepts 1 to 50 characters, a
  limit the client doesn't enforce.
- **Team composition rules.** The client ignores a duplicate character in a
  team, and the server rejects one. Both the planner UI and the server enforce
  artifact plan limits. Only the server checks weapon uniqueness across teams.
- **Domain invariants.** Asserted by the repository's `fromDocument`, by the
  client's `deserialise*` functions, and by the persisted character store's
  migration.
- **Schema versions.** Firestore documents and the `localStorage` collection
  each carry their own version and migration.
- **Merge rule.** The server keeps the latest write for characters and weapons.
  For teams it keeps any stored field the body omits. The client's
  `mergeCollections` keeps the higher constellation. The same two character
  values resolve differently depending on which side merges.
