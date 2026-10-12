<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Data conversions

The representations user data takes between
[Firestore and the zustand store](data-flow.md#level-0), and the conversions
done in more than one layer.

## Inbound

Every feature runs the same chain:

1. The API reads a document through the repository's `fromDocument`, which
   migrates it to the current version and asserts domain invariants.
2. The route serialises it to Collection+JSON with `characterItemDocument`,
   `weaponItemDocument`, or `teamItemDocument`.
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

## Outbound

No dedicated layer converts it: each mutation writes its request body inline,
and teams send the domain members unchanged. The API validates the body against
the request schema, then the repository's `toDocument` stamps the current schema
version.

## Conversions in more than one layer

- **Timestamps.** Both sides mint `createdAt` and `updatedAt`: the server on
  every save, the client on every character and team store edit. The store shows
  the client's values until a refetch replaces them.
- **Default team name.** The client calls `defaultTeamName`. The server's
  `nextTeam` writes the same string itself.
- **Merge rule.** The server keeps the latest write. The client's
  `mergeCollections` keeps the higher constellation. The same two values
  resolve differently depending on which side merges.
