// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { CHARACTER_ROSTER } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { documentRef, newUserId } from '@/test/firestore.js';

import { get, remove, save } from './index.js';

// Any character satisfies these; taking the first keeps a roster change from
// stranding the suite on one that no longer exists.
const CHARACTER = CHARACTER_ROSTER[0];

const CREATED_AT = '2026-01-01T00:00:00.000Z';
const UPDATED_AT = '2026-01-02T00:00:00.000Z';

const characterRef = (userId: string) => documentRef(userId, 'characters', CHARACTER.id);

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

describe('a document stored before schemaVersion existed', () => {
  const unstamped = {
    constellationLevel: 5,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  };

  it('still reads', async () => {
    const userId = newUserId();
    await characterRef(userId).set(unstamped);

    const character = await get(userId, CHARACTER.id);

    expect(character).toEqual({ characterId: CHARACTER.id, ...unstamped });
  });

  it('is stamped once written back', async () => {
    const userId = newUserId();
    await characterRef(userId).set(unstamped);

    await save(userId, CHARACTER.id, 6);

    expect((await characterRef(userId).get()).data()).toMatchObject({
      schemaVersion: 1,
      createdAt: CREATED_AT,
    });
  });
});
