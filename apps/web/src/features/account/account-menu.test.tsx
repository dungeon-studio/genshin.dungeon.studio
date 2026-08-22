// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signOut } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createWrapper, fakeUser } from '@/test/render';

import { AccountMenu } from './account-menu';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('firebase/auth', () => ({ signOut: vi.fn() }));

const TRAVELER = { displayName: 'Traveler', photoURL: null };

function renderMenu() {
  return render(<AccountMenu user={TRAVELER} />, {
    wrapper: createWrapper({ user: fakeUser('user-1') }),
  });
}

const openMenu = async () => userEvent.click(screen.getByRole('button', { name: 'Traveler' }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AccountMenu', () => {
  it('names itself for whoever is signed in', () => {
    renderMenu();

    expect(screen.getByRole('button', { name: 'Traveler' })).toBeVisible();
  });

  it('ends the session', async () => {
    renderMenu();
    await openMenu();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(signOut).toHaveBeenCalled();
  });

  // Deleting sits one item below signing out, so the confirmation is the only
  // thing separating them.
  it('asks for confirmation before deleting the account', async () => {
    renderMenu();
    await openMenu();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete account' }));

    expect(screen.getByRole('dialog', { name: 'Delete your account?' })).toBeVisible();
    expect(signOut).not.toHaveBeenCalled();
  });
});
