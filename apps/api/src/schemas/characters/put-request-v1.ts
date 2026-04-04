// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JsonSchemaProfile } from '@/schemas/json-schema-profile.js';

export const characterPutRequestV1 = {
  path: '/profiles/json-schema/characters/put-request-v1.json',
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Save Character Request',
    description: "Request body for creating or updating a character in the user's collection",
    type: 'object',
    properties: {
      constellationLevel: {
        type: 'integer',
        minimum: 0,
        maximum: 6,
        description: 'Constellation activation level',
      },
    },
    required: ['constellationLevel'],
    additionalProperties: false,
  },
} as const satisfies JsonSchemaProfile;
