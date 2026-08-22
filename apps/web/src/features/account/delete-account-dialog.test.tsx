// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signOut } from 'firebase/auth';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/test/msw/server';
import { createWrapper, fakeUser } from '@/test/render';

import { DeleteAccountDialog } from './delete-account-dialog';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('firebase/auth', () => ({ signOut: vi.fn() }));

const ACCOUNT_URL = 'http://localhost:8080/account';

const erasureSucceeds = () =>
  server.use(http.delete(ACCOUNT_URL, () => new HttpResponse(null, { status: 204 })));

const erasureFails = () =>
  server.use(
    http.delete(ACCOUNT_URL, () =>
      HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Internal Server Error',
          status: 500,
          detail: 'An unexpected error occurred',
        },
        { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    ),
  );

function renderDialog() {
  return render(<DeleteAccountDialog open onOpenChange={vi.fn()} />, {
    wrapper: createWrapper({ user: fakeUser('user-1') }),
  });
}

const deleteButton = () => screen.getByRole('button', { name: 'Delete account' });

async function confirmDeletion(): Promise<void> {
  await userEvent.type(screen.getByRole('textbox'), 'delete');
  await userEvent.click(deleteButton());
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DeleteAccountDialog', () => {
  it('refuses to delete until the confirmation is typed', async () => {
    renderDialog();

    expect(deleteButton()).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox'), 'delete');

    expect(deleteButton()).toBeEnabled();
  });

  it('rejects a confirmation that is not the word asked for', async () => {
    renderDialog();

    await userEvent.type(screen.getByRole('textbox'), 'yes');

    expect(deleteButton()).toBeDisabled();
  });

  it('ends the session once the account is erased', async () => {
    erasureSucceeds();
    renderDialog();

    await confirmDeletion();

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });

  // The account survived, so the user has to stay signed in to ask again.
  it('keeps the session when the erasure fails', async () => {
    erasureFails();
    renderDialog();

    await confirmDeletion();

    await waitFor(() => {
      expect(deleteButton()).toBeEnabled();
    });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('reports why the erasure failed', async () => {
    erasureFails();
    renderDialog();

    await confirmDeletion();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('An unexpected error'));
    });
  });

  it('still says something when the request never reaches the server', async () => {
    server.use(http.delete(ACCOUNT_URL, () => HttpResponse.error()));
    renderDialog();

    await confirmDeletion();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(signOut).not.toHaveBeenCalled();
  });
});
