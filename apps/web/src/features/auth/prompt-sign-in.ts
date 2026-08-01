// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { toast } from 'sonner';

import { signInWithGoogle } from './sign-in';

/** Long enough to read and act on, rather than the default glance. */
const AUTH_TOAST_DURATION_MS = 10_000;

/**
 * Tell the user why an action needs an account, and offer to start one.
 *
 * `reason` completes "Sign in to …", so it reads as the thing they were
 * reaching for: "manage your weapon collection", "import a collection".
 */
export function promptSignIn(reason: string): void {
  toast.info(`Sign in to ${reason}.`, {
    action: { label: 'Sign in', onClick: () => void signInWithGoogle() },
    duration: AUTH_TOAST_DURATION_MS,
  });
}
