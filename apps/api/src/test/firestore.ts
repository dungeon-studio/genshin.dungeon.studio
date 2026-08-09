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
 * Every integration test owns one, so no test observes another's documents and
 * the emulator never needs clearing between them.
 */
export const newUserId = (): string => randomUUID();

/**
 * A document at the path the repositories read and write.
 *
 * Spelled out here rather than imported from the repository under test: a test
 * that derived the path from the code it exercises could not notice the path
 * changing. Tests reach for this to plant documents the API itself would never
 * write — a stored shape predating `schemaVersion`, or an id no route would
 * accept — since those are the cases nothing else can set up.
 */
export function documentRef(
  userId: string,
  collection: UserSubcollection,
  documentId: string,
): DocumentReference {
  return db.collection('users').doc(userId).collection(collection).doc(documentId);
}
