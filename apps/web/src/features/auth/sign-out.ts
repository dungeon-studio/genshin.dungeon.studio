// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { signOut as endFirebaseSession } from 'firebase/auth';

import { auth } from '@/lib/firebase';

export async function signOut(): Promise<void> {
  try {
    await endFirebaseSession(auth);
  } catch (error) {
    console.error('Sign-out failed:', error);
  }
}
