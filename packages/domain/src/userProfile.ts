/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { ISOTimestamp } from './isoTimestamp.js';
import { isISOTimestamp } from './isoTimestamp.js';

/**
 * User-controlled fields stored in Firestore.
 *
 * These fields are the only profile data the API owns and writes.
 * `createdAt` and `updatedAt` are system-managed and not user-mutable.
 */
export interface UserProfile {
  name: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

/** The shape accepted by PATCH /api/profile. */
export type ProfileUpdate = Partial<Pick<UserProfile, 'name'>>;

export function assertUserProfile(value: unknown): asserts value is UserProfile {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`UserProfile must be a non-null object, got: ${JSON.stringify(value)}`);
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.name !== 'string') {
    throw new TypeError(`UserProfile.name must be a string, got: ${JSON.stringify(obj.name)}`);
  }
  if (!isISOTimestamp(obj.createdAt)) {
    throw new TypeError(
      `UserProfile.createdAt must be an ISO 8601 timestamp, got: ${JSON.stringify(obj.createdAt)}`,
    );
  }
  if (!isISOTimestamp(obj.updatedAt)) {
    throw new TypeError(
      `UserProfile.updatedAt must be an ISO 8601 timestamp, got: ${JSON.stringify(obj.updatedAt)}`,
    );
  }
}
