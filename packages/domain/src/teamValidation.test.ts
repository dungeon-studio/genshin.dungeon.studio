// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import type { ArtifactPlan } from './artifactPlan.js';
import type { CollectionTeamMembers, TeamSlot } from './collectionTeam.js';
import type { TeamValidationContext } from './teamValidation.js';
import { validateTeam, validateTeams } from './teamValidation.js';
import type { UUID } from './uuid.js';

const EMPTY_MEMBERS: CollectionTeamMembers = [null, null, null, null];

describe('validateTeam', () => {
  it('returns no issues for a valid team', () => {
    const issues = validateTeam({
      name: 'Team 1',
      members: [{ characterId: 'columbina' }, { characterId: 'durin' }, null, null],
    });
    expect(issues).toEqual([]);
  });

  it('returns no issues for an all-null team', () => {
    const issues = validateTeam({ name: 'Empty', members: EMPTY_MEMBERS });
    expect(issues).toEqual([]);
  });

  it('detects duplicate character IDs', () => {
    const issues = validateTeam({
      name: 'Dupes',
      members: [{ characterId: 'columbina' }, { characterId: 'columbina' }, null, null],
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/Duplicate character/i);
  });

  it('detects duplicate weapon instance IDs within a team', () => {
    const issues = validateTeam({
      name: 'Dupe weapons',
      members: [
        { characterId: 'columbina', weaponInstanceId: 'weapon-1' as UUID },
        { characterId: 'durin', weaponInstanceId: 'weapon-1' as UUID },
        null,
        null,
      ],
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.message.match(/Duplicate weapon/i))).toBe(true);
  });

  describe('with ownership context', () => {
    const context: TeamValidationContext = {
      ownedCharacterIds: new Set(['columbina', 'durin']),
      ownedWeaponInstanceIds: new Set(['weapon-1']),
    };

    it('returns no issues when all characters are owned', () => {
      const issues = validateTeam(
        {
          name: 'Owned',
          members: [{ characterId: 'columbina' }, null, null, null],
        },
        context,
      );
      expect(issues).toEqual([]);
    });

    it('detects unowned characters', () => {
      const issues = validateTeam(
        {
          name: 'Unowned',
          members: [{ characterId: 'nefer' }, null, null, null],
        },
        context,
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].message).toMatch(/not in collection/i);
    });

    it('detects unowned weapon instances', () => {
      const issues = validateTeam(
        {
          name: 'Bad weapon',
          members: [
            { characterId: 'columbina', weaponInstanceId: 'weapon-999' as UUID },
            null,
            null,
            null,
          ],
        },
        context,
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((i) => i.message.match(/Weapon instance not in collection/i))).toBe(true);
    });
  });

  it('validates artifact plans on members', () => {
    const issues = validateTeam({
      name: 'Bad artifact',
      members: [
        {
          characterId: 'columbina',
          artifactPlan: { sands: 'INVALID_AFFIX' } as unknown as ArtifactPlan,
        },
        null,
        null,
        null,
      ],
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].path).toMatch(/artifactPlan/);
  });
});

describe('validateTeams', () => {
  it('returns no issues when no weapon conflicts exist', () => {
    const issues = validateTeams(1 as TeamSlot, EMPTY_MEMBERS, [
      { slot: 2 as TeamSlot, members: EMPTY_MEMBERS },
    ]);
    expect(issues).toEqual([]);
  });

  it('allows the same character with the same weapon on different teams', () => {
    const members: CollectionTeamMembers = [
      { characterId: 'columbina', weaponInstanceId: 'weapon-1' as UUID },
      null,
      null,
      null,
    ];
    const issues = validateTeams(1 as TeamSlot, members, [{ slot: 2 as TeamSlot, members }]);
    expect(issues).toEqual([]);
  });

  it('detects weapon conflicts across teams', () => {
    const current: CollectionTeamMembers = [
      { characterId: 'columbina', weaponInstanceId: 'weapon-1' as UUID },
      null,
      null,
      null,
    ];
    const otherTeam = {
      slot: 2 as TeamSlot,
      members: [
        { characterId: 'durin', weaponInstanceId: 'weapon-1' as UUID },
        null,
        null,
        null,
      ] as CollectionTeamMembers,
    };
    const issues = validateTeams(1 as TeamSlot, current, [otherTeam]);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/already equipped/i);
  });

  it('ignores the same team slot when checking other teams', () => {
    const members: CollectionTeamMembers = [
      { characterId: 'columbina', weaponInstanceId: 'weapon-1' as UUID },
      null,
      null,
      null,
    ];
    const issues = validateTeams(1 as TeamSlot, members, [{ slot: 1 as TeamSlot, members }]);
    expect(issues).toEqual([]);
  });
});
