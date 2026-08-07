// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter, ConstellationLevel } from '@genshin/domain';
import { MIN_CONSTELLATION_LEVEL, nowTimestamp } from '@genshin/domain';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { CURRENT_VERSION, migratePersistedCollection } from './schemas/index.js';

/** Owned characters keyed by ID. Sparse: a player owns a subset of the roster. */
export type CharacterCollection = Partial<Record<CharacterId, CollectionCharacter>>;

/** The collection's records, without the empty slots its key type admits. */
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

// Additive merge: union of both sets.
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
