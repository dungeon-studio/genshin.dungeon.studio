// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { signOut as endFirebaseSession } from '@firebase/auth';
import { toast } from 'sonner';

import { auth } from '@/lib/firebase';

import { AUTH_TOAST_DURATION_MS } from './auth-toast';

/**
 * Ends the Firebase session.
 *
 * Resolves either way: a failure toasts with a retry rather than throwing, so
 * the caller can't tell success from failure here. The signed-out state
 * arrives through `useAuth`.
 */
export async function signOut(): Promise<void> {
  try {
    await endFirebaseSession(auth);
  } catch (error) {
    console.error('Sign-out failed:', error);
    toast.error('Could not sign you out. You are still signed in; try again.', {
      action: { label: 'Try again', onClick: () => void signOut() },
      duration: AUTH_TOAST_DURATION_MS,
    });
  }
}
