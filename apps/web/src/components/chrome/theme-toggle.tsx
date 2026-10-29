// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Monitor, Moon, Sun } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { cycleLabel } from '@/lib/cycle-label';

import type { Theme } from './theme-context';
import { useTheme } from './use-theme';

const NEXT: Record<Theme, Theme> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ThemeToggle(): JSX.Element {
  const { theme, setTheme } = useTheme();

  const Icon = ICONS[theme];

  function cycle() {
    setTheme(NEXT[theme]);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      aria-label={cycleLabel('Theme', theme, NEXT[theme])}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
