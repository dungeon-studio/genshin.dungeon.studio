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

// Collection state is split along the authentication boundary. Anonymous users
// get the persisted zustand store; authenticated users get the TanStack Query
// cache, which handles optimistic updates and rollback natively. Signing in
// merges the local collection up once and then empties the store, so the two
// halves never both hold data. Both are hooks, so both run every render and
// only the result is chosen between.
export function useCollection(): UseCollectionResult {
  const { user, loading: authLoading } = useAuth();

  useMergeOnSignIn(user, authLoading);

  const anonymous = useAnonymousCollection();
  const server = useServerCollection(user);
  const collection = user === null ? anonymous : server;

  // Auth resolving is a load neither half can see.
  return { ...collection, isLoading: authLoading || collection.isLoading };
}
