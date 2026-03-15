/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { ISOTimestamp } from './isoTimestamp.js';

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
