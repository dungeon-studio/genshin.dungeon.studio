// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter } from '@genshin/domain';
import { isValidConstellationLevel, MIN_CONSTELLATION_LEVEL, nowTimestamp } from '@genshin/domain';
import { create } from 'zustand';

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

// In-memory only. Collection management is authenticated-only, so the server is
// the system of record and a signed-out session has nothing to hold; the
// retired anonymous localStorage store is drained by drain-persisted-collection.
export const useCollectionStore = create<CollectionState>()((set, get) => ({
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
}));
