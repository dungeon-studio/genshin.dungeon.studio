// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { use } from 'react';

import type { ThemeContextValue } from './theme-context';
import { ThemeContext } from './theme-context';

export function useTheme(): ThemeContextValue {
  const context = use(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
