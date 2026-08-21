// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { db } from '@/firebase/firestore.js';

/**
 * Erase every document the service stores for a user.
 *
 * Everything written on a user's behalf lives under `users/{userId}`, which is
 * what lets one recursive delete stay complete as features arrive: a
 * subcollection added after this was written is still covered. Data that
 * cannot live under that document — held in another service, or readable by
 * other users — is out of this subtree's reach and has to be erased here
 * explicitly.
 *
 * Neither atomic nor transactional. A failure part-way leaves some documents
 * deleted, so callers retry rather than compensate; erasing twice is
 * indistinguishable from erasing once.
 */
export async function erase(userId: string): Promise<void> {
  await db.recursiveDelete(db.collection('users').doc(userId));
}
