<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Data conversions

The representations user data takes between
[Firestore and the zustand store](data-flow.md#level-0). The jobs each layer
does, and where layers overlap, are in [Layers](data-flow-layers.md).

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

Each hop's type by feature, and the [layer](data-flow-layers.md#level-1) that
produces it.

| Hop             | Characters                                 | Weapons                                                                 | Teams                                                           | Layer                                                               |
| --------------- | ------------------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| Store entity    | `CollectionCharacter`                      | `CollectionWeapon`                                                      | `CollectionTeam`                                                | Store actions, 1.0                                                  |
| Request body    | `{ constellationLevel }`                   | `{ weaponId, refinementLevel }` to add, `{ refinementLevel }` to refine | `SaveTeamPayload` from `teamToSavePayload`, sent without `slot` | 2.2 Build request. For teams, 2.1 Dispatch write builds the payload |
| Validated input | `SaveCharacterBody`                        | `CreateWeaponBody` or `UpdateWeaponBody`                                | `FromSchema` of `teamPutRequestV1`                              | 3.2 Validate request body                                           |
| Domain object   | `CollectionCharacter` from `nextCharacter` | `CollectionWeapon` built by `create` or `update`                        | `CollectionTeam` from `nextTeam`, over `TeamUpdates`            | 3.3 Route request narrows IDs and members, 3.4 builds               |
| Stored document | `V1Character`                              | `V1Weapon`                                                              | `V1Team`                                                        | 3.5 Convert and migrate stored, `toDocument`                        |

- Characters and weapons build the body from the action's arguments, not the
  store entity, so only the level and the weapon ID leave the browser. Teams
  send the store's whole team except `slot` and the timestamps. The slot, the
  character ID, and the instance ID travel in the path.
- The route narrows a character or weapon ID with `requireCharacterId` or
  `requireWeaponId`, and rebuilds team members with
  `deserialiseCollectionTeamMembers` before checking them against the user's
  characters, weapons, and other teams.
- A delete sends no body. The route calls the repository, which deletes the
  document without building a domain object.
