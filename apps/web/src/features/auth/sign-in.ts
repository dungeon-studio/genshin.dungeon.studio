// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { auth } from '@/lib/firebase';

const googleProvider = new GoogleAuthProvider();

/**
 * Opens the Google sign-in popup and resolves once it closes.
 *
 * Resolves either way: a failure, including the user simply dismissing the
 * popup, is logged rather than thrown, so the caller can't tell success from
 * failure here. What actually signed in arrives through `useAuth`.
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error('Sign-in failed:', error);
  }
}
