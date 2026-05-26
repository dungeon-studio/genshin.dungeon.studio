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

export type { AuthIdentity } from '../../auth-identity.js';

/**
 * Wire format for the composite profile response.
 *
 * Matches the shape returned by GET /api/profile and the JSON Schema
 * in schemas/profile/get-response-v1.
 */
export interface ProfileResponse {
  // Auth-owned — read-only, sourced from the identity provider
  uid: string;
  email: string | null;
  emailVerified: boolean;
  picture?: string | null;
  // Profile-owned — mutable via PATCH, sourced from Firestore
  name: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

/**
 * Serialise auth identity + profile domain object into the wire format.
 */
export function serialiseProfile(auth: AuthIdentity, profile: UserProfile): ProfileResponse {
  return {
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
 * Returns the auth identity fields and the UserProfile domain object
 * separately, matching the ownership boundary.
 */
export function deserialiseProfile(response: ProfileResponse): {
  auth: AuthIdentity;
  profile: UserProfile;
} {
  return {
    auth: {
      uid: response.uid,
      email: response.email ?? undefined,
      emailVerified: response.emailVerified,
      picture: response.picture ?? undefined,
    },
    profile: {
      name: response.name,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    },
  };
}
