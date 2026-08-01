// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter } from '@genshin/domain';

import { useAuth } from '@/features/auth/use-auth';

import { useAnonymousCollection } from './use-anonymous-character-collection';
import { useMergeOnSignIn } from './use-character-collection-merge';
import { useServerCollection } from './use-server-character-collection';

export interface UseCollectionResult {
  characters: Record<CharacterId, CollectionCharacter>;
  addCharacter: (characterId: CharacterId) => void;
  removeCharacter: (characterId: CharacterId) => void;
  setConstellationLevel: (characterId: CharacterId, level: number) => void;
  isOwned: (characterId: CharacterId) => boolean;
  getCharacter: (characterId: CharacterId) => CollectionCharacter | undefined;
  isLoading: boolean;
  error: Error | null;
}

// The two halves never both hold data: signing in merges the local collection
// up and empties the store. Both are hooks, so both run every render and only
// the result is chosen.
export function useCollection(): UseCollectionResult {
  const { user, loading: authLoading } = useAuth();

  useMergeOnSignIn(user, authLoading);

  const anonymous = useAnonymousCollection();
  const server = useServerCollection(user);
  const collection = user === null ? anonymous : server;

  // Auth resolving is a load neither half can see.
  return { ...collection, isLoading: authLoading || collection.isLoading };
}
