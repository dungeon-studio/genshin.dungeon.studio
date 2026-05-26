// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext } from 'react';

export interface AuthContextValue {
  user: FirebaseUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
