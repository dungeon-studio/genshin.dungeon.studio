// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { User } from '@firebase/auth';
import { createContext } from 'react';

export type AuthUser = User;

export type AuthState =
  { status: 'loading' } | { status: 'signed-out' } | { status: 'signed-in'; user: AuthUser };

export const AuthContext = createContext<AuthState | undefined>(undefined);
