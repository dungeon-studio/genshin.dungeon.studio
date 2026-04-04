// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JsonSchemaProfile } from '@/schemas/json-schema-profile.js';

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
        items: { $ref: '#/$defs/teamMember' },
        maxItems: 4,
        description: 'Team members (0-4; partial teams are valid)',
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
          sets: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            minItems: 1,
            maxItems: 2,
            description: '1-2 artifact set IDs from game data',
          },
          primaryStats: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            maxItems: 3,
            description: '0-3 desired primary stats',
          },
          secondaryStats: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            maxItems: 3,
            description: '0-3 desired secondary stats (disjoint from primaryStats)',
          },
        },
        required: ['sands', 'goblet', 'circlet', 'sets', 'primaryStats', 'secondaryStats'],
        additionalProperties: false,
      },
    },
  },
} as const satisfies JsonSchemaProfile;
