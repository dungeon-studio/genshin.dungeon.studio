// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { characterPutRequestV1 } from '@/profiles/json-schema/characters/put-request-v1.js';
import { healthGetResponseV1 } from '@/profiles/json-schema/health/get-response-v1.js';
import type { JsonSchemaProfile } from '@/profiles/json-schema/json-schema-profile.js';
import { rootGetResponseV1 } from '@/profiles/json-schema/root/get-response-v1.js';
import { teamPutRequestV1 } from '@/profiles/json-schema/teams/put-request-v1.js';
import { weaponPatchRequestV1 } from '@/profiles/json-schema/weapons/patch-request-v1.js';
import { weaponPostRequestV1 } from '@/profiles/json-schema/weapons/post-request-v1.js';

/**
 * Every schema module the API serves.
 *
 * The one list the serving route walks, so a module missing from here is
 * unreachable however correct it is. A test discovers the modules on disk and
 * fails when one isn't listed.
 */
export const jsonSchemaRegistry: readonly JsonSchemaProfile[] = [
  rootGetResponseV1,
  healthGetResponseV1,
  characterPutRequestV1,
  teamPutRequestV1,
  weaponPostRequestV1,
  weaponPatchRequestV1,
];
