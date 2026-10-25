// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter, ConstellationLevel } from '@genshin/domain';
import { MIN_CONSTELLATION_LEVEL, nowTimestamp } from '@genshin/domain';
import { create } from 'zustand';

/** Sparse: a player owns a subset of the roster. */
export type CharacterCollection = Partial<Record<CharacterId, CollectionCharacter>>;

export function ownedCharacters(collection: CharacterCollection): CollectionCharacter[] {
  return Object.values(collection);
}

export function ownedCharacterIds(collection: CharacterCollection): ReadonlySet<CharacterId> {
  return new Set(ownedCharacters(collection).map((entry) => entry.characterId));
}

interface CollectionState {
  characters: CharacterCollection;
  addCharacter: (characterId: CharacterId) => void;
  removeCharacter: (characterId: CharacterId) => void;
  setConstellationLevel: (characterId: CharacterId, level: ConstellationLevel) => void;
  /** Skips a character no longer owned, so a save landing after its removal can't restore it. */
  replaceCharacter: (entry: CollectionCharacter) => void;
  replaceCharacters: (characters: CharacterCollection) => void;
  clearCharacters: () => void;
}

/**
 * The characters this browser knows the user owns, for the current session
 * only.
 *
 * Components reach for `useCollection` instead, which wraps this with the
 * server sync. This store is for that hook and for tests.
 */
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
    const entry = get().characters[characterId];
    if (!entry) return;

    set((state) => ({
      characters: {
        ...state.characters,
        [characterId]: { ...entry, constellationLevel: level, updatedAt: nowTimestamp() },
      },
    }));
  },

  replaceCharacter: (entry) => {
    if (!get().characters[entry.characterId]) return;

    set((state) => ({
      characters: { ...state.characters, [entry.characterId]: entry },
    }));
  },

  replaceCharacters: (characters) => {
    set({ characters });
  },

  clearCharacters: () => {
    set({ characters: {} });
  },
}));
