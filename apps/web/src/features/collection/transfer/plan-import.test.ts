// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  CharacterId,
  CollectionCharacter,
  CollectionTeam,
  CollectionWeapon,
  CollectionWeaponId,
  TeamSlot,
} from '@genshin/domain';
import { describe, expect, it } from 'vitest';

import { makeCharacter, makeTeam, makeWeapon } from '@/test/fixtures';

import type { CollectionSnapshot } from './collection-snapshot';
import type { PlannedTeam } from './plan-import';
import { planImport, plannedCount, resolveTeamMembers } from './plan-import';

const WEAPON_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const OTHER_WEAPON_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

function snapshot(overrides: Partial<CollectionSnapshot> = {}): CollectionSnapshot {
  return {
    characters: {} as Record<CharacterId, CollectionCharacter>,
    weapons: {} as Record<CollectionWeaponId, CollectionWeapon>,
    teams: {
      1: makeTeam(1),
      2: makeTeam(2),
      3: makeTeam(3),
      4: makeTeam(4),
    } as Record<TeamSlot, CollectionTeam>,
    ...overrides,
  };
}

function envelope(overrides: Partial<Parameters<typeof planImport>[0]> = {}) {
  return { characters: [], weapons: [], teams: [], ...overrides };
}

describe('planImport', () => {
  describe('against an empty collection', () => {
    it('treats every entry as new', () => {
      const plan = planImport(
        envelope({
          characters: [{ characterId: 'amber', constellationLevel: 2 }],
          weapons: [
            { weaponInstanceId: WEAPON_ID, weaponId: 'mistsplitter-reforged', refinementLevel: 1 },
          ],
          teams: [
            { slot: 1, name: 'Team 1', members: [{ characterId: 'amber' }, null, null, null] },
          ],
        }),
        snapshot(),
      );

      expect(plan.characters.create).toHaveLength(1);
      expect(plan.characters.update).toHaveLength(0);
      expect(plan.weapons.create).toHaveLength(1);
      expect(plan.weapons.update).toHaveLength(0);
      expect(plan.teams.create).toHaveLength(1);
      expect(plan.teams.update).toHaveLength(0);
    });
  });

  describe('against a collection already holding the same entries', () => {
    it('treats every entry as an update, so a re-import creates no duplicates', () => {
      const plan = planImport(
        envelope({
          characters: [{ characterId: 'amber', constellationLevel: 2 }],
          weapons: [
            { weaponInstanceId: WEAPON_ID, weaponId: 'mistsplitter-reforged', refinementLevel: 1 },
          ],
          teams: [
            { slot: 1, name: 'Team 1', members: [{ characterId: 'amber' }, null, null, null] },
          ],
        }),
        snapshot({
          characters: { amber: makeCharacter('amber') } as Record<CharacterId, CollectionCharacter>,
          weapons: {
            [WEAPON_ID]: makeWeapon(WEAPON_ID, 'mistsplitter-reforged'),
          } as Record<CollectionWeaponId, CollectionWeapon>,
          teams: {
            1: makeTeam(1, { members: [{ characterId: 'xiangling' }, null, null, null] }),
            2: makeTeam(2),
            3: makeTeam(3),
            4: makeTeam(4),
          } as Record<TeamSlot, CollectionTeam>,
        }),
      );

      expect(plan.characters.create).toHaveLength(0);
      expect(plan.characters.update).toHaveLength(1);
      expect(plan.weapons.create).toHaveLength(0);
      expect(plan.weapons.update).toHaveLength(1);
      expect(plan.teams.create).toHaveLength(0);
      expect(plan.teams.update).toHaveLength(1);
    });
  });

  it('counts a team slot that exists but is empty as new', () => {
    const plan = planImport(
      envelope({
        teams: [{ slot: 2, name: 'Team 2', members: [{ characterId: 'amber' }, null, null, null] }],
      }),
      snapshot(),
    );

    expect(plan.teams.create).toHaveLength(1);
  });

  describe('entries the app cannot apply', () => {
    it('drops an unknown character but keeps the rest of the file', () => {
      const plan = planImport(
        envelope({
          characters: [
            { characterId: 'not-a-character', constellationLevel: 0 },
            { characterId: 'amber', constellationLevel: 0 },
          ],
        }),
        snapshot(),
      );

      expect(plan.characters.create).toHaveLength(1);
      expect(plan.skipped).toEqual([
        expect.objectContaining({ kind: 'character', label: 'not-a-character' }),
      ]);
    });

    it('drops a character whose constellation level is out of range', () => {
      const plan = planImport(
        envelope({ characters: [{ characterId: 'amber', constellationLevel: 9 }] }),
        snapshot(),
      );

      expect(plannedCount(plan)).toBe(0);
      expect(plan.skipped[0].reason).toContain('out of range');
    });

    it('drops a weapon whose identifier could not have come from this app', () => {
      const plan = planImport(
        envelope({
          weapons: [
            {
              weaponInstanceId: '../escape',
              weaponId: 'mistsplitter-reforged',
              refinementLevel: 1,
            },
          ],
        }),
        snapshot(),
      );

      expect(plannedCount(plan)).toBe(0);
      expect(plan.skipped[0].reason).toContain('not a UUID');
    });

    it('drops a weapon whose refinement level is out of range', () => {
      const plan = planImport(
        envelope({
          weapons: [
            { weaponInstanceId: WEAPON_ID, weaponId: 'mistsplitter-reforged', refinementLevel: 0 },
          ],
        }),
        snapshot(),
      );

      expect(plannedCount(plan)).toBe(0);
      expect(plan.skipped[0].reason).toContain('out of range');
    });

    it('drops a team claiming a slot that does not exist', () => {
      const plan = planImport(
        envelope({ teams: [{ slot: 7, name: 'Overflow', members: [] }] }),
        snapshot(),
      );

      expect(plannedCount(plan)).toBe(0);
      expect(plan.skipped[0]).toEqual(expect.objectContaining({ kind: 'team', label: 'Overflow' }));
    });
  });
});

describe('resolveTeamMembers', () => {
  const team: PlannedTeam = {
    slot: 1,
    name: 'Team 1',
    members: [{ characterId: 'amber', weaponInstanceId: WEAPON_ID }, null, null, null],
  };

  it('keeps a weapon reference the same import is about to create', () => {
    const members = resolveTeamMembers(team, new Set([WEAPON_ID]), snapshot());

    expect(members[0]).toEqual({ characterId: 'amber', weaponInstanceId: WEAPON_ID });
  });

  it('keeps a weapon reference the collection already owns', () => {
    const members = resolveTeamMembers(
      team,
      new Set(),
      snapshot({
        weapons: {
          [WEAPON_ID]: makeWeapon(WEAPON_ID, 'mistsplitter-reforged'),
        } as Record<CollectionWeaponId, CollectionWeapon>,
      }),
    );

    expect(members[0]).toEqual({ characterId: 'amber', weaponInstanceId: WEAPON_ID });
  });

  it('keeps the member but drops a reference that would dangle', () => {
    const members = resolveTeamMembers(team, new Set([OTHER_WEAPON_ID]), snapshot());

    expect(members[0]).toEqual({ characterId: 'amber' });
  });

  it('leaves empty positions alone', () => {
    const members = resolveTeamMembers(team, new Set([WEAPON_ID]), snapshot());

    expect(members.slice(1)).toEqual([null, null, null]);
  });
});
