// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BrandMark } from './brand-mark';

afterEach(() => {
  vi.unstubAllEnvs();
});

// Light and dark marks both render here; the stylesheet that hides one of them
// is not loaded under jsdom.
function marks(): HTMLImageElement[] {
  return Array.from(document.querySelectorAll('img'));
}

describe('BrandMark', () => {
  it.each([
    { appEnv: 'dev', suffix: '-alpha' },
    { appEnv: 'staging', suffix: '-beta' },
  ])('wears the $appEnv badge', ({ appEnv, suffix }) => {
    vi.stubEnv('VITE_APP_ENV', appEnv);

    render(<BrandMark />);

    expect(marks().map((mark) => mark.getAttribute('src'))).toEqual([
      `/favicon-32x32${suffix}.png`,
      `/favicon-32x32-dark${suffix}.png`,
    ]);
  });

  it('names the environment rather than repeating the app', () => {
    vi.stubEnv('VITE_APP_ENV', 'dev');

    render(<BrandMark />);

    expect(screen.getAllByRole('img', { name: 'alpha environment' })).toHaveLength(marks().length);
  });

  it('stays decorative in production, where the wordmark says it all', () => {
    vi.stubEnv('VITE_APP_ENV', 'prod');

    render(<BrandMark />);

    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(marks().map((mark) => mark.getAttribute('src'))).toEqual([
      '/favicon-32x32.png',
      '/favicon-32x32-dark.png',
    ]);
  });
});
