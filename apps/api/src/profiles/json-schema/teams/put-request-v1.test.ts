// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { FromSchema } from 'json-schema-to-ts';
import { describe, expect, it } from 'vitest';

import type { teamPutRequestV1 } from './put-request-v1.js';
import { deserialiseTeamPutRequest } from './put-request-v1.js';

/**
 * Annotated against the schema so a rename or retype there fails this file at
 * compile time, the way it would fail a client sending the old shape.
 */
const VALID_BODY = {
  name: 'Hydro core',
  description: 'Freeze comp',
  members: [
    {
      characterId: 'columbina',
      weaponInstanceId: '3f2a1c6e-9d4b-4a7f-8e21-0b5c6d7e8f90',
      artifactPlan: {
        sands: 'ATK Percentage',
        goblet: 'Hydro DMG Bonus',
        circlet: 'CRIT Rate',
        sets: ['aubade-of-morningstar-and-moon'],
        priorityMinorAffixes: ['CRIT Rate'],
        secondaryMinorAffixes: ['ATK Percentage'],
      },
    },
    null,
    { characterId: 'durin' },
    null,
  ],
} satisfies FromSchema<typeof teamPutRequestV1.schema>;

describe('deserialiseTeamPutRequest', () => {
  it('carries the character id through to the member tuple', () => {
    const { members } = deserialiseTeamPutRequest(VALID_BODY);

    expect(members?.[0]?.characterId).toBe('columbina');
  });

  it('keeps empty positions null so member indices survive the round trip', () => {
    const { members } = deserialiseTeamPutRequest(VALID_BODY);

    expect(members).toEqual([expect.anything(), null, expect.anything(), null]);
  });

  it('carries a partially filled artifact plan through, as the schema allows', () => {
    const body = {
      members: [
        { characterId: 'columbina', artifactPlan: { sands: 'ATK Percentage' } },
        null,
        null,
        null,
      ],
    };

    const { members } = deserialiseTeamPutRequest(body);

    expect(members?.[0]?.artifactPlan).toEqual({ sands: 'ATK Percentage' });
  });

  it('omits fields the body left out rather than setting them undefined', () => {
    const result = deserialiseTeamPutRequest({ name: 'Hydro core' });

    expect(result).toEqual({ name: 'Hydro core' });
  });

  it('rejects a member array the schema would have pinned to four entries', () => {
    expect(() => deserialiseTeamPutRequest({ members: [null, null] })).toThrow(/exactly 4/);
  });

  it('rejects a body that is not an object', () => {
    expect(() => deserialiseTeamPutRequest('not-an-object')).toThrow(TypeError);
  });
});
