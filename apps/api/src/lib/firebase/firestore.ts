// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { getFirestore } from 'firebase-admin/firestore';

import { app } from '@/lib/firebase/app.js';

const rawDatabaseId = process.env.FIRESTORE_DATABASE_ID ?? '(default)';
const databaseId = rawDatabaseId.trim();

if (databaseId === '') {
  throw new Error('FIRESTORE_DATABASE_ID must not be empty when set.');
}

console.log(`Firestore: database=${databaseId}`);

export const db = getFirestore(app, databaseId);
