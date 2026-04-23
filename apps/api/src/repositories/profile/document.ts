// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ISOTimestamp, UserProfile } from '@genshin/domain';
import { assertUserProfile } from '@genshin/domain';

import { entity, CURRENT_VERSION, type V1Profile, type V0Profile } from './schemas/index.js';

export { CURRENT_VERSION, type V1Profile, type V0Profile };

export function fromDocument(raw: Record<string, unknown>): UserProfile {
  const result = entity.safeParse(raw);
  if (result.type !== 'ok') {
    throw new TypeError(`Invalid profile document: ${result.error.type}`);
  }
  const data = result.value;
  const profile = {
    name: data.name,
    createdAt: data.createdAt as ISOTimestamp,
    updatedAt: data.updatedAt as ISOTimestamp,
  };
  assertUserProfile(profile);
  return profile;
}

export function toDocument(profile: UserProfile): V1Profile {
  return {
    schemaVersion: CURRENT_VERSION,
    name: profile.name,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
