// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';

import type { CollectionWeapon, UUID } from '@genshin/domain';
import { WEAPON_ROSTER } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { documentRef, newUserId } from '@/test/firestore.js';

import { create, get, list, remove, update } from './index.js';

// Two distinct weapons, so a filtered list has something to leave out. Taken
// from game data, so a roster change cannot strand the suite.
const [WEAPON, OTHER_WEAPON] = WEAPON_ROSTER;

const REFINEMENT_LEVEL = 1;
const RAISED_REFINEMENT_LEVEL = 5;

const CREATED_AT = '2026-01-01T00:00:00.000Z';
const UPDATED_AT = '2026-01-02T00:00:00.000Z';

// The collection type widens the branded instance id to a plain string, so
// every hand-off back into the repository restates the brand, as the routes do.
const idOf = (weapon: CollectionWeapon) => weapon.weaponInstanceId as UUID;
const newInstanceId = () => randomUUID() as UUID;

const weaponRef = (userId: string, weaponInstanceId: string) =>
  documentRef(userId, 'weapons', weaponInstanceId);

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

    const updated = await update(userId, idOf(created), RAISED_REFINEMENT_LEVEL);

    expect(updated).toMatchObject({
      weaponInstanceId: created.weaponInstanceId,
      weaponId: created.weaponId,
      createdAt: created.createdAt,
      refinementLevel: RAISED_REFINEMENT_LEVEL,
    });
  });

  it('is null for an instance the user does not have', async () => {
    expect(await update(newUserId(), newInstanceId(), RAISED_REFINEMENT_LEVEL)).toBeNull();
  });
});

describe('remove', () => {
  it('takes out the named instance and leaves the rest of the weapon alone', async () => {
    const userId = newUserId();
    const doomed = await create(userId, WEAPON.id, REFINEMENT_LEVEL);
    const survivor = await create(userId, WEAPON.id, REFINEMENT_LEVEL);

    await remove(userId, idOf(doomed));

    expect(await get(userId, idOf(doomed))).toBeNull();
    expect(await get(userId, idOf(survivor))).not.toBeNull();
  });
});

describe('a document stored before schemaVersion existed', () => {
  it('still reads', async () => {
    const userId = newUserId();
    const weaponInstanceId = randomUUID();
    const unstamped = {
      weaponId: WEAPON.id,
      refinementLevel: 3,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    };
    await weaponRef(userId, weaponInstanceId).set(unstamped);

    const weapon = await get(userId, weaponInstanceId as UUID);

    expect(weapon).toEqual({ weaponInstanceId, ...unstamped });
  });
});
