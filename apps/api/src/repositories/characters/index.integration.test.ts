// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';

import { CHARACTERS } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { db } from '@/firebase/firestore.js';

import { get, remove, save } from './index.js';

// Any character satisfies these; taking the first keeps a roster change from
// stranding the suite on one that no longer exists.
const CHARACTER = CHARACTERS[0];

// A fresh user per test, so no test observes another's documents and the
// emulator never needs clearing between them.
const newUserId = () => randomUUID();

function documentRef(userId: string, characterId: string) {
  return db.collection('users').doc(userId).collection('characters').doc(characterId);
}

describe('save', () => {
  it('keeps the original createdAt when the character is already collected', async () => {
    const userId = newUserId();

    const first = await save(userId, CHARACTER.id, 1);
    const second = await save(userId, CHARACTER.id, 4);

    expect(second.character.createdAt).toBe(first.character.createdAt);
    expect(second.character.constellationLevel).toBe(4);
  });

  it('reports the first save as a creation and later ones as updates', async () => {
    const userId = newUserId();

    const first = await save(userId, CHARACTER.id, 1);
    const second = await save(userId, CHARACTER.id, 2);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
  });
});

describe('remove', () => {
  it('leaves nothing to get', async () => {
    const userId = newUserId();
    await save(userId, CHARACTER.id, 1);

    await remove(userId, CHARACTER.id);

    expect(await get(userId, CHARACTER.id)).toBeNull();
  });
});

describe('get', () => {
  it('is null for a character the user never collected', async () => {
    expect(await get(newUserId(), CHARACTER.id)).toBeNull();
  });
});

// Nothing the API can do writes an unstamped document — `toDocument` always
// stamps the current version — so these documents can only be planted, and this
// is the only place the stored side of the version union gets exercised.
describe('a document stored before schemaVersion existed', () => {
  const unstamped = {
    constellationLevel: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };

  it('still reads', async () => {
    const userId = newUserId();
    await documentRef(userId, CHARACTER.id).set(unstamped);

    const character = await get(userId, CHARACTER.id);

    expect(character).toEqual({
      characterId: CHARACTER.id,
      constellationLevel: unstamped.constellationLevel,
      createdAt: unstamped.createdAt,
      updatedAt: unstamped.updatedAt,
    });
  });

  it('is stamped once written back', async () => {
    const userId = newUserId();
    await documentRef(userId, CHARACTER.id).set(unstamped);

    await save(userId, CHARACTER.id, 6);

    const stored = (await documentRef(userId, CHARACTER.id).get()).data();
    expect(stored).toMatchObject({ schemaVersion: 1, createdAt: unstamped.createdAt });
  });
});
