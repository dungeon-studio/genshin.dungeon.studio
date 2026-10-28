// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { AuthErrorCodes, GoogleAuthProvider, signInWithPopup } from '@firebase/auth';

import { auth } from '@/lib/firebase';

import { toastRetryableFailure } from './auth-toast';

const googleProvider = new GoogleAuthProvider();

/** Popup endings the user caused, which need no message. */
const DISMISSALS: ReadonlySet<unknown> = new Set([
  AuthErrorCodes.POPUP_CLOSED_BY_USER,
  AuthErrorCodes.EXPIRED_POPUP_REQUEST,
  AuthErrorCodes.USER_CANCELLED,
]);

function errorCode(error: unknown): unknown {
  return typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
}

function describeFailure(code: unknown): string {
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
 * Never rejects: a failure toasts with a retry, and a dismissed popup stays
 * silent. The signed-in user arrives through `useAuth`.
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    const code = errorCode(error);
    if (DISMISSALS.has(code)) return;

    console.error('Sign-in failed:', error);
    toastRetryableFailure(describeFailure(code), signInWithGoogle);
  }
}
