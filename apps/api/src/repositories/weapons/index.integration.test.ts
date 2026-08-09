// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';

import type { UUID } from '@genshin/domain';
import { WEAPONS } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { db } from '@/firebase/firestore.js';

import { create, get, list, remove, update } from './index.js';

// Two distinct weapons, so a filtered list has something to leave out. Taken
// from game data, so a roster change cannot strand the suite.
const [WEAPON, OTHER_WEAPON] = WEAPONS;

const REFINEMENT_LEVEL = 1;

// A fresh user per test, so no test observes another's documents and the
// emulator never needs clearing between them.
const newUserId = () => randomUUID();

// `create` mints instance ids itself; these stand in where a test needs one the
// collection does not hold. The brand carries no runtime check, so the routes
// assert it the same way.
const newInstanceId = () => randomUUID() as UUID;

function documentRef(userId: string, weaponInstanceId: string) {
  return db.collection('users').doc(userId).collection('weapons').doc(weaponInstanceId);
}

describe('list', () => {
  it('returns only the instances of the weapon it is filtered to', async () => {
    const userId = newUserId();
    const wanted = await create(userId, WEAPON.id, REFINEMENT_LEVEL);
    await create(userId, WEAPON.id, REFINEMENT_LEVEL);
    await create(userId, OTHER_WEAPON.id, REFINEMENT_LEVEL);

    const instances = await list(userId, WEAPON.id);

    expect(instances).toHaveLength(2);
    expect(instances.map((instance) => instance.weaponId)).toEqual([WEAPON.id, WEAPON.id]);
    expect(instances.map((instance) => instance.weaponInstanceId)).toContain(
      wanted.weaponInstanceId,
    );
  });
});

describe('update', () => {
  it('changes the refinement level without disturbing the rest of the instance', async () => {
    const userId = newUserId();
    const created = await create(userId, WEAPON.id, REFINEMENT_LEVEL);

    const updated = await update(userId, created.weaponInstanceId as UUID, 5);

    expect(updated).toMatchObject({
      weaponInstanceId: created.weaponInstanceId,
      weaponId: created.weaponId,
      createdAt: created.createdAt,
      refinementLevel: 5,
    });
  });

  it('is null for an instance the user does not have', async () => {
    expect(await update(newUserId(), newInstanceId(), 5)).toBeNull();
  });
});

describe('remove', () => {
  it('takes out the named instance and leaves the rest of the weapon alone', async () => {
    const userId = newUserId();
    const doomed = await create(userId, WEAPON.id, REFINEMENT_LEVEL);
    const survivor = await create(userId, WEAPON.id, REFINEMENT_LEVEL);

    await remove(userId, doomed.weaponInstanceId as UUID);

    expect(await get(userId, doomed.weaponInstanceId as UUID)).toBeNull();
    expect(await get(userId, survivor.weaponInstanceId as UUID)).not.toBeNull();
  });
});

// Nothing the API can do writes an unstamped document — `toDocument` always
// stamps the current version — so this document can only be planted, and this
// is the only place the stored side of the version union gets exercised.
describe('a document stored before schemaVersion existed', () => {
  it('still reads', async () => {
    const userId = newUserId();
    const weaponInstanceId = randomUUID();
    const unstamped = {
      weaponId: WEAPON.id,
      refinementLevel: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };
    await documentRef(userId, weaponInstanceId).set(unstamped);

    const weapon = await get(userId, weaponInstanceId as UUID);

    expect(weapon).toEqual({ weaponInstanceId, ...unstamped });
  });
});
