// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AuthContext } from '@/features/auth/auth-context';

// ThemeToggle reads `window.matchMedia`, which jsdom doesn't implement.
vi.mock('@/components/chrome/theme-toggle', () => ({ ThemeToggle: () => null }));
vi.mock('@/features/account', () => ({ AccountMenu: () => <div>account menu</div> }));

const { Header } = await import('./header');

const TRAVELER = { uid: 'user-1', displayName: 'Traveler', photoURL: null } as FirebaseUser;

function renderHeader(user: FirebaseUser | null) {
  const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
    <MemoryRouter>
      <AuthContext value={{ user, loading: false }}>{children}</AuthContext>
    </MemoryRouter>
  );

  return render(<Header />, { wrapper });
}

describe('Header', () => {
  it('offers sign-in to a visitor with no session', () => {
    renderHeader(null);

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  it('offers the account menu to a signed-in user', () => {
    renderHeader(TRAVELER);

    expect(screen.getByText('account menu')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
  });
});
