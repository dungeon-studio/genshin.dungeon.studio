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

`GET /teams` isn't paged. Characters and weapons follow `next` links to the end.

The repository builds a mutation response in memory rather than reading it back.
The route serialises it with `characterItemDocument`, `weaponItemDocument`,
`teamItemDocument`, or, for a weapon add, `weaponListDocument`. The client
discards a team response.

## Outbound

| Hop             | Characters                                 | Weapons                                                                 | Teams                                                           | [Layer](data-flow-layers.md#stack)                          |
| --------------- | ------------------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| Store entity    | `CollectionCharacter`                      | `CollectionWeapon`                                                      | `CollectionTeam`                                                | Store                                                       |
| Request body    | `{ constellationLevel }`                   | `{ weaponId, refinementLevel }` to add, `{ refinementLevel }` to refine | `SaveTeamPayload` from `teamToSavePayload`, sent without `slot` | Query layer. For teams, the feature hook builds the payload |
| Validated input | `SaveCharacterBody`                        | `CreateWeaponBody` or `UpdateWeaponBody`                                | `FromSchema` of `teamPutRequestV1`                              | Middleware                                                  |
| Domain object   | `CollectionCharacter` from `nextCharacter` | `CollectionWeapon` built by `create` or `update`                        | `CollectionTeam` from `nextTeam`, over `TeamUpdates`            | Route narrows IDs and members, repository builds            |
| Stored document | `V1Character`                              | `V1Weapon`                                                              | `V1Team`                                                        | Document, `toDocument`                                      |

- Characters and weapons build the body from the action's arguments, not the
  store entity, so only the level and the weapon ID leave the browser. Teams
  send the store's whole team except `slot` and the timestamps. The slot, the
  character ID, and the instance ID travel in the path.
- A delete sends no body and builds no domain object.
