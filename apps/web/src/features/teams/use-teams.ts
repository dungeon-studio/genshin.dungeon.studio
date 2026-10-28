// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ArtifactPlan, CollectionTeam, CollectionWeaponId, TeamSlot } from '@genshin/domain';
import { initialTeams } from '@genshin/domain';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import { signedInUid } from '@/features/auth/auth-state';
import { useAuth } from '@/features/auth/use-auth';
import type { UserDataLoad } from '@/features/auth/use-user-data-load';
import { useUserDataLoad } from '@/features/auth/use-user-data-load';

import { useSaveTeamMutation, useTeamsQuery, useTeamWritePending } from './use-team-api';
import { useTeamStore } from './use-team-store';

export interface UseTeamsResult extends UserDataLoad {
  teams: Record<TeamSlot, CollectionTeam>;
  assignCharacter: (
    slot: TeamSlot,
    memberIndex: number,
    characterId: string,
    collectionWeaponId?: CollectionWeaponId,
  ) => void;
  removeCharacter: (slot: TeamSlot, memberIndex: number) => void;
  assignWeapon: (
    slot: TeamSlot,
    memberIndex: number,
    collectionWeaponId: CollectionWeaponId,
  ) => void;
  removeWeapon: (slot: TeamSlot, memberIndex: number) => void;
  setArtifactPlan: (slot: TeamSlot, memberIndex: number, plan: ArtifactPlan | undefined) => void;
  clearTeam: (slot: TeamSlot) => void;
  setTeamName: (slot: TeamSlot, name: string) => void;
  getTeam: (slot: TeamSlot) => CollectionTeam;
  isSaving: boolean;
}

function collectionTeamsToStore(apiTeams: CollectionTeam[]): Record<TeamSlot, CollectionTeam> {
  const teams = initialTeams();

  for (const ct of apiTeams) {
    teams[ct.slot] = ct;
  }

  return teams;
}

function useWarnOnUnloadWhileSaving(isSaving: boolean): void {
  // A ref, so the handler registered once always sees the latest value.
  const isSavingRef = useRef(isSaving);
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isSavingRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);
}

type TeamActions = Pick<
  UseTeamsResult,
  | 'assignCharacter'
  | 'removeCharacter'
  | 'assignWeapon'
  | 'removeWeapon'
  | 'setArtifactPlan'
  | 'clearTeam'
  | 'setTeamName'
>;

type TeamStore = ReturnType<typeof useTeamStore.getState>;

function useTeamActions(
  isAuthenticated: boolean,
  saveTeamApi: ReturnType<typeof useSaveTeamMutation>['mutateAsync'],
): TeamActions {
  return useMemo(() => {
    const store = () => useTeamStore.getState();

    const editThenSave =
      <Args extends unknown[]>(action: (s: TeamStore) => (slot: TeamSlot, ...args: Args) => void) =>
      (slot: TeamSlot, ...args: Args) => {
        const previousTeam = { ...store().teams[slot] };
        action(store())(slot, ...args);
        if (!isAuthenticated) return;
        const optimisticTeam = store().teams[slot];
        // Each request needs its own promise: `mutate`'s per-call `onError` fires
        // only for the latest call.
        saveTeamApi(optimisticTeam).catch(() => {
          if (store().teams[slot] !== optimisticTeam) {
            toast.error('Failed to save team.');
            return;
          }
          store().setTeam(slot, previousTeam);
          toast.error('Failed to save team. Change has been reverted.');
        });
      };

    return {
      assignCharacter: editThenSave((s) => s.assignCharacter),
      removeCharacter: editThenSave((s) => s.removeCharacter),
      assignWeapon: editThenSave((s) => s.assignWeapon),
      removeWeapon: editThenSave((s) => s.removeWeapon),
      setArtifactPlan: editThenSave((s) => s.setArtifactPlan),
      setTeamName: editThenSave((s) => s.setTeamName),
      clearTeam: editThenSave((s) => s.clearTeam),
    };
  }, [isAuthenticated, saveTeamApi]);
}

/**
 * The team planner's whole interface: the four teams, the actions that change
 * them, and the state of the save behind them.
 *
 * Every action writes to the local store first and then saves, so the UI never
 * waits on the network. A failed save rolls the slot back only when the store
 * still holds the value that request sent; if the user has since changed the
 * same slot again, their newer edit stands and they get an error toast instead.
 *
 * Signed out, the actions still work and nothing is persisted, so a visitor can
 * plan a team before deciding to sign in. Signing out empties the teams, through
 * `ClearUserDataOnSignOut` rather than this hook.
 */
export function useTeams(): UseTeamsResult {
  const auth = useAuth();
  const uid = signedInUid(auth);
  const isAuthenticated = uid !== undefined;

  const teams = useTeamStore((s) => s.teams);
  const storeSetTeams = useTeamStore((s) => s.setTeams);

  const query = useTeamsQuery(uid);
  const { data: apiTeams, dataUpdatedAt } = query;
  const load = useUserDataLoad(auth, query);
  const isWritePending = useTeamWritePending(uid);

  const { mutateAsync: saveTeamApi, isPending: isSaving } = useSaveTeamMutation(uid);

  useWarnOnUnloadWhileSaving(isSaving);

  // The last write's refetch replaces a skipped answer. `dataUpdatedAt` reruns
  // this when that refetch returns identical data.
  useEffect(() => {
    if (!apiTeams || isWritePending()) return;
    storeSetTeams(collectionTeamsToStore(apiTeams));
  }, [apiTeams, dataUpdatedAt, isWritePending, storeSetTeams]);

  const actions = useTeamActions(isAuthenticated, saveTeamApi);

  const getTeam = useCallback((slot: TeamSlot) => teams[slot], [teams]);

  return {
    teams,
    ...actions,
    getTeam,
    isSaving,
    ...load,
  };
}
