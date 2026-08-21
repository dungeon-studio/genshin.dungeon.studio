// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { type DecodedIdToken, getAuth } from 'firebase-admin/auth';

import { app } from '@/firebase/app.js';

const auth = getAuth(app);

export async function verifyToken(idToken: string): Promise<DecodedIdToken> {
  const checkRevoked = true;
  return auth.verifyIdToken(idToken, checkRevoked);
}

/**
 * Delete the identity itself, not just what it owns. The record holds the
 * email, display name, and picture the provider supplied, so erasing a user's
 * stored data without this leaves personal data behind.
 */
export async function deleteUser(uid: string): Promise<void> {
  await auth.deleteUser(uid);
}

export type { DecodedIdToken };
