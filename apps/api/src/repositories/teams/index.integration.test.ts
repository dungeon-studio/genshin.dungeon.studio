// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';

import type { TeamSlot } from '@genshin/domain';
import { CHARACTERS } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { db } from '@/firebase/firestore.js';

import { get, list, remove, save } from './index.js';

const SLOT = 1 as TeamSlot;
const CHARACTER = CHARACTERS[0];

// A fresh user per test, so no test observes another's documents and the
// emulator never needs clearing between them.
const newUserId = () => randomUUID();

function collectionRef(userId: string) {
  return db.collection('users').doc(userId).collection('teams');
}

describe('get', () => {
  it('returns the team saved in that slot', async () => {
    const userId = newUserId();
    await save(userId, SLOT, { name: 'Vaporise' });

    const team = await get(userId, SLOT);

    expect(team?.name).toBe('Vaporise');
  });

  it('is null for a slot the user never saved', async () => {
    expect(await get(newUserId(), SLOT)).toBeNull();
  });
});

describe('remove', () => {
  it('leaves nothing to get', async () => {
    const userId = newUserId();
    await save(userId, SLOT, { name: 'Vaporise' });

    await remove(userId, SLOT);

    expect(await get(userId, SLOT)).toBeNull();
  });
});

describe('list', () => {
  // The routes reject any slot outside 1-4 before the repository sees it, so a
  // document named anything else can only be planted. Reading one back as a
  // team would hand `fromDocument` a slot the domain rejects.
  it('skips documents whose id is not a slot', async () => {
    const userId = newUserId();
    await save(userId, SLOT, { name: 'Vaporise' });
    await collectionRef(userId)
      .doc('9')
      .set({
        schemaVersion: 1,
        name: 'Out of range',
        members: [null, null, null, null],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });

    const teams = await list(userId);

    expect(teams.map((team) => team.slot)).toEqual([SLOT]);
  });
});

// Nothing the API can do writes an unstamped document — `toDocument` always
// stamps the current version — so this document can only be planted, and this
// is the only place the stored side of the version union gets exercised.
describe('a document stored before schemaVersion existed', () => {
  it('still reads', async () => {
    const userId = newUserId();
    await collectionRef(userId)
      .doc(String(SLOT))
      .set({
        name: 'Vaporise',
        members: [{ characterId: CHARACTER.id }, null, null, null],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      });

    const team = await get(userId, SLOT);

    expect(team).toEqual({
      slot: SLOT,
      name: 'Vaporise',
      members: [{ characterId: CHARACTER.id }, null, null, null],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
  });
});
