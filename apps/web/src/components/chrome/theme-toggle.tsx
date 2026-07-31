// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Monitor, Moon, Sun } from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

type Theme = 'light' | 'dark' | 'system';

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Storage access blocked (privacy mode / sandboxed iframe)
  }
  return 'system';
}

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);

  document.documentElement.classList.toggle('dark', isDark);
}

const CYCLE: Theme[] = ['system', 'light', 'dark'];
const ICONS: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };
const LABELS: Record<Theme, string> = {
  light: 'Light mode',
  dark: 'Dark mode',
  system: 'System theme',
};

export function ThemeToggle(): JSX.Element {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);

    try {
      if (theme === 'system') {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', theme);
      }
    } catch {
      // Ignore storage errors (e.g. access blocked in privacy mode)
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const Icon = ICONS[theme];

  function cycle() {
    setTheme((current) => {
      const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
      return next;
    });
  }

  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label={LABELS[theme]}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}
