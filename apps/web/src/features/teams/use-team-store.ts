// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  ArtifactPlan,
  CollectionTeam,
  CollectionTeamMember,
  CollectionTeamMembers,
  CollectionWeaponId,
  TeamSlot,
} from '@genshin/domain';
import { defaultTeamName, initialTeams, isValidMemberIndex, nowTimestamp } from '@genshin/domain';
import { create } from 'zustand';

interface TeamStoreState {
  teams: Record<TeamSlot, CollectionTeam>;

  /**
   * Ignored when the character already sits in this team. With no weapon
   * given, carries over the one this character holds on another team, so
   * adding a character somewhere else doesn't lose their loadout.
   */
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
  /** The name survives; only the positions are emptied. */
  clearTeam: (slot: TeamSlot) => void;
  /** A blank or whitespace-only name reverts to the slot's default. */
  setTeamName: (slot: TeamSlot, name: string) => void;
  setTeam: (slot: TeamSlot, team: CollectionTeam) => void;
  setTeams: (teams: Record<TeamSlot, CollectionTeam>) => void;
  resetTeams: () => void;

  getTeam: (slot: TeamSlot) => CollectionTeam;
  isCharacterInTeam: (slot: TeamSlot, characterId: string) => boolean;
}

/**
 * The four teams as the UI currently shows them, with no knowledge of the API.
 *
 * Components reach for `useTeams` instead, which wraps this with loading and
 * saving. This store is for that hook and for tests.
 *
 * Every mutation is a silent no-op when it can't apply, such as an index
 * outside a team or a weapon assigned to an empty position, so a caller gets no
 * signal that nothing happened.
 *
 * `setTeam` and `setTeams` are the exception to the `updatedAt` stamping. They
 * replace state wholesale, which is how a server response lands without looking
 * like a user edit.
 */
export const useTeamStore = create<TeamStoreState>()((set, get) => ({
  teams: initialTeams(),

  assignCharacter: (slot, memberIndex, characterId, collectionWeaponId) => {
    if (!isValidMemberIndex(memberIndex)) return;
    const team = get().teams[slot];
    if (team.members.some((m) => m?.characterId === characterId)) return;

    // Auto-populate weapon from another team where this character already has one equipped.
    const allTeams = get().teams;
    let existingWeaponId: CollectionTeamMember['weaponInstanceId'];
    for (const other of Object.values(allTeams)) {
      if (other.slot === slot) continue;
      for (const member of other.members) {
        if (member?.characterId === characterId && member.weaponInstanceId) {
          existingWeaponId = member.weaponInstanceId;
          break;
        }
      }
      if (existingWeaponId) break;
    }

    const weaponInstanceId = collectionWeaponId ?? existingWeaponId;

    set((state) => ({
      teams: {
        ...state.teams,
        [slot]: {
          ...state.teams[slot],
          members: state.teams[slot].members.map((m, i) =>
            i === memberIndex ? { characterId, ...(weaponInstanceId && { weaponInstanceId }) } : m,
          ) as CollectionTeamMembers,
          updatedAt: nowTimestamp(),
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
            i === memberIndex ? null : m,
          ) as CollectionTeamMembers,
          updatedAt: nowTimestamp(),
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
          ) as CollectionTeamMembers,
          updatedAt: nowTimestamp(),
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
          ) as CollectionTeamMembers,
          updatedAt: nowTimestamp(),
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
          ) as CollectionTeamMembers,
          updatedAt: nowTimestamp(),
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
          members: [null, null, null, null],
          updatedAt: nowTimestamp(),
        },
      },
    }));
  },

  setTeamName: (slot, name) => {
    const trimmed = name.trim();
    const nextName = trimmed || defaultTeamName(slot);
    set((state) => ({
      teams: {
        ...state.teams,
        [slot]: { ...state.teams[slot], name: nextName, updatedAt: nowTimestamp() },
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
