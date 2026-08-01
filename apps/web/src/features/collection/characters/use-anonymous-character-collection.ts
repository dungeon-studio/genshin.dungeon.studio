// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId } from '@genshin/domain';
import { useCallback } from 'react';

import type { UseCollectionResult } from './use-character-collection';
import { useCollectionStore } from './use-character-collection-store';

// The signed-out half of the collection: the persisted store answers reads and
// takes writes directly, with no request to roll back and nothing to load.
export function useAnonymousCollection(): UseCollectionResult {
  const characters = useCollectionStore((s) => s.characters);
  const addCharacter = useCollectionStore((s) => s.addCharacter);
  const removeCharacter = useCollectionStore((s) => s.removeCharacter);
  const setConstellationLevel = useCollectionStore((s) => s.setConstellationLevel);

  const isOwned = useCallback((id: CharacterId) => id in characters, [characters]);
  const getCharacter = useCallback((id: CharacterId) => characters[id], [characters]);

  return {
    characters,
    addCharacter,
    removeCharacter,
    setConstellationLevel,
    isOwned,
    getCharacter,
    isLoading: false,
    error: null,
  };
}
