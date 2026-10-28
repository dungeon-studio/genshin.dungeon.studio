// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { toast } from 'sonner';

/** Longer than the default, since an auth toast carries an action. */
export const AUTH_TOAST_DURATION_MS = 10_000;

export function toastRetryableFailure(message: string, retry: () => Promise<void>): void {
  toast.error(message, {
    action: { label: 'Try again', onClick: () => void retry() },
    duration: AUTH_TOAST_DURATION_MS,
  });
}
