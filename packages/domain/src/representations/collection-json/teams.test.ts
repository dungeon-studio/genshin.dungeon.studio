// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { deserialiseTeam, serialiseTeam } from './teams.js';
import type { CollectionTeam, CollectionTeamMembers, TeamSlot } from '../../collection-team.js';
import type { ISOTimestamp } from '../../iso-timestamp.js';
import type { UUID } from '../../uuid.js';

const BASE_URL = 'http://localhost:8080';
const VALID_TIMESTAMP = '2024-01-15T12:00:00Z' as ISOTimestamp;

const VALID_MEMBERS: CollectionTeamMembers = [
  { characterId: 'columbina', weaponInstanceId: 'wep-001' as UUID },
  { characterId: 'durin' },
  null,
  null,
];

const VALID_TEAM: CollectionTeam = {
  slot: 1 as TeamSlot,
  name: 'Team 1',
  members: VALID_MEMBERS,
  createdAt: VALID_TIMESTAMP,
  updatedAt: VALID_TIMESTAMP,
};

describe('team serialisation round-trip', () => {
  it('deserialises a serialised team back to the original', () => {
    const item = serialiseTeam(VALID_TEAM, BASE_URL);
    const result = deserialiseTeam(item);
    expect(result).toEqual(VALID_TEAM);
  });

  it('serialises with the correct href', () => {
    const item = serialiseTeam(VALID_TEAM, BASE_URL);
    expect(item.href).toBe(`${BASE_URL}/api/teams/1`);
  });

  it('preserves all-null members through round-trip', () => {
    const team: CollectionTeam = {
      ...VALID_TEAM,
      members: [null, null, null, null],
    };
    const item = serialiseTeam(team, BASE_URL);
    const result = deserialiseTeam(item);
    expect(result.members).toEqual([null, null, null, null]);
  });

  it('preserves team description through round-trip', () => {
    const team: CollectionTeam = { ...VALID_TEAM, description: 'Main DPS team' };
    const item = serialiseTeam(team, BASE_URL);
    const result = deserialiseTeam(item);
    expect(result.description).toBe('Main DPS team');
  });

  it('preserves weapon instance IDs on members through round-trip', () => {
    const item = serialiseTeam(VALID_TEAM, BASE_URL);
    const result = deserialiseTeam(item);
    expect(result.members[0]?.weaponInstanceId).toBe('wep-001');
  });

  it('preserves artifact plans on members through round-trip', () => {
    const team: CollectionTeam = {
      ...VALID_TEAM,
      members: [
        {
          characterId: 'columbina',
          artifactPlan: {
            sands: 'ATK Percentage',
            goblet: 'Hydro DMG Bonus',
            circlet: 'CRIT Rate',
            sets: ['aubade-of-morningstar-and-moon'],
            priorityMinorAffixes: ['CRIT Rate', 'CRIT DMG'],
            secondaryMinorAffixes: ['ATK Percentage'],
          },
        },
        null,
        null,
        null,
      ],
    };
    const item = serialiseTeam(team, BASE_URL);
    const result = deserialiseTeam(item);
    expect(result.members[0]?.artifactPlan).toEqual(team.members[0]?.artifactPlan);
  });
});
