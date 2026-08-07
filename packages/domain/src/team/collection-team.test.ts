// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import type { ISOTimestamp } from '../iso-timestamp.js';
import { isISOTimestamp } from '../iso-timestamp.js';
import type { CollectionTeamMembers, TeamSlot } from './collection-team.js';
import {
  assertCollectionTeam,
  createEmptyTeam,
  isValidMemberIndex,
  isValidTeamSlot,
  MAX_TEAM_MEMBERS,
  TEAM_SLOTS,
} from './collection-team.js';

const VALID_TIMESTAMP = '2024-01-15T12:00:00Z' as ISOTimestamp;

const VALID_MEMBERS: CollectionTeamMembers = [
  { characterId: 'columbina' },
  { characterId: 'durin' },
  null,
  null,
];

const VALID_TEAM = {
  slot: 1 as TeamSlot,
  name: 'Team 1',
  members: VALID_MEMBERS,
  createdAt: VALID_TIMESTAMP,
  updatedAt: VALID_TIMESTAMP,
};

const VALID_PLAN = {
  sands: 'ATK Percentage',
  goblet: 'Hydro DMG Bonus',
  circlet: 'CRIT Rate',
  sets: ['aubade-of-morningstar-and-moon'],
  priorityMinorAffixes: ['CRIT Rate', 'CRIT DMG'],
  secondaryMinorAffixes: ['ATK Percentage'],
};

/** A valid team carrying `member` at `index`, the rest of the slots empty. */
function teamWithMember(member: unknown, index = 0): Record<string, unknown> {
  const members = [null, null, null, null];
  members[index] = member as null;
  return { ...VALID_TEAM, members };
}

describe('TEAM_SLOTS', () => {
  it('contains all slots from MIN to MAX', () => {
    expect(TEAM_SLOTS).toEqual([1, 2, 3, 4]);
  });
});

describe('isValidTeamSlot', () => {
  it.each([1, 2, 3, 4])('accepts %i', (slot) => {
    expect(isValidTeamSlot(slot)).toBe(true);
  });

  it('rejects 0 (below minimum)', () => {
    expect(isValidTeamSlot(0)).toBe(false);
  });

  it('rejects 5 (above maximum)', () => {
    expect(isValidTeamSlot(5)).toBe(false);
  });

  it('rejects a float', () => {
    expect(isValidTeamSlot(1.5)).toBe(false);
  });

  it('rejects a string', () => {
    expect(isValidTeamSlot('1')).toBe(false);
  });
});

describe('isValidMemberIndex', () => {
  it.each([0, 1, 2, 3])('accepts %i', (index) => {
    expect(isValidMemberIndex(index)).toBe(true);
  });

  it('rejects -1 (below range)', () => {
    expect(isValidMemberIndex(-1)).toBe(false);
  });

  it('rejects MAX_TEAM_MEMBERS (at boundary)', () => {
    expect(isValidMemberIndex(MAX_TEAM_MEMBERS)).toBe(false);
  });

  it('rejects a float', () => {
    expect(isValidMemberIndex(0.5)).toBe(false);
  });
});

describe('createEmptyTeam', () => {
  it('creates a team with the given slot', () => {
    const team = createEmptyTeam(2);
    expect(team.slot).toBe(2);
  });

  it('names the team after the slot', () => {
    const team = createEmptyTeam(3);
    expect(team.name).toBe('Team 3');
  });

  it('has 4 null members', () => {
    const team = createEmptyTeam(1);
    expect(team.members).toEqual([null, null, null, null]);
  });

  it('has valid ISO timestamps', () => {
    const team = createEmptyTeam(1);
    expect(isISOTimestamp(team.createdAt)).toBe(true);
    expect(isISOTimestamp(team.updatedAt)).toBe(true);
  });
});

describe('assertCollectionTeam', () => {
  it('accepts valid data', () => {
    expect(() => assertCollectionTeam({ ...VALID_TEAM })).not.toThrow();
  });

  it('accepts a team with all null members', () => {
    expect(() =>
      assertCollectionTeam({
        ...VALID_TEAM,
        members: [null, null, null, null],
      }),
    ).not.toThrow();
  });

  it('throws for null', () => {
    expect(() => assertCollectionTeam(null)).toThrow(TypeError);
  });

  it('throws for a non-object', () => {
    expect(() => assertCollectionTeam('string')).toThrow(TypeError);
  });

  it('throws for invalid slot', () => {
    expect(() => assertCollectionTeam({ ...VALID_TEAM, slot: 0 })).toThrow(/slot/);
  });

  it('throws for non-string name', () => {
    expect(() => assertCollectionTeam({ ...VALID_TEAM, name: 123 })).toThrow(/name/);
  });

  it('throws for non-array members', () => {
    expect(() => assertCollectionTeam({ ...VALID_TEAM, members: 'not-array' })).toThrow(/members/);
  });

  it('throws for wrong member count (too few)', () => {
    expect(() => assertCollectionTeam({ ...VALID_TEAM, members: [null, null] })).toThrow(
      /exactly 4/,
    );
  });

  it('throws for wrong member count (too many)', () => {
    expect(() =>
      assertCollectionTeam({ ...VALID_TEAM, members: [null, null, null, null, null] }),
    ).toThrow(/exactly 4/);
  });

  it('throws for member without characterId', () => {
    expect(() => assertCollectionTeam(teamWithMember({ notCharacterId: 'x' }))).toThrow(
      /members\[0\]\.characterId must be a string/,
    );
  });

  it('accepts a member with a weapon instance and a full artifact plan', () => {
    expect(() =>
      assertCollectionTeam({
        ...teamWithMember({
          characterId: 'columbina',
          weaponInstanceId: '3f2a1c6e-9d4b-4a7f-8e21-0b5c6d7e8f90',
          artifactPlan: VALID_PLAN,
        }),
        description: 'Hydro core',
      }),
    ).not.toThrow();
  });

  it('accepts a member with a partially filled artifact plan', () => {
    expect(() =>
      assertCollectionTeam(
        teamWithMember({ characterId: 'columbina', artifactPlan: { sands: 'ATK Percentage' } }),
      ),
    ).not.toThrow();
  });

  it('throws for non-string description', () => {
    expect(() => assertCollectionTeam({ ...VALID_TEAM, description: 123 })).toThrow(/description/);
  });

  it('throws for a non-object member', () => {
    expect(() => assertCollectionTeam(teamWithMember('not-an-object'))).toThrow(
      /members\[0\] must be a non-null object/,
    );
  });

  it('throws for non-string weaponInstanceId', () => {
    expect(() =>
      assertCollectionTeam(teamWithMember({ characterId: 'columbina', weaponInstanceId: 42 })),
    ).toThrow(/members\[0\]\.weaponInstanceId/);
  });

  it('throws for a non-object artifact plan', () => {
    expect(() =>
      assertCollectionTeam(
        teamWithMember({ characterId: 'columbina', artifactPlan: 'not-an-object' }),
      ),
    ).toThrow(/members\[0\]\.artifactPlan must be a non-null object/);
  });

  it('throws for a non-string main affix in an artifact plan', () => {
    expect(() =>
      assertCollectionTeam(
        teamWithMember({ characterId: 'columbina', artifactPlan: { sands: 42 } }),
      ),
    ).toThrow(/members\[0\]\.artifactPlan\.sands must be a string/);
  });

  it('throws for a malformed artifact plan on a later member', () => {
    expect(() =>
      assertCollectionTeam(
        teamWithMember({ characterId: 'durin', artifactPlan: { sets: 'not-an-array' } }, 2),
      ),
    ).toThrow(/members\[2\]\.artifactPlan\.sets must be an array/);
  });

  it('throws for invalid createdAt', () => {
    expect(() => assertCollectionTeam({ ...VALID_TEAM, createdAt: 'bad-date' })).toThrow(
      /createdAt/,
    );
  });

  it('throws for invalid updatedAt', () => {
    expect(() => assertCollectionTeam({ ...VALID_TEAM, updatedAt: 'bad-date' })).toThrow(
      /updatedAt/,
    );
  });
});
