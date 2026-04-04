// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { characterPutRequestV1 } from '@/profiles/json-schema/characters/put-request-v1.js';
import type { JsonSchemaProfile } from '@/profiles/json-schema/json-schema-profile.js';
import { profileGetResponseV1 } from '@/profiles/json-schema/profile/get-response-v1.js';
import { profilePatchRequestV1 } from '@/profiles/json-schema/profile/patch-request-v1.js';
import { rootGetResponseV1 } from '@/profiles/json-schema/root/get-response-v1.js';
import { teamPutRequestV1 } from '@/profiles/json-schema/teams/put-request-v1.js';
import { weaponPatchRequestV1 } from '@/profiles/json-schema/weapons/patch-request-v1.js';
import { weaponPostRequestV1 } from '@/profiles/json-schema/weapons/post-request-v1.js';

export const jsonSchemaRegistry: readonly JsonSchemaProfile[] = [
  rootGetResponseV1,
  profileGetResponseV1,
  profilePatchRequestV1,
  characterPutRequestV1,
  teamPutRequestV1,
  weaponPostRequestV1,
  weaponPatchRequestV1,
];
