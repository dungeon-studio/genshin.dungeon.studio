// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  ArtifactPlan,
  CollectionTeam,
  CollectionWeaponId,
  Team,
  TeamMember,
  TeamSlot,
} from '@genshin/domain';
import { initialTeams } from '@genshin/domain';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/useAuth';

import type { SaveTeamPayload } from './useTeamApi';
import { useDeleteTeamMutation, useSaveTeamMutation, useTeamsQuery } from './useTeamApi';
import { useTeamStore } from './useTeamStore';

export interface UseTeamsResult {
  teams: Record<TeamSlot, Team>;
  assignCharacter: (slot: TeamSlot, memberIndex: number, characterId: string) => void;
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
  getTeam: (slot: TeamSlot) => Team;
  isCharacterInTeam: (slot: TeamSlot, characterId: string) => boolean;
  isSaving: boolean;
  isLoading: boolean;
  error: Error | null;
}

function collectionTeamsToStore(apiTeams: CollectionTeam[]): Record<TeamSlot, Team> {
  const teams = initialTeams();

  for (const ct of apiTeams) {
    const members: Team['members'] = [undefined, undefined, undefined, undefined];
    for (let i = 0; i < ct.members.length && i < 4; i++) {
      members[i] = ct.members[i];
    }
    teams[ct.slot] = {
      slot: ct.slot,
      name: ct.name,
      members,
      description: ct.description,
      createdAt: ct.createdAt,
      updatedAt: ct.updatedAt,
    };
  }

  return teams;
}

function teamToSavePayload(team: Team): SaveTeamPayload {
  return {
    slot: team.slot,
    name: team.name,
    members: team.members.filter((m): m is TeamMember => m !== undefined),
    description: team.description,
  };
}

export function useTeams(): UseTeamsResult {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = user !== null;

  const teams = useTeamStore((s) => s.teams);
  const storeAssignCharacter = useTeamStore((s) => s.assignCharacter);
  const storeRemoveCharacter = useTeamStore((s) => s.removeCharacter);
  const storeAssignWeapon = useTeamStore((s) => s.assignWeapon);
  const storeRemoveWeapon = useTeamStore((s) => s.removeWeapon);
  const storeSetArtifactPlan = useTeamStore((s) => s.setArtifactPlan);
  const storeClearTeam = useTeamStore((s) => s.clearTeam);
  const storeSetTeamName = useTeamStore((s) => s.setTeamName);
  const storeSetTeam = useTeamStore((s) => s.setTeam);
  const storeSetTeams = useTeamStore((s) => s.setTeams);
  const storeResetTeams = useTeamStore((s) => s.resetTeams);

  const { data: apiTeams, error: queryError, isLoading: queryLoading } = useTeamsQuery(user?.uid);

  const { mutate: saveTeamApi, isPending: isSavePending } = useSaveTeamMutation(user?.uid);
  const { mutate: deleteTeamApi, isPending: isDeletePending } = useDeleteTeamMutation(user?.uid);

  const isSaving = isSavePending || isDeletePending;

  // Track isSaving in a ref so the beforeunload handler always sees the latest value.
  const isSavingRef = useRef(isSaving);
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  // Warn the user if they try to leave with unsaved changes in flight.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isSavingRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

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

  // Helper: save a team slot after an optimistic store update, rolling back on failure.
  const saveAfterMutation = useCallback(
    (slot: TeamSlot, previousTeam: Team) => {
      const updatedTeam = useTeamStore.getState().teams[slot];
      saveTeamApi(teamToSavePayload(updatedTeam), {
        onError: () => {
          storeSetTeam(slot, previousTeam);
          toast.error('Failed to save team. Change has been reverted.');
        },
      });
    },
    [saveTeamApi, storeSetTeam],
  );

  const assignCharacter = useCallback(
    (slot: TeamSlot, memberIndex: number, characterId: string) => {
      const previousTeam = { ...useTeamStore.getState().teams[slot] };
      storeAssignCharacter(slot, memberIndex, characterId);
      if (isAuthenticated) {
        saveAfterMutation(slot, previousTeam);
      }
    },
    [isAuthenticated, storeAssignCharacter, saveAfterMutation],
  );

  const removeCharacter = useCallback(
    (slot: TeamSlot, memberIndex: number) => {
      const previousTeam = { ...useTeamStore.getState().teams[slot] };
      storeRemoveCharacter(slot, memberIndex);
      if (isAuthenticated) {
        saveAfterMutation(slot, previousTeam);
      }
    },
    [isAuthenticated, storeRemoveCharacter, saveAfterMutation],
  );

  const assignWeapon = useCallback(
    (slot: TeamSlot, memberIndex: number, collectionWeaponId: CollectionWeaponId) => {
      const previousTeam = { ...useTeamStore.getState().teams[slot] };
      storeAssignWeapon(slot, memberIndex, collectionWeaponId);
      if (isAuthenticated) {
        saveAfterMutation(slot, previousTeam);
      }
    },
    [isAuthenticated, storeAssignWeapon, saveAfterMutation],
  );

  const removeWeapon = useCallback(
    (slot: TeamSlot, memberIndex: number) => {
      const previousTeam = { ...useTeamStore.getState().teams[slot] };
      storeRemoveWeapon(slot, memberIndex);
      if (isAuthenticated) {
        saveAfterMutation(slot, previousTeam);
      }
    },
    [isAuthenticated, storeRemoveWeapon, saveAfterMutation],
  );

  const setArtifactPlan = useCallback(
    (slot: TeamSlot, memberIndex: number, plan: ArtifactPlan | undefined) => {
      const previousTeam = { ...useTeamStore.getState().teams[slot] };
      storeSetArtifactPlan(slot, memberIndex, plan);
      if (isAuthenticated) {
        saveAfterMutation(slot, previousTeam);
      }
    },
    [isAuthenticated, storeSetArtifactPlan, saveAfterMutation],
  );

  const clearTeam = useCallback(
    (slot: TeamSlot) => {
      const previousTeam = { ...useTeamStore.getState().teams[slot] };
      storeClearTeam(slot);
      if (isAuthenticated) {
        deleteTeamApi(slot, {
          onError: () => {
            storeSetTeam(slot, previousTeam);
            toast.error('Failed to clear team. Change has been reverted.');
          },
        });
      }
    },
    [isAuthenticated, storeClearTeam, deleteTeamApi, storeSetTeam],
  );

  const setTeamName = useCallback(
    (slot: TeamSlot, name: string) => {
      const previousTeam = { ...useTeamStore.getState().teams[slot] };
      storeSetTeamName(slot, name);
      if (isAuthenticated) {
        saveAfterMutation(slot, previousTeam);
      }
    },
    [isAuthenticated, storeSetTeamName, saveAfterMutation],
  );

  const getTeam = useCallback((slot: TeamSlot) => teams[slot], [teams]);

  const isCharacterInTeam = useCallback(
    (slot: TeamSlot, characterId: string) =>
      teams[slot].members.some((m) => m?.characterId === characterId),
    [teams],
  );

  const error = isAuthenticated ? (queryError ?? null) : null;

  return {
    teams,
    assignCharacter,
    removeCharacter,
    assignWeapon,
    removeWeapon,
    setArtifactPlan,
    clearTeam,
    setTeamName,
    getTeam,
    isCharacterInTeam,
    isSaving,
    isLoading: authLoading || (isAuthenticated && queryLoading),
    error,
  };
}
