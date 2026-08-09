// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';

import type { DocumentReference } from 'firebase-admin/firestore';

import { db } from '@/firebase/firestore.js';

/** The per-user subcollections the repositories own. */
type UserSubcollection = 'characters' | 'teams' | 'weapons';

/**
 * A user id no other test uses.
 *
 * Isolation rests on this rather than on clearing the emulator between tests,
 * which is what lets the suites run in parallel.
 */
export const newUserId = (): string => randomUUID();

/**
 * A document at the path the repositories read and write, for planting stored
 * shapes no route can produce.
 *
 * The path is restated rather than imported from the repository under test: a
 * fixture deriving it from the code it exercises could not notice it changing.
 */
export function documentRef(
  userId: string,
  collection: UserSubcollection,
  documentId: string,
): DocumentReference {
  return db.collection('users').doc(userId).collection(collection).doc(documentId);
}
