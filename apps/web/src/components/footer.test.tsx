// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User as FirebaseUser } from 'firebase/auth';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AuthContext } from '@/features/auth/auth-context';

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
}));

const { Footer } = await import('./footer');

function renderFooter(
  user: FirebaseUser | null = null,
  initialRoute = '/',
): ReturnType<typeof render> {
  const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthContext value={{ user, loading: false }}>{children}</AuthContext>
    </MemoryRouter>
  );

  return render(<Footer />, { wrapper });
}

describe('Footer', () => {
  it('opens links in new tabs with proper security attributes', () => {
    renderFooter();

    const links = screen.getAllByRole('link');
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('copies debug info to the clipboard reflecting route and auth state', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderFooter({ uid: 'abc' } as FirebaseUser, '/weapons');

    await userEvent.click(screen.getByRole('button', { name: 'Copy debug info' }));

    expect(writeText).toHaveBeenCalledOnce();
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain('Route: /weapons');
    expect(copied).toContain('Authenticated: yes');

    vi.unstubAllGlobals();
  });
});
