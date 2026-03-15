// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter } from '@genshin/types';
import { isValidConstellationLevel, MIN_CONSTELLATION_LEVEL } from '@genshin/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CollectionEntry {
  constellationLevel: number;
}

type CharacterId = CollectionCharacter['characterId'];

interface CollectionState {
  characters: Record<CharacterId, CollectionEntry>;
  addCharacter: (characterId: CharacterId) => void;
  removeCharacter: (characterId: CharacterId) => void;
  setConstellationLevel: (characterId: CharacterId, level: number) => void;
  isOwned: (characterId: CharacterId) => boolean;
  getCharacter: (characterId: CharacterId) => CollectionEntry | undefined;
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
    }),
    {
      name: 'genshin-collection',
    },
  ),
);
