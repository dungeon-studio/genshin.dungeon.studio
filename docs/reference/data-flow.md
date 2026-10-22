<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Data flow

Where each copy of user data lives and which processes move data between them.
User data has up to four copies: the Firestore document, the TanStack Query
cache, a zustand store, and, for characters only, the browser's `localStorage`.
Which copy should be authoritative is [#1133]. Out of scope:

- Static game data, which is never written.
- The theme preference, which never leaves the browser.
- The signed-in session the Firebase Auth SDK keeps in IndexedDB, which
  Firebase owns.

What each client write does to each copy is in
[Write paths](data-flow-write-paths.md). The representation data takes at each
hop is in [Data conversions](data-flow-conversions.md).

---

## Context

Firebase Auth and the operator exchange data with the system, which doesn't
control them.

```mermaid
flowchart LR
  user[User]
  firebaseAuth[Firebase Auth]
  operator[Operator]

  system(0 genshin.dungeon.studio)

  user -->|edit| system
  system -->|rendered state| user
  firebaseAuth -->|ID token| system
  firebaseAuth -->|signing keys and revocation status| system
  system -->|identity to delete| firebaseAuth
  operator -->|sweep command| system
  system -->|version census| operator
```

---

## Level 0

The system runs seven processes over four data stores, D1 to D4, across three
trust boundaries:

- The browser runs on hardware the user controls.
- The API and Firestore run in the project's Google Cloud project.
- The sweep runs from an operator's own machine with that operator's
  credentials.

```mermaid
flowchart TB
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

  firebaseAuth -->|signing keys and revocation status| serve
  serve -->|identity to delete| firebaseAuth
  firestore -->|stored document| serve
  serve -->|current-version document or delete| firestore

  serve -->|record list| fetch
  fetch -->|server collection| cache

  cache -->|server collection| reconcile
  store -->|local characters| reconcile
  reconcile -->|reconciled entities| store
  reconcile -->|characters the server lacks| send

  store -->|characters| persistCharacters
  persistCharacters -->|versioned collection| local
  local -->|stored collection| persistCharacters
  persistCharacters -->|migrated characters| store

  operator -->|sweep command| sweep
  firestore -->|stored document| sweep
  sweep -->|migrated legacy document, when writing| firestore
  sweep -->|version census| operator
```

Two control signals carry no data:

- A successful mutation invalidates its query, which makes Fetch records run
  again. No collection or team mutation writes into the query cache directly.
  Account deletion empties it. A plain sign-out leaves the previous user's
  entries, keyed by user ID, until garbage collection.
- When a signed-in user signs out, `ClearUserDataOnSignOut` empties the
  character, weapon, and team stores, and teams reset to empty slots. It
  renders outside the routes, so it sees a sign-out on any page.

[#1133]: https://github.com/dungeon-studio/genshin.dungeon.studio/issues/1133
