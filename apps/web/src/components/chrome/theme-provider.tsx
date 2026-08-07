// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type { Theme } from './theme-context';
import { ThemeContext } from './theme-context';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const STORAGE_KEY = 'theme';

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Storage access blocked (privacy mode / sandboxed iframe)
  }
  return 'system';
}

function writeStoredTheme(theme: Theme): void {
  try {
    if (theme === 'system') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  } catch {
    // Storage access blocked (privacy mode / sandboxed iframe)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
    () => window.matchMedia(DARK_QUERY).matches,
  );

  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const handler = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    writeStoredTheme(theme);
  }, [theme]);

  return <ThemeContext value={{ theme, setTheme, isDark }}>{children}</ThemeContext>;
}
