// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from './theme-provider';
import { ThemeToggle } from './theme-toggle';

// jsdom has no media query engine, so the OS preference has to be supplied.
function stubPrefersDark(prefersDark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: prefersDark,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

function isDark() {
  return document.documentElement.classList.contains('dark');
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('follows the OS preference until the user picks a theme', () => {
    stubPrefersDark(true);
    renderToggle();

    expect(screen.getByRole('button', { name: 'System theme' })).toBeInTheDocument();
    expect(isDark()).toBe(true);
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('overrides a dark OS preference once light is chosen', async () => {
    stubPrefersDark(true);
    renderToggle();

    await userEvent.click(screen.getByRole('button', { name: 'System theme' }));

    expect(screen.getByRole('button', { name: 'Light mode' })).toBeInTheDocument();
    expect(isDark()).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('overrides a light OS preference once dark is chosen', async () => {
    stubPrefersDark(false);
    renderToggle();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'System theme' }));
    await user.click(screen.getByRole('button', { name: 'Light mode' }));

    expect(screen.getByRole('button', { name: 'Dark mode' })).toBeInTheDocument();
    expect(isDark()).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('drops the stored override when cycling back to system', async () => {
    stubPrefersDark(false);
    renderToggle();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'System theme' }));
    await user.click(screen.getByRole('button', { name: 'Light mode' }));
    await user.click(screen.getByRole('button', { name: 'Dark mode' }));

    expect(screen.getByRole('button', { name: 'System theme' })).toBeInTheDocument();
    expect(isDark()).toBe(false);
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('restores a stored theme over the OS preference on mount', () => {
    localStorage.setItem('theme', 'dark');
    stubPrefersDark(false);
    renderToggle();

    expect(screen.getByRole('button', { name: 'Dark mode' })).toBeInTheDocument();
    expect(isDark()).toBe(true);
  });
});
