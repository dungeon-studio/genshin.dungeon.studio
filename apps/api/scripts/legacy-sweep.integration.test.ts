// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { db } from '@/firebase/firestore.js';
import { documentRef, newUserId } from '@/test/firestore.js';
import { CHARACTER, WEAPON } from '@/test/roster.js';

import { sweep, type SweepResult } from './legacy-sweep.js';

const TIMESTAMPS = {
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const unstampedCharacter = { constellationLevel: 5, ...TIMESTAMPS };
const unstampedTeam = {
  name: 'Legacy',
  members: [{ characterId: CHARACTER.id }, null, null, null],
  ...TIMESTAMPS,
};
const currentWeapon = { schemaVersion: 1, weaponId: WEAPON.id, refinementLevel: 1, ...TIMESTAMPS };

async function seed(userId: string) {
  const character = documentRef(userId, 'characters', CHARACTER.id);
  const team = documentRef(userId, 'teams', '1');
  await character.set(unstampedCharacter);
  await team.set(unstampedTeam);
  await documentRef(userId, 'weapons', randomUUID()).set(currentWeapon);
  return { character, team };
}

function run(userId: string, write: boolean): Promise<SweepResult> {
  return sweep([db.collection('users').doc(userId)], { write });
}

describe('a read-only sweep', () => {
  it('counts each document at the version it was stored at', async () => {
    const userId = newUserId();
    await seed(userId);

    const { census } = await run(userId, false);

    expect(census.get('characters')).toEqual(new Map([[0, 1]]));
    expect(census.get('teams')).toEqual(new Map([[0, 1]]));
    expect(census.get('weapons')).toEqual(new Map([[1, 1]]));
  });

  it('writes nothing', async () => {
    const userId = newUserId();
    const { character } = await seed(userId);

    const { rewritten } = await run(userId, false);

    expect(rewritten).toBe(0);
    expect((await character.get()).data()).toEqual(unstampedCharacter);
  });
});

describe('a writing sweep', () => {
  it('rewrites every legacy document at the current version', async () => {
    const userId = newUserId();
    const { character, team } = await seed(userId);

    const { rewritten } = await run(userId, true);

    expect(rewritten).toBe(2);
    expect((await character.get()).data()).toEqual({ schemaVersion: 1, ...unstampedCharacter });
    expect((await team.get()).data()).toMatchObject({ schemaVersion: 1, name: 'Legacy' });
  });

  it('leaves no legacy document for the next sweep', async () => {
    const userId = newUserId();
    await seed(userId);
    await run(userId, true);

    const { census } = await run(userId, false);

    expect(census.get('characters')).toEqual(new Map([[1, 1]]));
    expect(census.get('teams')).toEqual(new Map([[1, 1]]));
  });
});

it('counts a document no version accepts and sweeps on past it', async () => {
  const userId = newUserId();
  await documentRef(userId, 'characters', 'not-a-character').set({ schemaVersion: 1 });
  await documentRef(userId, 'characters', CHARACTER.id).set(unstampedCharacter);

  const { census, rewritten } = await run(userId, true);

  expect(census.get('characters')).toEqual(
    new Map<number | 'invalid', number>([
      ['invalid', 1],
      [0, 1],
    ]),
  );
  expect(rewritten).toBe(1);
});
