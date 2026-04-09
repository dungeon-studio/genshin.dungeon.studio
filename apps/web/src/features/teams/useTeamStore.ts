// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ArtifactPlan, CollectionWeaponId, Team, TeamSlot } from '@genshin/domain';
import { initialTeams, isValidMemberIndex } from '@genshin/domain';
import { create } from 'zustand';

interface TeamStoreState {
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
  setTeam: (slot: TeamSlot, team: Team) => void;
  setTeams: (teams: Record<TeamSlot, Team>) => void;
  resetTeams: () => void;

  getTeam: (slot: TeamSlot) => Team;
  isCharacterInTeam: (slot: TeamSlot, characterId: string) => boolean;
}

export const useTeamStore = create<TeamStoreState>()((set, get) => ({
  teams: initialTeams(),

  assignCharacter: (slot, memberIndex, characterId) => {
    if (!isValidMemberIndex(memberIndex)) return;
    const team = get().teams[slot];
    if (team.members.some((m) => m?.characterId === characterId)) return;

    // Auto-populate weapon from another team where this character already has one equipped.
    const allTeams = get().teams;
    let existingWeaponId: CollectionWeaponId | undefined;
    for (const other of Object.values(allTeams)) {
      if (other.slot === slot) continue;
      const match = other.members.find((m) => m?.characterId === characterId && m.weaponInstanceId);
      if (match?.weaponInstanceId) {
        existingWeaponId = match.weaponInstanceId;
        break;
      }
    }

    set((state) => ({
      teams: {
        ...state.teams,
        [slot]: {
          ...state.teams[slot],
          members: state.teams[slot].members.map((m, i) =>
            i === memberIndex
              ? { characterId, ...(existingWeaponId && { weaponInstanceId: existingWeaponId }) }
              : m,
          ) as Team['members'],
        },
      },
    }));
  },

  removeCharacter: (slot, memberIndex) => {
    if (!isValidMemberIndex(memberIndex)) return;

    set((state) => ({
      teams: {
        ...state.teams,
        [slot]: {
          ...state.teams[slot],
          members: state.teams[slot].members.map((m, i) =>
            i === memberIndex ? undefined : m,
          ) as Team['members'],
        },
      },
    }));
  },

  assignWeapon: (slot, memberIndex, collectionWeaponId) => {
    if (!isValidMemberIndex(memberIndex)) return;
    if (!get().teams[slot].members[memberIndex]) return;

    set((state) => ({
      teams: {
        ...state.teams,
        [slot]: {
          ...state.teams[slot],
          members: state.teams[slot].members.map((m, i) =>
            i === memberIndex && m ? { ...m, weaponInstanceId: collectionWeaponId } : m,
          ) as Team['members'],
        },
      },
    }));
  },

  removeWeapon: (slot, memberIndex) => {
    if (!isValidMemberIndex(memberIndex)) return;
    if (!get().teams[slot].members[memberIndex]) return;

    set((state) => ({
      teams: {
        ...state.teams,
        [slot]: {
          ...state.teams[slot],
          members: state.teams[slot].members.map((m, i) =>
            i === memberIndex && m ? { ...m, weaponInstanceId: undefined } : m,
          ) as Team['members'],
        },
      },
    }));
  },

  setArtifactPlan: (slot, memberIndex, plan) => {
    if (!isValidMemberIndex(memberIndex)) return;
    if (!get().teams[slot].members[memberIndex]) return;

    set((state) => ({
      teams: {
        ...state.teams,
        [slot]: {
          ...state.teams[slot],
          members: state.teams[slot].members.map((m, i) =>
            i === memberIndex && m ? { ...m, artifactPlan: plan } : m,
          ) as Team['members'],
        },
      },
    }));
  },

  clearTeam: (slot) => {
    set((state) => ({
      teams: {
        ...state.teams,
        [slot]: {
          ...state.teams[slot],
          members: [undefined, undefined, undefined, undefined],
        },
      },
    }));
  },

  setTeamName: (slot, name) => {
    set((state) => ({
      teams: {
        ...state.teams,
        [slot]: { ...state.teams[slot], name },
      },
    }));
  },

  setTeam: (slot, team) => {
    set((state) => ({
      teams: { ...state.teams, [slot]: team },
    }));
  },

  setTeams: (teams) => {
    set({ teams });
  },

  resetTeams: () => {
    set({ teams: initialTeams() });
  },

  getTeam: (slot) => get().teams[slot],

  isCharacterInTeam: (slot, characterId) => {
    return get().teams[slot].members.some((m) => m?.characterId === characterId);
  },
}));
