// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { app } from '@/lib/firebase/app';
import { type DecodedIdToken, getAuth } from 'firebase-admin/auth';

const auth = getAuth(app);

export async function verifyToken(idToken: string): Promise<DecodedIdToken> {
  const checkRevoked = true;
  return auth.verifyIdToken(idToken, checkRevoked);
}

export type { DecodedIdToken };
