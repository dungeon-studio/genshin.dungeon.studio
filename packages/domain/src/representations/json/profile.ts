// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Profile domain ↔ JSON wire format.
 *
 * The profile response is a composite of auth-owned (read-only) and
 * profile-owned (mutable) fields. This module defines the wire format
 * type and bidirectional converters shared by API and web.
 */

import type { AuthIdentity } from '../../auth-identity.js';
import type { ISOTimestamp } from '../../iso-timestamp.js';
import type { UserProfile } from '../../user-profile.js';
import {
  CURRENT_VERSION,
  entity,
  type V0ProfileResponse,
  type V1ProfileResponse,
} from './schemas/index.js';

export type { AuthIdentity } from '../../auth-identity.js';
export { CURRENT_VERSION, type V0ProfileResponse, type V1ProfileResponse };

/** Wire format for the composite profile response — the current version. */
export type ProfileResponse = V1ProfileResponse;

/**
 * Serialise auth identity + profile domain object into the wire format.
 *
 * Stamps the current schemaVersion so a stale payload deserialised after
 * a future format change is detected and migrated rather than silently
 * misread.
 */
export function serialiseProfile(auth: AuthIdentity, profile: UserProfile): ProfileResponse {
  return {
    schemaVersion: CURRENT_VERSION,
    uid: auth.uid,
    email: auth.email ?? null,
    emailVerified: auth.emailVerified ?? false,
    picture: auth.picture ?? null,
    ...profile,
  };
}

/**
 * Deserialise a profile wire format response back into its constituent parts.
 *
 * Accepts any previously emitted schema version — payloads without a
 * schemaVersion are treated as V0 and migrated up — then returns the auth
 * identity fields and the UserProfile domain object separately, matching
 * the ownership boundary.
 */
export function deserialiseProfile(response: V0ProfileResponse | V1ProfileResponse): {
  auth: AuthIdentity;
  profile: UserProfile;
} {
  const result = entity.safeParse(response);
  if (result.type !== 'ok') {
    throw new TypeError(`Invalid profile response: ${result.error.type}`);
  }
  const data = result.value;
  return {
    auth: {
      uid: data.uid,
      email: data.email ?? undefined,
      emailVerified: data.emailVerified,
      picture: data.picture ?? undefined,
    },
    profile: {
      name: data.name,
      createdAt: data.createdAt as ISOTimestamp,
      updatedAt: data.updatedAt as ISOTimestamp,
    },
  };
}
