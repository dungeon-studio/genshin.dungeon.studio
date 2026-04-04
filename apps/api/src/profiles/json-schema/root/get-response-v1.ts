// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JsonSchemaProfile } from '@/profiles/json-schema/json-schema-profile.js';

export const rootGetResponseV1 = {
  path: '/profiles/json-schema/root/get-response-v1.json',
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'API Root',
    description: 'Entry point response advertising available API resources for discovery.',
    type: 'object',
    properties: {
      links: {
        type: 'object',
        description: 'Discoverable resource links keyed by resource name',
        additionalProperties: {
          type: 'object',
          properties: {
            href: {
              type: 'string',
              description: 'Absolute path to the resource',
            },
          },
          required: ['href'],
          additionalProperties: false,
        },
      },
    },
    required: ['links'],
    additionalProperties: false,
  },
} as const satisfies JsonSchemaProfile;
