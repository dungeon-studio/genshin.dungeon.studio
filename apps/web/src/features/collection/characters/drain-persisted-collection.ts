// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter } from '@genshin/domain';

import { migratePersistedCollection } from './schemas/index.js';

// The zustand `persist` key the retired anonymous character store wrote under.
const LEGACY_STORE_KEY = 'genshin-collection';

/**
 * Reads and clears the collection a browser accumulated while collection
 * management still worked signed out.
 *
 * Nothing writes this key any more, but browsers that used the anonymous flow
 * still hold a blob under it; draining it on first sign-in gets that data to
 * the server instead of orphaning it. Clearing is unconditional — an
 * unreadable blob is as dead as a drained one, and leaving it behind would
 * retry the same parse on every sign-in forever.
 */
export function drainPersistedCollection(): Record<CharacterId, CollectionCharacter> {
  const raw = localStorage.getItem(LEGACY_STORE_KEY);
  if (raw === null) return {};

  localStorage.removeItem(LEGACY_STORE_KEY);

  let envelope: unknown;
  try {
    envelope = JSON.parse(raw);
  } catch {
    return {};
  }

  // `persist` wraps the partialized state as `{ state, version }`. Only v1 was
  // ever written, so the state shape alone decides whether the blob is usable.
  const state =
    typeof envelope === 'object' && envelope !== null && 'state' in envelope
      ? envelope.state
      : undefined;

  return migratePersistedCollection(state).characters;
}
