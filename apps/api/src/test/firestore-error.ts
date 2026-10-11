// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { GrpcStatus } from 'firebase-admin/firestore';

import type { FirestoreError } from '@/repositories/firestore/error.js';

/**
 * A Firestore rejection in the shape the client library produces.
 *
 * The emulator can't be made to exhaust a quota or go unavailable on demand, so
 * the transient codes reach the unit suite through this fixture instead.
 */
export function firestoreError(code: GrpcStatus): FirestoreError {
  return Object.assign(new Error('firestore said no'), { code });
}
