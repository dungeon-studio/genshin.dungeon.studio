// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '@/app.js';
import { deleteUser, verifyToken } from '@/firebase/auth.js';
import * as Account from '@/repositories/account/index.js';
import { FAKE_TOKEN, authedRequest } from '@/test/auth-requests.js';

vi.mock('@/firebase/auth.js', () => ({
  verifyToken: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('@/repositories/account/index.js', () => ({
  erase: vi.fn(),
}));

const deleteAccount = async (): Promise<Response> =>
  app.request(authedRequest('DELETE', '/account'));

describe('DELETE /account', () => {
  beforeEach(() => {
    // Module mocks outlive `restoreAllMocks`, and one assertion here is that a
    // call never happened.
    vi.clearAllMocks();
    vi.mocked(verifyToken).mockResolvedValue(FAKE_TOKEN);
    vi.mocked(Account.erase).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 without an Authorization header', async () => {
    const res = await app.request('/account', { method: 'DELETE' });

    expect(res.status).toBe(401);
  });

  it('reports the erasure with no content to return', async () => {
    const res = await deleteAccount();

    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
  });

  // The caller names no account: whoever the token verified as is the only one
  // this can erase.
  it('erases the account the token verified as', async () => {
    await deleteAccount();

    expect(Account.erase).toHaveBeenCalledWith(FAKE_TOKEN.uid);
  });

  it('erases the identity as well as the stored data', async () => {
    await deleteAccount();

    expect(deleteUser).toHaveBeenCalledWith(FAKE_TOKEN.uid);
  });

  describe('when erasing the stored data fails', () => {
    beforeEach(() => {
      vi.mocked(Account.erase).mockRejectedValue(new Error('firestore blew up'));
    });

    it('leaves the identity intact, so the user can ask again', async () => {
      await deleteAccount();

      expect(deleteUser).not.toHaveBeenCalled();
    });

    it('answers with a problem document', async () => {
      const res = await deleteAccount();

      expect(res.status).toBe(500);
      expect(res.headers.get('content-type')).toBe('application/problem+json');
    });
  });
});
