// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Monitor, Moon, Sun } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';

import type { Theme } from './theme-context';
import { useTheme } from './use-theme';

const CYCLE: Theme[] = ['system', 'light', 'dark'];

const FACES: Record<Theme, { icon: typeof Sun; label: string }> = {
  light: { icon: Sun, label: 'Light mode' },
  dark: { icon: Moon, label: 'Dark mode' },
  system: { icon: Monitor, label: 'System theme' },
};

export function ThemeToggle(): JSX.Element {
  const { theme, setTheme } = useTheme();

  const { icon: Icon, label } = FACES[theme];

  function cycle() {
    setTheme(CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length]);
  }

  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label={label}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}
