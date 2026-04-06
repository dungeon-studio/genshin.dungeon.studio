// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter, ISOTimestamp } from '@genshin/domain';
import { isValidConstellationLevel, MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CharacterId = CollectionCharacter['characterId'];

function nowTimestamp(): ISOTimestamp {
  return new Date().toISOString() as ISOTimestamp;
}

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

interface CollectionState {
  characters: Record<CharacterId, CollectionCharacter>;
  addCharacter: (characterId: CharacterId) => void;
  removeCharacter: (characterId: CharacterId) => void;
  setConstellationLevel: (characterId: CharacterId, level: number) => void;
  isOwned: (characterId: CharacterId) => boolean;
  getCharacter: (characterId: CharacterId) => CollectionCharacter | undefined;
  replaceCharacters: (characters: Record<CharacterId, CollectionCharacter>) => void;
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
