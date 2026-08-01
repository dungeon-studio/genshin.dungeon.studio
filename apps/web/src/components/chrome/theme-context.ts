// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { createContext } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** `theme` resolved against the OS preference. */
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
