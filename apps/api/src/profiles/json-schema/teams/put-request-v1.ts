// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JsonSchemaProfile } from '@/profiles/json-schema/json-schema-profile.js';

export const teamPutRequestV1 = {
  path: '/profiles/json-schema/teams/put-request-v1.json',
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Update Team Request',
    description: 'Request body for creating or updating a team composition',
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        description: 'Team display name',
      },
      description: {
        type: 'string',
        maxLength: 200,
        description: 'Optional team description',
      },
      members: {
        type: 'array',
        items: {
          oneOf: [{ $ref: '#/$defs/teamMember' }, { type: 'null' }],
        },
        minItems: 4,
        maxItems: 4,
        description: 'Team members (exactly 4 elements; null represents an empty position)',
      },
    },
    additionalProperties: false,
    $defs: {
      teamMember: {
        type: 'object',
        properties: {
          characterId: {
            type: 'string',
            minLength: 1,
            description: 'Character ID from game data',
          },
          weaponInstanceId: {
            type: 'string',
            minLength: 1,
            description: "Weapon instance UUID from user's collection",
          },
          artifactPlan: { $ref: '#/$defs/artifactPlan' },
        },
        required: ['characterId'],
        additionalProperties: false,
      },
      artifactPlan: {
        type: 'object',
        properties: {
          sands: {
            type: 'string',
            minLength: 1,
            description: 'Desired main stat for Sands of Eon',
          },
          goblet: {
            type: 'string',
            minLength: 1,
            description: 'Desired main stat for Goblet of Eonothem',
          },
          circlet: {
            type: 'string',
            minLength: 1,
            description: 'Desired main stat for Circlet of Logos',
          },
          primarySetId: {
            type: 'string',
            minLength: 1,
            description: 'Artifact set ID for a 4-piece bonus, or the first half of a 2+2 split',
          },
          secondarySetId: {
            type: 'string',
            minLength: 1,
            description: 'Artifact set ID for the second 2-piece of a 2+2 split',
          },
          priorityMinorAffixes: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            maxItems: 3,
            description: '0-3 priority minor affixes',
          },
          secondaryMinorAffixes: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            maxItems: 3,
            description: '0-3 secondary minor affixes (disjoint from priorityMinorAffixes)',
          },
        },
        additionalProperties: false,
      },
    },
  },
} as const satisfies JsonSchemaProfile;
