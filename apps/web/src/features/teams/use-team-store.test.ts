// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam, CollectionWeaponId, ISOTimestamp, TeamSlot } from '@genshin/domain';
import { initialTeams } from '@genshin/domain';
import { beforeEach, describe, expect, it } from 'vitest';

import { useTeamStore } from './use-team-store';

describe('useTeamStore', () => {
  beforeEach(() => {
    useTeamStore.getState().resetTeams();
  });

  describe('initial state', () => {
    it('starts with four empty teams', () => {
      const { teams } = useTeamStore.getState();

      expect(Object.keys(teams)).toHaveLength(4);
      for (const slot of [1, 2, 3, 4] as TeamSlot[]) {
        const team = teams[slot];
        expect(team.slot).toBe(slot);
        expect(team.name).toBe(`Team ${slot}`);
        expect(team.members).toEqual([null, null, null, null]);
      }
    });
  });

  describe('assignCharacter', () => {
    it('assigns a character to the specified team slot and member position', () => {
      useTeamStore.getState().assignCharacter(1, 0, 'amber');

      const team = useTeamStore.getState().teams[1];
      expect(team.members[0]).toEqual({ characterId: 'amber' });
      expect(team.members[1]).toBeNull();
    });

    it('ignores invalid member indices', () => {
      useTeamStore.getState().assignCharacter(1, -1, 'amber');
      useTeamStore.getState().assignCharacter(1, 4, 'amber');

      const team = useTeamStore.getState().teams[1];
      expect(team.members).toEqual([null, null, null, null]);
    });

    it('prevents duplicate characters in the same team', () => {
      useTeamStore.getState().assignCharacter(1, 0, 'amber');
      useTeamStore.getState().assignCharacter(1, 1, 'amber');

      const team = useTeamStore.getState().teams[1];
      expect(team.members[0]).toEqual({ characterId: 'amber' });
      expect(team.members[1]).toBeNull();
    });

    it('auto-populates weapon from another team', () => {
      const weaponId = 'weapon-instance-1' as CollectionWeaponId;
      useTeamStore.getState().assignCharacter(1, 0, 'amber');
      useTeamStore.getState().assignWeapon(1, 0, weaponId);

      useTeamStore.getState().assignCharacter(2, 0, 'amber');

      const team2 = useTeamStore.getState().teams[2];
      expect(team2.members[0]?.weaponInstanceId).toBe(weaponId);
    });
  });

  describe('removeCharacter', () => {
    it('removes a character from the specified position', () => {
      useTeamStore.getState().assignCharacter(1, 0, 'amber');
      useTeamStore.getState().removeCharacter(1, 0);

      const team = useTeamStore.getState().teams[1];
      expect(team.members[0]).toBeNull();
    });

    it('ignores invalid member indices', () => {
      useTeamStore.getState().assignCharacter(1, 0, 'amber');
      useTeamStore.getState().removeCharacter(1, 5);

      expect(useTeamStore.getState().teams[1].members[0]).toEqual({ characterId: 'amber' });
    });
  });

  describe('assignWeapon', () => {
    it('assigns a weapon to an existing team member', () => {
      const weaponId = 'weapon-1' as CollectionWeaponId;
      useTeamStore.getState().assignCharacter(1, 0, 'amber');
      useTeamStore.getState().assignWeapon(1, 0, weaponId);

      expect(useTeamStore.getState().teams[1].members[0]?.weaponInstanceId).toBe(weaponId);
    });

    it('does nothing if no character occupies the position', () => {
      const weaponId = 'weapon-1' as CollectionWeaponId;
      useTeamStore.getState().assignWeapon(1, 0, weaponId);

      expect(useTeamStore.getState().teams[1].members[0]).toBeNull();
    });
  });

  describe('removeWeapon', () => {
    it('removes the weapon from a team member', () => {
      const weaponId = 'weapon-1' as CollectionWeaponId;
      useTeamStore.getState().assignCharacter(1, 0, 'amber');
      useTeamStore.getState().assignWeapon(1, 0, weaponId);
      useTeamStore.getState().removeWeapon(1, 0);

      expect(useTeamStore.getState().teams[1].members[0]?.weaponInstanceId).toBeUndefined();
    });
  });

  describe('clearTeam', () => {
    it('removes all members from a team', () => {
      useTeamStore.getState().assignCharacter(1, 0, 'amber');
      useTeamStore.getState().assignCharacter(1, 1, 'xiangling');
      useTeamStore.getState().clearTeam(1);

      expect(useTeamStore.getState().teams[1].members).toEqual([null, null, null, null]);
    });
  });

  describe('setTeamName', () => {
    it('updates the team name', () => {
      useTeamStore.getState().setTeamName(1, 'National Team');

      expect(useTeamStore.getState().teams[1].name).toBe('National Team');
    });
  });

  describe('setTeams', () => {
    it('replaces all teams', () => {
      const newTeams = initialTeams();
      newTeams[1].name = 'Custom';
      useTeamStore.getState().setTeams(newTeams);

      expect(useTeamStore.getState().teams[1].name).toBe('Custom');
    });
  });

  describe('resetTeams', () => {
    it('restores teams to initial state', () => {
      useTeamStore.getState().assignCharacter(1, 0, 'amber');
      useTeamStore.getState().setTeamName(2, 'Modified');
      useTeamStore.getState().resetTeams();

      const { teams } = useTeamStore.getState();
      expect(teams[1].members[0]).toBeNull();
      expect(teams[2].name).toBe('Team 2');
    });
  });

  describe('isCharacterInTeam', () => {
    it('returns true when the character is in the team', () => {
      useTeamStore.getState().assignCharacter(1, 0, 'amber');

      expect(useTeamStore.getState().isCharacterInTeam(1, 'amber')).toBe(true);
    });

    it('returns false when the character is not in the team', () => {
      expect(useTeamStore.getState().isCharacterInTeam(1, 'amber')).toBe(false);
    });
  });

  describe('setArtifactPlan', () => {
    it('sets an artifact plan on a team member', () => {
      useTeamStore.getState().assignCharacter(1, 0, 'amber');
      const plan = { sands: 'ATK Percentage' as const };
      useTeamStore.getState().setArtifactPlan(1, 0, plan);

      expect(useTeamStore.getState().teams[1].members[0]?.artifactPlan).toEqual(plan);
    });

    it('does nothing if no character occupies the position', () => {
      const plan = { sands: 'ATK Percentage' as const };
      useTeamStore.getState().setArtifactPlan(1, 0, plan);

      expect(useTeamStore.getState().teams[1].members[0]).toBeNull();
    });

    it('clears an artifact plan when given undefined', () => {
      useTeamStore.getState().assignCharacter(1, 0, 'amber');
      useTeamStore.getState().setArtifactPlan(1, 0, { sands: 'ATK Percentage' as const });
      useTeamStore.getState().setArtifactPlan(1, 0, undefined);

      expect(useTeamStore.getState().teams[1].members[0]?.artifactPlan).toBeUndefined();
    });
  });

  describe('setTeam', () => {
    it('replaces a single team', () => {
      const custom: CollectionTeam = {
        slot: 3,
        name: 'Freeze',
        members: [{ characterId: 'ganyu' }, null, null, null],
        createdAt: '2026-01-01T00:00:00.000Z' as ISOTimestamp,
        updatedAt: '2026-01-01T00:00:00.000Z' as ISOTimestamp,
      };
      useTeamStore.getState().setTeam(3, custom);

      expect(useTeamStore.getState().teams[3]).toEqual(custom);
      // Other teams unchanged
      expect(useTeamStore.getState().teams[1].name).toBe('Team 1');
    });
  });
});
