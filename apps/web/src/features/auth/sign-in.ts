// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { AuthErrorCodes, GoogleAuthProvider, signInWithPopup } from '@firebase/auth';

import { auth } from '@/lib/firebase';

import { toastRetryableFailure } from './auth-toast';

const googleProvider = new GoogleAuthProvider();

/** Codes for a popup the user closed, or one a newer sign-in replaced. */
const DISMISSALS: ReadonlySet<string> = new Set([
  AuthErrorCodes.POPUP_CLOSED_BY_USER,
  AuthErrorCodes.EXPIRED_POPUP_REQUEST,
  AuthErrorCodes.USER_CANCELLED,
]);

function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
  return typeof error.code === 'string' ? error.code : undefined;
}

function describeFailure(code: string | undefined): string {
  switch (code) {
    case AuthErrorCodes.POPUP_BLOCKED:
      return 'Your browser blocked the sign-in window. Allow pop-ups for this site, then try again.';
    case AuthErrorCodes.NETWORK_REQUEST_FAILED:
      return 'Could not reach Google to sign in. Check your connection, then try again.';
    default:
      return 'Could not sign in. Try again, or report the problem if it keeps happening.';
  }
}

/**
 * Opens the Google sign-in popup and resolves once it closes.
 *
 * Resolves either way: a failure toasts with a retry rather than throwing, and
 * the user dismissing the popup stays silent. What actually signed in arrives
 * through `useAuth`.
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    const code = errorCode(error);
    if (code !== undefined && DISMISSALS.has(code)) return;

    console.error('Sign-in failed:', error);
    toastRetryableFailure(describeFailure(code), signInWithGoogle);
  }
}
