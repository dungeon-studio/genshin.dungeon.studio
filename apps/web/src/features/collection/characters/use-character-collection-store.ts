// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter } from '@genshin/domain';
import { isValidConstellationLevel, MIN_CONSTELLATION_LEVEL, nowTimestamp } from '@genshin/domain';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { CURRENT_VERSION, migratePersistedCollection } from './schemas/index.js';

// Additive merge: union of both sets, keep higher constellation level on conflicts.
export function mergeCollections(
  local: Record<CharacterId, CollectionCharacter>,
  server: Record<CharacterId, CollectionCharacter>,
): Record<CharacterId, CollectionCharacter> {
  const merged: Record<CharacterId, CollectionCharacter> = { ...server };

  for (const [id, localEntry] of Object.entries(local)) {
    const serverEntry = merged[id];
    if (!serverEntry) {
      merged[id] = localEntry;
    } else if (localEntry.constellationLevel > serverEntry.constellationLevel) {
      merged[id] = {
        ...serverEntry,
        constellationLevel: localEntry.constellationLevel,
        updatedAt: nowTimestamp(),
      };
    }
  }

  return merged;
}

// Local entries the server is missing or behind on.
export function mergeDiffs(
  local: Record<CharacterId, CollectionCharacter>,
  server: Record<CharacterId, CollectionCharacter>,
): Array<{ characterId: CharacterId; level: number }> {
  const merged = mergeCollections(local, server);
  const diffs: Array<{ characterId: CharacterId; level: number }> = [];

  for (const characterId of Object.keys(merged)) {
    const { constellationLevel } = merged[characterId];
    const serverEntry = server[characterId];
    if (
      isValidConstellationLevel(constellationLevel) &&
      (!serverEntry || constellationLevel > serverEntry.constellationLevel)
    ) {
      diffs.push({ characterId, level: constellationLevel });
    }
  }

  return diffs;
}

interface CollectionState {
  characters: Record<CharacterId, CollectionCharacter>;
  addCharacter: (characterId: CharacterId) => void;
  removeCharacter: (characterId: CharacterId) => void;
  setConstellationLevel: (characterId: CharacterId, level: number) => void;
  isOwned: (characterId: CharacterId) => boolean;
  getCharacter: (characterId: CharacterId) => CollectionCharacter | undefined;
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
        if (!isValidConstellationLevel(level)) return;

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
