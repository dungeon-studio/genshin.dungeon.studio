// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { signOut as endFirebaseSession } from '@firebase/auth';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signOut } from './sign-out';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('@firebase/auth', () => ({ signOut: vi.fn() }));

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

describe('signOut', () => {
  it('tells the user they are still signed in when it fails', async () => {
    vi.mocked(endFirebaseSession).mockRejectedValueOnce(new Error('storage unavailable'));

    await signOut();

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('still signed in'),
      expect.anything(),
    );
  });

  it('retries from the failure toast', async () => {
    vi.mocked(endFirebaseSession).mockRejectedValueOnce(new Error('storage unavailable'));
    await signOut();

    clickToastAction();

    expect(endFirebaseSession).toHaveBeenCalledTimes(2);
  });
});
