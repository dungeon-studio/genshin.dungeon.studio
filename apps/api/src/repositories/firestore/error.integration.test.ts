// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { documentRef, newUserId } from '@/test/firestore.js';

import { isFirestoreError } from './error.js';

// The unit suite builds its errors by hand; only a real rejection confirms the
// client library produces that shape.
describe('isFirestoreError', () => {
  it('recognises a rejection from Firestore', async () => {
    const missing = documentRef(newUserId(), 'weapons', randomUUID());
    await expect(missing.update({ refinementLevel: 1 })).rejects.toSatisfy(isFirestoreError);
  });
});
