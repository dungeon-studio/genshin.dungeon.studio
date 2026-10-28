// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type * as FirebaseAuth from '@firebase/auth';
import { AuthErrorCodes, signInWithPopup } from '@firebase/auth';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signInWithGoogle } from './sign-in';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('@firebase/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof FirebaseAuth>()),
  signInWithPopup: vi.fn(),
}));

const failsWith = (code: string) => {
  vi.mocked(signInWithPopup).mockRejectedValueOnce(Object.assign(new Error(code), { code }));
};

/** Clicks the action button on the most recent error toast. */
function clickToastAction(): void {
  const action = vi.mocked(toast.error).mock.lastCall?.[1]?.action;
  if (typeof action !== 'object' || action === null || !('onClick' in action)) {
    throw new Error('The error toast carries no action');
  }
  action.onClick(new MouseEvent('click') as unknown as ReactMouseEvent<HTMLButtonElement>);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('signInWithGoogle', () => {
  it('tells the user to allow pop-ups when the browser blocks the window', async () => {
    failsWith(AuthErrorCodes.POPUP_BLOCKED);

    await signInWithGoogle();

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Allow pop-ups'),
      expect.anything(),
    );
  });

  it('tells the user to check the connection when Google is unreachable', async () => {
    failsWith(AuthErrorCodes.NETWORK_REQUEST_FAILED);

    await signInWithGoogle();

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Check your connection'),
      expect.anything(),
    );
  });

  it('still says something for a failure it has no wording for', async () => {
    vi.mocked(signInWithPopup).mockRejectedValueOnce(new Error('boom'));

    await signInWithGoogle();

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Could not sign in'),
      expect.anything(),
    );
  });

  it.each([
    AuthErrorCodes.POPUP_CLOSED_BY_USER,
    AuthErrorCodes.EXPIRED_POPUP_REQUEST,
    AuthErrorCodes.USER_CANCELLED,
  ])('stays silent when the popup ends with %s', async (code) => {
    failsWith(code);

    await signInWithGoogle();

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('retries from the failure toast', async () => {
    failsWith(AuthErrorCodes.POPUP_BLOCKED);
    await signInWithGoogle();

    clickToastAction();

    expect(signInWithPopup).toHaveBeenCalledTimes(2);
  });
});
