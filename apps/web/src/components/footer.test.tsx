// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Footer } from './footer';

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
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
});
