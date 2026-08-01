// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Monitor, Moon, Sun } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';

import type { Theme } from './theme-context';
import { useTheme } from './use-theme';

const CYCLE: Theme[] = ['system', 'light', 'dark'];
const ICONS: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };
const LABELS: Record<Theme, string> = {
  light: 'Light mode',
  dark: 'Dark mode',
  system: 'System theme',
};

export function ThemeToggle(): JSX.Element {
  const { theme, setTheme } = useTheme();

  const Icon = ICONS[theme];

  function cycle() {
    setTheme(CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length]);
  }

  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label={LABELS[theme]}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}
