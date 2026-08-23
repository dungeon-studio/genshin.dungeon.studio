// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { signOut as endFirebaseSession } from 'firebase/auth';

import { auth } from '@/lib/firebase';

/**
 * Ends the Firebase session.
 *
 * Resolves either way: a failure is logged rather than thrown, so the caller
 * can't tell success from failure here. The signed-out state arrives through
 * `useAuth`.
 */
export async function signOut(): Promise<void> {
  try {
    await endFirebaseSession(auth);
  } catch (error) {
    console.error('Sign-out failed:', error);
  }
}
