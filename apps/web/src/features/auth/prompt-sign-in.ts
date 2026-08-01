// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { toast } from 'sonner';

import { signInWithGoogle } from './sign-in';

/** The toast asks the user to act, not just to read. */
const AUTH_TOAST_DURATION_MS = 10_000;

/**
 * Invites an unauthenticated user to sign in after they attempt a collection
 * action. Collection management is authenticated-only across characters and
 * weapons, so both pages raise the same prompt from the same place.
 */
export function promptSignIn(subject: string): void {
  toast.info(`Sign in to manage your ${subject}.`, {
    action: { label: 'Sign in', onClick: () => void signInWithGoogle() },
    duration: AUTH_TOAST_DURATION_MS,
  });
}
