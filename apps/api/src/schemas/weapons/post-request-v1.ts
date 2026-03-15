// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JsonSchemaProfile } from '@/schemas/json-schema-profile.js';

export const weaponPostRequestV1 = {
  path: '/schemas/weapons/post-request-v1.json',
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Create Weapon Instance Request',
    description: "Request body for creating a new weapon instance in the user's collection",
    type: 'object',
    properties: {
      weaponId: {
        type: 'string',
        minLength: 1,
        description: 'Identifier of the weapon from game data',
      },
      refinementLevel: {
        type: 'integer',
        minimum: 1,
        maximum: 5,
        description: 'Refinement rank of the weapon instance',
      },
    },
    required: ['weaponId', 'refinementLevel'],
    additionalProperties: false,
  },
} as const satisfies JsonSchemaProfile;
