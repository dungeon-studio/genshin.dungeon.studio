// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JsonSchemaProfile } from '@/profiles/json-schema/json-schema-profile.js';

export const healthGetResponseV1 = {
  path: '/profiles/json-schema/health/get-response-v1.json',
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Health',
    description: 'Liveness signal and build identity of the running API instance.',
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description: 'Liveness state of the instance',
      },
      version: {
        type: 'string',
        description: 'Version of the API serving the response',
      },
      sha: {
        type: ['string', 'null'],
        description: 'Git commit the instance was built from; null when unavailable',
      },
    },
    required: ['status', 'version', 'sha'],
    additionalProperties: false,
  },
} as const satisfies JsonSchemaProfile;
