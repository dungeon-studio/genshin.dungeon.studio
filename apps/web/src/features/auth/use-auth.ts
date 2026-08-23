// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { use } from 'react';

import type { AuthContextValue } from './auth-context';
import { AuthContext } from './auth-context';

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
