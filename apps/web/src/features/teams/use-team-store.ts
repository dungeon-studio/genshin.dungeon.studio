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
 * Maps one slot's members and stamps `updatedAt`, which is every per-member
 * edit's state transition.
 */
function withMembers(
  state: Pick<TeamStoreState, 'teams'>,
  slot: TeamSlot,
  update: (member: CollectionTeamMember | null, index: number) => { characterId: string } | null,
): Pick<TeamStoreState, 'teams'> {
  return {
    teams: {
      ...state.teams,
      [slot]: {
        ...state.teams[slot],
        members: state.teams[slot].members.map(update) as CollectionTeamMembers,
        updatedAt: nowTimestamp(),
      },
    },
  };
}

/** The weapon `characterId` holds on any team other than `slot`, if one. */
function weaponHeldElsewhere(
  teams: Record<TeamSlot, CollectionTeam>,
  slot: TeamSlot,
  characterId: string,
): CollectionTeamMember['weaponInstanceId'] {
  for (const other of Object.values(teams)) {
    if (other.slot === slot) continue;
    const held = other.members.find((m) => m?.characterId === characterId && m.weaponInstanceId);
    if (held) return held.weaponInstanceId;
  }
  return undefined;
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
export const useTeamStore = create<TeamStoreState>()((set, get) => {
  // Every edit to a member already in a position; an empty one has nothing to patch.
  const patchMember = (
    slot: TeamSlot,
    memberIndex: number,
    patch: Partial<Omit<CollectionTeamMember, 'characterId'>>,
  ) => {
    if (!isValidMemberIndex(memberIndex) || !get().teams[slot].members[memberIndex]) return;
    set((state) =>
      withMembers(state, slot, (m, i) => (i === memberIndex && m ? { ...m, ...patch } : m)),
    );
  };

  return {
    teams: initialTeams(),

    assignCharacter: (slot, memberIndex, characterId, collectionWeaponId) => {
      if (!isValidMemberIndex(memberIndex)) return;
      const { teams } = get();
      if (teams[slot].members.some((m) => m?.characterId === characterId)) return;

      const weaponInstanceId = collectionWeaponId ?? weaponHeldElsewhere(teams, slot, characterId);

      set((state) =>
        withMembers(state, slot, (m, i) =>
          i === memberIndex ? { characterId, ...(weaponInstanceId && { weaponInstanceId }) } : m,
        ),
      );
    },

    removeCharacter: (slot, memberIndex) => {
      if (!isValidMemberIndex(memberIndex)) return;
      set((state) => withMembers(state, slot, (m, i) => (i === memberIndex ? null : m)));
    },

    assignWeapon: (slot, memberIndex, collectionWeaponId) => {
      patchMember(slot, memberIndex, { weaponInstanceId: collectionWeaponId });
    },

    removeWeapon: (slot, memberIndex) => {
      patchMember(slot, memberIndex, { weaponInstanceId: undefined });
    },

    setArtifactPlan: (slot, memberIndex, plan) => {
      patchMember(slot, memberIndex, { artifactPlan: plan });
    },

    clearTeam: (slot) => {
      set((state) => withMembers(state, slot, () => null));
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
  };
});
