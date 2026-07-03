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
  it('opens external links in new tabs with proper security attributes', () => {
    renderFooter();

    const externalLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('http'));

    expect(externalLinks.length).toBeGreaterThan(0);
    for (const link of externalLinks) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('links to the legal pages as in-app navigation', () => {
    renderFooter();

    for (const [name, path] of [
      [/privacy policy/i, '/privacy'],
      [/terms of service/i, '/terms'],
    ] as const) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('href', path);
      expect(link).not.toHaveAttribute('target');
    }
  });

  it('pre-fills the bug report link with page and auth state', () => {
    renderFooter({ uid: 'signed-in-user' } as FirebaseUser, '/weapons');

    const href = screen.getByRole('link', { name: 'Report an issue' }).getAttribute('href') ?? '';
    const params = new URL(href).searchParams;

    expect(params.get('template')).toBe('bug-report.yml');
    expect(params.get('url')).toContain('/weapons');
    expect(params.get('environment')).toContain('Authenticated: yes');
  });

  it('never leaks the signed-in user identity into the link', () => {
    renderFooter({ uid: 'secret-uid-xyz', email: 'reporter@example.com' } as FirebaseUser, '/');

    const href = screen.getByRole('link', { name: 'Report an issue' }).getAttribute('href') ?? '';

    expect(href).not.toContain('secret-uid-xyz');
    expect(href).not.toContain('reporter@example.com');
  });
});
