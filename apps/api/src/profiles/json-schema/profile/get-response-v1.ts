// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JsonSchemaProfile } from '@/profiles/json-schema/json-schema-profile.js';

export const profileGetResponseV1 = {
  path: '/profiles/json-schema/profile/get-response-v1.json',
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Profile',
    description:
      'Composite user profile combining auth identity fields (read-only, from DecodedIdToken) with Firestore profile fields (mutable via PATCH).',
    type: 'object',
    properties: {
      schemaVersion: {
        const: 1,
        description: 'Serialisation format version, stamped for migration on deserialisation',
      },
      uid: {
        type: 'string',
        description: 'Firebase Auth user identifier (read-only)',
      },
      email: {
        type: ['string', 'null'],
        description: 'Email address from the identity provider (read-only)',
      },
      emailVerified: {
        type: 'boolean',
        description: 'Whether the email has been verified (read-only)',
      },
      picture: {
        type: ['string', 'null'],
        description: 'Profile picture URL from the identity provider (read-only)',
      },
      name: {
        type: 'string',
        description: 'Display name (mutable via PATCH)',
      },
      createdAt: {
        type: 'string',
        description: 'ISO 8601 UTC timestamp when the profile was created (system-managed)',
      },
      updatedAt: {
        type: 'string',
        description: 'ISO 8601 UTC timestamp when the profile was last modified (system-managed)',
      },
    },
    required: ['schemaVersion', 'uid', 'email', 'emailVerified', 'name', 'createdAt', 'updatedAt'],
    additionalProperties: false,
  },
} as const satisfies JsonSchemaProfile;
