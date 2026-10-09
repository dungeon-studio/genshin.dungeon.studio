// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ArtifactSet } from '@genshin/game-data';
import {
  ARTIFACT_MINOR_AFFIXES,
  ARTIFACT_SETS,
  CIRCLET_MAIN_AFFIXES,
  GOBLET_MAIN_AFFIXES,
  SANDS_MAIN_AFFIXES,
} from '@genshin/game-data';

import type { JsonSchemaProfile } from '@/profiles/json-schema/json-schema-profile.js';

const ARTIFACT_SET_IDS = Object.keys(ARTIFACT_SETS) as ArtifactSet['id'][];

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
            enum: SANDS_MAIN_AFFIXES,
            description: 'Desired main stat for Sands of Eon',
          },
          goblet: {
            enum: GOBLET_MAIN_AFFIXES,
            description: 'Desired main stat for Goblet of Eonothem',
          },
          circlet: {
            enum: CIRCLET_MAIN_AFFIXES,
            description: 'Desired main stat for Circlet of Logos',
          },
          sets: {
            type: 'array',
            items: { enum: ARTIFACT_SET_IDS },
            minItems: 1,
            maxItems: 2,
            description: '1-2 artifact set IDs from game data',
          },
          priorityMinorAffixes: {
            type: 'array',
            items: { enum: ARTIFACT_MINOR_AFFIXES },
            maxItems: 3,
            uniqueItems: true,
            description: '0-3 priority minor affixes',
          },
          secondaryMinorAffixes: {
            type: 'array',
            items: { enum: ARTIFACT_MINOR_AFFIXES },
            maxItems: 3,
            uniqueItems: true,
            description: '0-3 secondary minor affixes (disjoint from priorityMinorAffixes)',
          },
        },
        additionalProperties: false,
      },
    },
  },
} as const satisfies JsonSchemaProfile;
