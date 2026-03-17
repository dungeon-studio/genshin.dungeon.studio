// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { characterPutRequestV1 } from '@/schemas/characters/put-request-v1.js';
import type { JsonSchemaProfile } from '@/schemas/json-schema-profile.js';
import { profileGetResponseV1 } from '@/schemas/profile/get-response-v1.js';
import { profilePatchRequestV1 } from '@/schemas/profile/patch-request-v1.js';
import { rootGetResponseV1 } from '@/schemas/root/get-response-v1.js';
import { teamPutRequestV1 } from '@/schemas/teams/put-request-v1.js';
import { weaponPatchRequestV1 } from '@/schemas/weapons/patch-request-v1.js';
import { weaponPostRequestV1 } from '@/schemas/weapons/post-request-v1.js';

export const schemaRegistry: readonly JsonSchemaProfile[] = [
  rootGetResponseV1,
  profileGetResponseV1,
  profilePatchRequestV1,
  characterPutRequestV1,
  teamPutRequestV1,
  weaponPostRequestV1,
  weaponPatchRequestV1,
];
