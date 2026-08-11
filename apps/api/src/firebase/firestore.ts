// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { getFirestore } from 'firebase-admin/firestore';

import { app } from '@/firebase/app.js';
import { logger } from '@/logger.js';

const rawDatabaseId = process.env.FIRESTORE_DATABASE_ID ?? '(default)';
const databaseId = rawDatabaseId.trim();

if (databaseId === '') {
  throw new Error('FIRESTORE_DATABASE_ID must not be empty when set.');
}

logger.info({ databaseId }, 'connecting to firestore');

export const db = getFirestore(app, databaseId);
