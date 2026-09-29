// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ArtifactPlan, CollectionTeam, CollectionWeaponId, TeamSlot } from '@genshin/domain';
import { initialTeams } from '@genshin/domain';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/use-auth';

import type { SaveTeamPayload } from './use-team-api';
import { useDeleteTeamMutation, useSaveTeamMutation, useTeamsQuery } from './use-team-api';
import { useTeamStore } from './use-team-store';

export interface UseTeamsResult {
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
  isCharacterInTeam: (slot: TeamSlot, characterId: string) => boolean;
  isSaving: boolean;
  isLoading: boolean;
  error: Error | null;
}

function collectionTeamsToStore(apiTeams: CollectionTeam[]): Record<TeamSlot, CollectionTeam> {
  const teams = initialTeams();

  for (const ct of apiTeams) {
    teams[ct.slot] = ct;
  }

  return teams;
}

function teamToSavePayload(team: CollectionTeam): SaveTeamPayload {
  return {
    slot: team.slot,
    name: team.name,
    members: team.members,
    description: team.description,
  };
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

function useTeamActions(
  isAuthenticated: boolean,
  saveTeamApi: ReturnType<typeof useSaveTeamMutation>['mutate'],
  deleteTeamApi: ReturnType<typeof useDeleteTeamMutation>['mutate'],
): TeamActions {
  return useMemo(() => {
    const store = () => useTeamStore.getState();

    const editThenPersist = (
      slot: TeamSlot,
      edit: () => void,
      request: (onError: () => void) => void,
      failure: string,
    ) => {
      const previousTeam = { ...store().teams[slot] };
      edit();
      if (!isAuthenticated) return;
      const optimisticTeam = store().teams[slot];
      request(() => {
        if (store().teams[slot] !== optimisticTeam) {
          toast.error(`${failure}.`);
          return;
        }
        store().setTeam(slot, previousTeam);
        toast.error(`${failure}. Change has been reverted.`);
      });
    };

    const editThenSave = (slot: TeamSlot, edit: () => void) => {
      editThenPersist(
        slot,
        edit,
        (onError) => {
          saveTeamApi(teamToSavePayload(store().teams[slot]), { onError });
        },
        'Failed to save team',
      );
    };

    return {
      assignCharacter: (slot, memberIndex, characterId, collectionWeaponId) => {
        editThenSave(slot, () => {
          store().assignCharacter(slot, memberIndex, characterId, collectionWeaponId);
        });
      },
      removeCharacter: (slot, memberIndex) => {
        editThenSave(slot, () => {
          store().removeCharacter(slot, memberIndex);
        });
      },
      assignWeapon: (slot, memberIndex, collectionWeaponId) => {
        editThenSave(slot, () => {
          store().assignWeapon(slot, memberIndex, collectionWeaponId);
        });
      },
      removeWeapon: (slot, memberIndex) => {
        editThenSave(slot, () => {
          store().removeWeapon(slot, memberIndex);
        });
      },
      setArtifactPlan: (slot, memberIndex, plan) => {
        editThenSave(slot, () => {
          store().setArtifactPlan(slot, memberIndex, plan);
        });
      },
      setTeamName: (slot, name) => {
        editThenSave(slot, () => {
          store().setTeamName(slot, name);
        });
      },
      clearTeam: (slot) => {
        editThenPersist(
          slot,
          () => {
            store().clearTeam(slot);
          },
          (onError) => {
            deleteTeamApi(slot, { onError });
          },
          'Failed to clear team',
        );
      },
    };
  }, [isAuthenticated, saveTeamApi, deleteTeamApi]);
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
 * plan a team before deciding to sign in. Signing out discards it.
 */
export function useTeams(): UseTeamsResult {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = user !== null;

  const teams = useTeamStore((s) => s.teams);
  const storeSetTeams = useTeamStore((s) => s.setTeams);
  const storeResetTeams = useTeamStore((s) => s.resetTeams);

  const { data: apiTeams, error: queryError, isLoading: queryLoading } = useTeamsQuery(user?.uid);

  const { mutate: saveTeamApi, isPending: isSavePending } = useSaveTeamMutation(user?.uid);
  const { mutate: deleteTeamApi, isPending: isDeletePending } = useDeleteTeamMutation(user?.uid);

  const isSaving = isSavePending || isDeletePending;

  useWarnOnUnloadWhileSaving(isSaving);

  // Reset store on logout
  useEffect(() => {
    if (!user) {
      storeResetTeams();
    }
  }, [user, storeResetTeams]);

  // Populate store from API data
  useEffect(() => {
    if (!apiTeams) return;
    storeSetTeams(collectionTeamsToStore(apiTeams));
  }, [apiTeams, storeSetTeams]);

  const actions = useTeamActions(isAuthenticated, saveTeamApi, deleteTeamApi);

  const getTeam = useCallback((slot: TeamSlot) => teams[slot], [teams]);

  const isCharacterInTeam = useCallback(
    (slot: TeamSlot, characterId: string) =>
      teams[slot].members.some((m) => m?.characterId === characterId),
    [teams],
  );

  const error = isAuthenticated ? (queryError ?? null) : null;

  return {
    teams,
    ...actions,
    getTeam,
    isCharacterInTeam,
    isSaving,
    isLoading: authLoading || (isAuthenticated && queryLoading),
    error,
  };
}
