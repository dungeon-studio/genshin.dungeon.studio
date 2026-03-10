// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { initializeApp } from 'firebase-admin/app';
import { type DecodedIdToken, getAuth } from 'firebase-admin/auth';

// Initialize with Application Default Credentials (ADC).
// In GCP, credentials are provided automatically.
// Locally, set the GOOGLE_APPLICATION_CREDENTIALS environment variable.
const app = initializeApp();
const auth = getAuth(app);

export async function verifyToken(idToken: string): Promise<DecodedIdToken> {
  return auth.verifyIdToken(idToken);
}

export type { DecodedIdToken };
