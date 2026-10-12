<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Data flow

Where each copy of user data lives and which processes move data between them.
User data has up to four copies: the Firestore document, the TanStack Query
cache, a zustand store, and, for characters only, the browser's `localStorage`.
Out of scope: static game data, which is never written, and the theme
preference, which never leaves the browser. Which copy should be authoritative
is [#1133].

Two companion references use this page's store and process numbers:

- [Write paths](data-flow-write-paths.md): what each client write does to each
  copy, in order, on success and on failure.
- [Data conversions](data-flow-conversions.md): the representation data takes
  at each hop between Firestore and the store.

---

## Context

The whole system is process `0`. Firebase Auth and the operator sit outside it
because the system exchanges data with them but doesn't control them.

```mermaid
flowchart LR
  user[User]
  firebaseAuth[Firebase Auth]
  operator[Operator]

  system(0 genshin.dungeon.studio)

  user -->|edit| system
  system -->|rendered state| user
  firebaseAuth -->|ID token| system
  firebaseAuth -->|token signing keys| system
  system -->|identity to delete| firebaseAuth
  operator -->|sweep command| system
  system -->|version census| operator
```

---

## Level 0

Opening process `0` shows the four copies as data stores. Each labelled box is
a trust boundary:

- The browser runs on hardware the user controls.
- The API and Firestore run in the project's Google Cloud project.
- The sweep runs from an operator's own machine with that operator's
  credentials.

```mermaid
flowchart LR
  user[User]
  firebaseAuth[Firebase Auth]
  operator[Operator]

  subgraph browser[Browser: user-controlled]
    edit(1.0 Edit and render state)
    send(2.0 Send writes)
    fetch(4.0 Fetch records)
    reconcile(5.0 Reconcile store with cache)
    persistCharacters(6.0 Persist character collection)
    store[(D1 zustand stores)]
    cache[(D2 Query cache)]
    local[(D3 localStorage genshin-collection)]
  end

  subgraph cloud[Google Cloud project]
    serve(3.0 Serve and store records)
    firestore[(D4 Firestore users/uid)]
  end

  subgraph workstation[Operator workstation]
    sweep(7.0 Sweep stored documents)
  end

  user -->|edit| edit
  edit -->|rendered state| user
  store -->|current entities| edit
  edit -->|edited entities| store
  edit -->|write request| send

  firebaseAuth -->|ID token| send
  firebaseAuth -->|ID token| fetch
  send -->|request body and ID token| serve
  fetch -->|ID token| serve
  serve -->|saved record| send
  send -->|write outcome| edit

  firebaseAuth -->|token signing keys| serve
  serve -->|identity to delete| firebaseAuth
  firestore -->|stored document| serve
  serve -->|current-version document| firestore

  serve -->|record list| fetch
  fetch -->|server collection| cache

  cache -->|server collection| reconcile
  store -->|local entities| reconcile
  reconcile -->|reconciled entities| store
  reconcile -->|entries the server lacks| send

  store -->|characters| persistCharacters
  persistCharacters -->|versioned collection| local
  local -->|stored collection| persistCharacters
  persistCharacters -->|migrated characters| store

  operator -->|sweep command| sweep
  firestore -->|stored document| sweep
  sweep -->|current-version document| firestore
  sweep -->|version census| operator
```

Two signals drive this diagram but carry no data, so they don't appear as
flows:

- A successful mutation invalidates its query, which makes 4.0 refetch. No
  collection or team mutation writes into D2 directly. Account deletion
  empties it.
- An auth change to anything but signed in makes each feature's 5.0 effect empty
  its D1 store.

[#1133]: https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1133
