// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter, ConstellationLevel } from '@genshin/domain';
import { MIN_CONSTELLATION_LEVEL, nowTimestamp } from '@genshin/domain';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { CURRENT_VERSION, migratePersistedCollection } from './schemas/index.js';

/** Sparse: a player owns a subset of the roster. */
export type CharacterCollection = Partial<Record<CharacterId, CollectionCharacter>>;

export function ownedCharacters(collection: CharacterCollection): CollectionCharacter[] {
  return Object.values(collection).filter((entry) => entry !== undefined);
}

export function ownedCharacterIds(collection: CharacterCollection): ReadonlySet<CharacterId> {
  return new Set(ownedCharacters(collection).map((entry) => entry.characterId));
}

/** The server record is the base, so its `createdAt` survives a level bump. */
function preferHigherConstellation(
  local: CollectionCharacter,
  server: CollectionCharacter | undefined,
): CollectionCharacter {
  if (!server) return local;
  if (local.constellationLevel <= server.constellationLevel) return server;

  return { ...server, constellationLevel: local.constellationLevel, updatedAt: nowTimestamp() };
}

/**
 * Reconciles what this browser recorded with what the server holds, keeping
 * everything from both.
 *
 * Additive on purpose: a character present on only one side stays, and a
 * disagreement over constellation resolves to the higher level. Nothing here
 * can remove a character, because the two sides are indistinguishable from a
 * device that recorded an addition offline, so a deliberate removal has to
 * reach the server through its own request.
 */
export function mergeCollections(
  local: CharacterCollection,
  server: CharacterCollection,
): CharacterCollection {
  const merged: CharacterCollection = { ...server };

  for (const localEntry of ownedCharacters(local)) {
    const id = localEntry.characterId;
    merged[id] = preferHigherConstellation(localEntry, merged[id]);
  }

  return merged;
}

interface CollectionState {
  characters: CharacterCollection;
  addCharacter: (characterId: CharacterId) => void;
  removeCharacter: (characterId: CharacterId) => void;
  setConstellationLevel: (characterId: CharacterId, level: ConstellationLevel) => void;
  isOwned: (characterId: CharacterId) => boolean;
  getCharacter: (characterId: CharacterId) => CollectionCharacter | undefined;
  replaceCharacters: (characters: CharacterCollection) => void;
  clearCharacters: () => void;
}

/**
 * The characters this browser knows the user owns, surviving a reload.
 *
 * Components reach for `useCollection` instead, which wraps this with the
 * server sync. This store is for that hook and for tests.
 *
 * Persisted, unlike the team store, so a signed-out visitor's collection is
 * still here next visit and merges into their account when they sign in. That
 * makes the persisted shape a stored schema with its own versioned migration.
 */
export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      characters: {},

      addCharacter: (characterId) => {
        if (get().characters[characterId]) return;

        const now = nowTimestamp();
        set((state) => ({
          characters: {
            ...state.characters,
            [characterId]: {
              characterId,
              constellationLevel: MIN_CONSTELLATION_LEVEL,
              createdAt: now,
              updatedAt: now,
            },
          },
        }));
      },

      removeCharacter: (characterId) => {
        set((state) => {
          const characters = { ...state.characters };
          delete characters[characterId];
          return { characters };
        });
      },

      setConstellationLevel: (characterId, level) => {
        const entry = get().characters[characterId];
        if (!entry) return;

        set((state) => ({
          characters: {
            ...state.characters,
            [characterId]: { ...entry, constellationLevel: level, updatedAt: nowTimestamp() },
          },
        }));
      },

      isOwned: (characterId) => {
        return characterId in get().characters;
      },

      getCharacter: (characterId) => {
        return get().characters[characterId];
      },

      replaceCharacters: (characters) => {
        set({ characters });
      },

      clearCharacters: () => {
        set({ characters: {} });
      },
    }),
    {
      name: 'genshin-collection',
      version: CURRENT_VERSION,
      // Persist only the data; the actions are re-supplied by the initializer on
      // rehydration, so the stored shape stays equal to the versioned schema.
      partialize: (state) => ({ characters: state.characters }),
      migrate: (persisted) => migratePersistedCollection(persisted),
    },
  ),
);
