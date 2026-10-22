// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { useEffect, useRef } from 'react';

import { signedInUid } from '@/features/auth/auth-state';
import { useAuth } from '@/features/auth/use-auth';
import { useCollectionStore } from '@/features/collection/characters/use-character-collection-store';
import { useTeamStore } from '@/features/teams/use-team-store';

/**
 * Empties the character collection and the team planner when a signed-in user
 * leaves, so the next account to sign in merges only its own data.
 *
 * Mount it once, outside the routes: a page's own hooks see only the sign-outs
 * that happen while that page is open. Auth settling on page load isn't a
 * sign-out, so a visitor's persisted collection survives until sign-in merges
 * it.
 */
export function ClearUserDataOnSignOut(): null {
  const uid = signedInUid(useAuth());
  const previousUid = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousUid.current !== undefined && previousUid.current !== uid) {
      useCollectionStore.getState().clearCharacters();
      useTeamStore.getState().resetTeams();
    }
    previousUid.current = uid;
  }, [uid]);

  return null;
}
