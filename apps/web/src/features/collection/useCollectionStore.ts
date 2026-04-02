// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter } from '@genshin/domain';
import { isValidConstellationLevel, MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CollectionEntry {
  constellationLevel: number;
}

export type CharacterId = CollectionCharacter['characterId'];

// Additive merge: union of both sets, keep higher constellation level on conflicts.
export function mergeCollections(
  local: Record<CharacterId, CollectionEntry>,
  server: Record<CharacterId, CollectionEntry>,
): Record<CharacterId, CollectionEntry> {
  const merged: Record<CharacterId, CollectionEntry> = { ...server };

  for (const [id, localEntry] of Object.entries(local)) {
    const serverEntry = merged[id];
    if (!serverEntry) {
      merged[id] = localEntry;
    } else if (localEntry.constellationLevel > serverEntry.constellationLevel) {
      merged[id] = { constellationLevel: localEntry.constellationLevel };
    }
  }

  return merged;
}

interface CollectionState {
  characters: Record<CharacterId, CollectionEntry>;
  addCharacter: (characterId: CharacterId) => void;
  removeCharacter: (characterId: CharacterId) => void;
  setConstellationLevel: (characterId: CharacterId, level: number) => void;
  isOwned: (characterId: CharacterId) => boolean;
  getCharacter: (characterId: CharacterId) => CollectionEntry | undefined;
  replaceCharacters: (characters: Record<CharacterId, CollectionEntry>) => void;
  clearCharacters: () => void;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      characters: {},

      addCharacter: (characterId) => {
        if (get().characters[characterId]) return;

        set((state) => ({
          characters: {
            ...state.characters,
            [characterId]: {
              constellationLevel: MIN_CONSTELLATION_LEVEL,
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
            [characterId]: { ...entry, constellationLevel: level },
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
    },
  ),
);
