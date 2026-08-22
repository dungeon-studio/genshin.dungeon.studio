// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { documentRef, newUserId } from '@/test/firestore.js';

import { eraseStoredData } from './index.js';

const STORED = {
  characters: { schemaVersion: 1, constellationLevel: 3 },
  teams: { schemaVersion: 1, name: 'Vaporise' },
  weapons: { schemaVersion: 1, refinementLevel: 2 },
} as const;

type Subcollection = keyof typeof STORED;

const SUBCOLLECTIONS = Object.keys(STORED) as Subcollection[];

async function plant(userId: string): Promise<void> {
  await Promise.all(
    SUBCOLLECTIONS.map(async (subcollection) =>
      documentRef(userId, subcollection, 'stored').set(STORED[subcollection]),
    ),
  );
}

async function remaining(userId: string): Promise<Subcollection[]> {
  const present = await Promise.all(
    SUBCOLLECTIONS.map(async (subcollection) =>
      (await documentRef(userId, subcollection, 'stored').get()).exists ? subcollection : null,
    ),
  );

  return present.filter((subcollection) => subcollection !== null);
}

describe('eraseStoredData', () => {
  it('leaves nothing the user stored, whichever subcollection held it', async () => {
    const userId = newUserId();
    await plant(userId);

    await eraseStoredData(userId);

    expect(await remaining(userId)).toEqual([]);
  });

  it('reaches only the account asked for', async () => {
    const userId = newUserId();
    const bystander = newUserId();
    await plant(userId);
    await plant(bystander);

    await eraseStoredData(userId);

    expect(await remaining(bystander)).toEqual(SUBCOLLECTIONS);
  });

  // A retry after a part-way failure erases what the first attempt missed and
  // must not fault on what it already removed.
  it('succeeds against an account that stored nothing', async () => {
    await expect(eraseStoredData(newUserId())).resolves.toBeUndefined();
  });
});
