// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { User } from '@firebase/auth';
import { createContext } from 'react';

export type AuthUser = User;

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
