<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Write paths

What each client write does to each
[copy of user data](data-flow.md#level-0), in order, on success and on failure.

A write path is any code that reaches one of these:

- A non-`GET` route under `apps/api/src/routes/`.
- A zustand `set` or `persist` call under `apps/web/src/features/`.
- A TanStack Query mutation or cache call.

Four features do: characters, weapons, teams, and the account. Artifact plans
travel inside a team save, so they share the team path.

Each feature's hook is the only writer to its store and the only caller of its
mutations. Each feature reads from its zustand store, never from the cache.
Each hook also runs its own reconcile effect, which copies the refetched cache
into the store whenever the query data changes.

Every optimistic write fails the same way, a guarded rollback. The previous
value comes back only if the store still holds the value that write put there,
so a newer edit stands. A toast shows either way, and nothing retries.

## Characters

`useCollection` in `use-character-collection.ts`. Add, remove, and set
constellation level share one shape: write the store, send, and on failure make
a guarded rollback.

```mermaid
sequenceDiagram
  participant Hook as useOptimisticActions
  participant Store as character store
  participant API as API
  participant FS as Firestore
  participant Cache as query cache
  participant Reconcile as reconcile effect (useServerSync)

  Hook->>Store: addCharacter / removeCharacter / setConstellationLevel
  opt signed in
    alt add or set level
      Hook->>API: PUT /characters/{id}
      API->>FS: transaction: read, nextCharacter, set
    else remove
      Hook->>API: DELETE /characters/{id}
      API->>FS: delete
    end
    alt success
      API-->>Hook: saved character, or no content on DELETE
      Hook->>Cache: invalidate
      opt PUT
        Hook->>Store: applyMutationResult (constellation level only)
      end
      Cache-->>Reconcile: refetched collection
      Reconcile->>Store: mergeCollections, then replaceCharacters
    else failure
      API-->>Hook: problem detail
      Hook->>Store: guarded rollback
    end
  end
```

The first time the query resolves for a signed-in user, `useServerSync` also
makes the sign-in push. It merges the store into the server collection, then
sends a `PUT` for every entry the server lacks or holds at a lower
constellation. A failed push only toasts. The merged value stays in the store.

## Weapons

`useWeaponCollection` in `use-weapon-collection.ts`. The server mints the
instance identifier, so adding can't be optimistic and nothing works signed
out.

```mermaid
sequenceDiagram
  participant Hook as useWeaponCollection
  participant Store as weapon store
  participant API as API
  participant FS as Firestore
  participant Cache as query cache

  alt add or ensure
    Hook->>API: POST /weapons
    API->>FS: create with minted instance ID
    alt success
      API-->>Hook: saved weapon
      Hook->>Cache: invalidate
      Hook->>Store: addWeapon (upsert)
    else failure
      Hook->>Hook: toast, store untouched
    end
  else remove or set refinement
    Hook->>Store: removeWeapon / setRefinementLevel
    Hook->>API: DELETE or PATCH /weapons/{instanceId}
    alt success
      API-->>Hook: saved weapon, or no content on DELETE
      Hook->>Cache: invalidate
      opt PATCH
        Hook->>Store: addWeapon (replaces the instance)
      end
    else failure
      Hook->>Store: guarded rollback
    end
  end
  Cache-->>Store: reconcile effect: refetched weapons, setWeapons (replace)
```

## Teams

`useTeams` in `use-teams.ts`. Every action goes through `editThenPersist`,
which snapshots the slot, edits the store, and sends the whole team.

```mermaid
sequenceDiagram
  participant Hook as editThenPersist
  participant Store as team store
  participant API as API
  participant FS as Firestore
  participant Cache as query cache

  Hook->>Store: snapshot slot, then edit
  opt signed in
    alt edit
      Hook->>API: PUT /teams/{slot} (whole team)
      API->>FS: read characters, weapons, other teams to validate members
      API->>FS: transaction: read, nextTeam, set
    else clear
      Hook->>API: DELETE /teams/{slot}
      API->>FS: delete
    end
    alt success
      Hook->>Cache: invalidate
      Cache-->>Store: reconcile effect: collectionTeamsToStore, then setTeams (replace)
    else failure
      Hook->>Store: guarded rollback to the snapshot
    end
  end
```

A `beforeunload` prompt guards an in-flight save.

## Account

`useDeleteAccount` in `use-delete-account.ts`. Nothing is optimistic.

```mermaid
sequenceDiagram
  participant Hook as useDeleteAccount
  participant API as API
  participant FS as Firestore
  participant FA as Firebase Auth
  participant Cache as query cache
  participant Stores as stores and localStorage

  Hook->>API: DELETE /account
  API->>FS: eraseStoredData (recursive delete)
  API->>FA: deleteUser
  alt success
    Hook->>FA: signOut
    Hook->>Cache: clear
    Note over Stores: each feature hook empties its store on the auth change
  else failure
    Hook->>Hook: toast the problem detail
  end
```

Every document in Firestore lives under `users/{uid}`, so `eraseStoredData`
reaches all of them with one recursive delete. Firestore goes first so a failure
between the two leaves an identity that can retry, not data with no owner.

## Divergences

Characters, weapons, and teams differ on each of these questions:

| Question                                    | Characters                             | Weapons                     | Teams                         |
| ------------------------------------------- | -------------------------------------- | --------------------------- | ----------------------------- |
| Works signed out?                           | Yes, but lost on reload, see [#1740]   | No, every action is a no-op | Yes, in memory only           |
| Optimistic?                                 | All three actions                      | Remove and refine, not add  | Every action                  |
| Applies the mutation response to the store? | Constellation level only               | Whole instance, replaced    | No                            |
| How a refetch reaches the store             | Additive merge                         | Replace                     | Replace, filled to four slots |
| Can a refetch overwrite an edit in flight?  | Raise or add, no. Lower or remove, yes | Yes                         | Yes                           |
| What a removal elsewhere does to the store  | Survives the merge, see [#1741]        | Disappears on refetch       | Disappears on refetch         |

Teams also depend on the other two features. The server rejects a team that
names a character or weapon instance the user doesn't own, so a team save can
fail on a character add still in flight. Removing a character or weapon leaves
the teams that name it unchanged.

[#1740]: https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1740
[#1741]: https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1741
