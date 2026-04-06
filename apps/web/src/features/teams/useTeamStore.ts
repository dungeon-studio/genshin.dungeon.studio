// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { TeamMember, TeamSlot } from '@genshin/domain';
import { MAX_TEAM_MEMBERS, MAX_TEAM_SLOT, MIN_TEAM_SLOT } from '@genshin/domain';
import { create } from 'zustand';

interface TeamState {
  name: string;
  members: TeamMember[];
}

function createEmptyTeam(slot: TeamSlot): TeamState {
  return { name: `Team ${slot}`, members: [] };
}

function initialTeams(): Record<TeamSlot, TeamState> {
  return {
    1: createEmptyTeam(1),
    2: createEmptyTeam(2),
    3: createEmptyTeam(3),
    4: createEmptyTeam(4),
  };
}

interface TeamStoreState {
  teams: Record<TeamSlot, TeamState>;
  selectedSlot: TeamSlot | null;

  selectSlot: (slot: TeamSlot) => void;
  deselectSlot: () => void;
  assignCharacter: (slot: TeamSlot, characterId: string) => void;
  removeCharacter: (slot: TeamSlot, memberIndex: number) => void;
  clearTeam: (slot: TeamSlot) => void;
  setTeamName: (slot: TeamSlot, name: string) => void;

  getTeam: (slot: TeamSlot) => TeamState;
  isCharacterInTeam: (slot: TeamSlot, characterId: string) => boolean;
}

export const useTeamStore = create<TeamStoreState>()((set, get) => ({
  teams: initialTeams(),
  selectedSlot: null,

  selectSlot: (slot) => {
    set({ selectedSlot: slot });
  },

  deselectSlot: () => {
    set({ selectedSlot: null });
  },

  assignCharacter: (slot, characterId) => {
    const team = get().teams[slot];
    if (team.members.length >= MAX_TEAM_MEMBERS) return;
    if (team.members.some((m) => m.characterId === characterId)) return;

    set((state) => ({
      teams: {
        ...state.teams,
        [slot]: {
          ...state.teams[slot],
          members: [...state.teams[slot].members, { characterId }],
        },
      },
    }));
  },

  removeCharacter: (slot, memberIndex) => {
    const team = get().teams[slot];
    if (memberIndex < 0 || memberIndex >= team.members.length) return;

    set((state) => ({
      teams: {
        ...state.teams,
        [slot]: {
          ...state.teams[slot],
          members: state.teams[slot].members.filter((_, i) => i !== memberIndex),
        },
      },
    }));
  },

  clearTeam: (slot) => {
    set((state) => ({
      teams: {
        ...state.teams,
        [slot]: { ...state.teams[slot], members: [] },
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

  getTeam: (slot) => get().teams[slot],

  isCharacterInTeam: (slot, characterId) => {
    return get().teams[slot].members.some((m) => m.characterId === characterId);
  },
}));

export const TEAM_SLOTS: TeamSlot[] = Array.from(
  { length: MAX_TEAM_SLOT - MIN_TEAM_SLOT + 1 },
  (_, i) => (MIN_TEAM_SLOT + i) as TeamSlot,
);
