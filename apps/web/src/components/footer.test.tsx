// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
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

  it('pre-fills the bug report link with page and environment details', () => {
    renderFooter({ uid: 'abc' } as FirebaseUser, '/weapons');

    const href = screen.getByRole('link', { name: 'Report an issue' }).getAttribute('href') ?? '';
    const params = new URL(href).searchParams;

    expect(params.get('template')).toBe('bug-report.yml');
    expect(params.get('url')).toContain('/weapons');
    expect(params.get('environment')).toContain('Authenticated: yes');
  });
});
