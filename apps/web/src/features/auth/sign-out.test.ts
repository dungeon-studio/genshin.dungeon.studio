// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { signOut as endFirebaseSession } from '@firebase/auth';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clickErrorToastAction } from '@/test/toast';

import { signOut } from './sign-out';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('@firebase/auth', () => ({ signOut: vi.fn() }));

const fails = () => {
  vi.mocked(endFirebaseSession).mockRejectedValueOnce(new Error('storage unavailable'));
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('signOut', () => {
  it('tells the user they are still signed in when it fails', async () => {
    fails();

    await signOut();

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('still signed in'),
      expect.anything(),
    );
  });

  it('retries from the failure toast', async () => {
    fails();
    await signOut();

    clickErrorToastAction();

    expect(endFirebaseSession).toHaveBeenCalledTimes(2);
  });
});
