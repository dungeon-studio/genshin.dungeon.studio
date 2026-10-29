// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { toast } from 'sonner';

import { AUTH_TOAST_DURATION_MS } from './auth-toast';
import { signInWithGoogle } from './sign-in';

/** `subject` completes "Sign in to manage your ___." */
export function promptSignIn(subject: string): void {
  toast.info(`Sign in to manage your ${subject}.`, {
    action: { label: 'Sign in', onClick: () => void signInWithGoogle() },
    duration: AUTH_TOAST_DURATION_MS,
  });
}
