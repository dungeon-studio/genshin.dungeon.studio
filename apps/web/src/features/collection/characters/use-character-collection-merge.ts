// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { User } from 'firebase/auth';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import {
  useCharacterCollectionQuery,
  useSetConstellationLevelMutation,
} from './use-character-collection-api';
import { mergeDiffs, useCollectionStore } from './use-character-collection-store';

// Carries the anonymous collection across the authentication boundary. A failed
// push keeps the local copy, so the next sign-in for the account retries it.
export function useMergeOnSignIn(user: User | null, authLoading: boolean): void {
  const clearCharacters = useCollectionStore((s) => s.clearCharacters);
  const { data: serverCharacters } = useCharacterCollectionQuery(user?.uid);
  const { mutate: setConstellationLevel } = useSetConstellationLevelMutation(user?.uid);

  // The uid already merged, so a refetch doesn't push twice.
  const mergedForUser = useRef<string | null>(null);
  // The uid last seen signed in. Firebase reports no user while it restores a
  // session, so that state alone doesn't mean a sign-out.
  const signedInUser = useRef<string | null>(null);

  // Drop local data on sign-out so the next account to sign in on this browser
  // cannot merge the previous account's collection into its own.
  useEffect(() => {
    if (authLoading || user) return;
    if (signedInUser.current === null) return;

    signedInUser.current = null;
    mergedForUser.current = null;
    clearCharacters();
  }, [user, authLoading, clearCharacters]);

  useEffect(() => {
    if (!user || !serverCharacters) return;

    signedInUser.current = user.uid;
    if (mergedForUser.current === user.uid) return;
    mergedForUser.current = user.uid;

    const diffs = mergeDiffs(useCollectionStore.getState().characters, serverCharacters);
    if (diffs.length === 0) {
      clearCharacters();
      return;
    }

    let outstanding = diffs.length;
    let failed = false;
    for (const diff of diffs) {
      setConstellationLevel(diff, {
        onError: () => {
          failed = true;
          toast.error('Failed to sync a merged character to the server.');
        },
        onSettled: () => {
          outstanding -= 1;
          if (outstanding === 0 && !failed) clearCharacters();
        },
      });
    }

    toast.success(`Merged ${diffs.length} character(s) from your local collection.`);
  }, [user, serverCharacters, clearCharacters, setConstellationLevel]);
}
