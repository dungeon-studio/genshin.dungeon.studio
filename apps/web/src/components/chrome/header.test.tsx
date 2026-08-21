// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User as FirebaseUser } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '@/features/auth/auth-context';
import { createTestQueryClient } from '@/test/render';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
// Reads `window.matchMedia`, which jsdom doesn't implement, and the account
// menu is what this file is about.
vi.mock('@/components/chrome/theme-toggle', () => ({ ThemeToggle: () => null }));
vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
  signInWithPopup: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: class {},
}));

const { Header } = await import('./header');

const TRAVELER = { uid: 'user-1', displayName: 'Traveler', photoURL: null } as FirebaseUser;

function renderHeader(user: FirebaseUser | null) {
  const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
    <MemoryRouter>
      <QueryClientProvider client={createTestQueryClient()}>
        <AuthContext value={{ user, loading: false }}>{children}</AuthContext>
      </QueryClientProvider>
    </MemoryRouter>
  );

  return render(<Header />, { wrapper });
}

const openAccountMenu = async () =>
  userEvent.click(screen.getByRole('button', { name: 'Traveler' }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Header', () => {
  it('offers sign-in to a visitor with no session', () => {
    renderHeader(null);

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  it('names the account menu for whoever is signed in', () => {
    renderHeader(TRAVELER);

    expect(screen.getByRole('button', { name: 'Traveler' })).toBeVisible();
  });

  it('ends the session from the menu', async () => {
    renderHeader(TRAVELER);
    await openAccountMenu();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(signOut).toHaveBeenCalled();
  });

  // Deleting is one item below signing out, so the confirmation standing
  // between the two is the whole safety story.
  it('asks for confirmation before deleting the account', async () => {
    renderHeader(TRAVELER);
    await openAccountMenu();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete account' }));

    expect(screen.getByRole('dialog', { name: 'Delete your account?' })).toBeVisible();
    expect(signOut).not.toHaveBeenCalled();
  });
});
