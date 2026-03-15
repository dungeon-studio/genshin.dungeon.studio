// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JsonSchemaProfile } from '@/schemas/json-schema-profile.js';

export const profilePatchRequestV1 = {
  path: '/schemas/profile/patch-request-v1.json',
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Patch Profile',
    description:
      'Partial update to a user profile. Only mutable fields are accepted; auth-managed fields are rejected.',
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
      },
    },
    additionalProperties: false,
    minProperties: 1,
  },
} as const satisfies JsonSchemaProfile;
