// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';

import type { CollectionWeapon, ISOTimestamp, UUID } from '@genshin/domain';
import type { WeaponId } from '@genshin/game-data';

import { db } from '@/firebase/firestore.js';
import { readSnapshot } from '@/repositories/snapshot.js';

import { fromDocument, toDocument } from './document.js';

function collectionRef(userId: string) {
  return db.collection('users').doc(userId).collection('weapons');
}

export async function list(userId: string, weaponId?: string): Promise<CollectionWeapon[]> {
  const ref = weaponId
    ? collectionRef(userId).where('weaponId', '==', weaponId)
    : collectionRef(userId);
  const snapshot = await ref.get();

  return snapshot.docs.map((doc) => fromDocument(doc.id as UUID, doc.data()));
}

export async function get(
  userId: string,
  weaponInstanceId: UUID,
): Promise<CollectionWeapon | null> {
  const snapshot = await collectionRef(userId).doc(weaponInstanceId).get();

  return readSnapshot(snapshot, (data) => fromDocument(weaponInstanceId, data));
}

/**
 * Adds a copy of a weapon, minting the instance identifier.
 *
 * Nothing stops a user owning several identical copies: that's the point of an
 * instance identifier, and the caller has already decided this is a new one
 * rather than an edit of an existing record.
 */
export async function create(
  userId: string,
  weaponId: WeaponId,
  refinementLevel: number,
): Promise<CollectionWeapon> {
  const weaponInstanceId = randomUUID() as UUID;
  const now = new Date().toISOString() as ISOTimestamp;

  const weapon: CollectionWeapon = {
    weaponInstanceId,
    weaponId,
    refinementLevel,
    createdAt: now,
    updatedAt: now,
  };

  await collectionRef(userId).doc(weaponInstanceId).set(toDocument(weapon));

  return weapon;
}

/**
 * Changes an instance's refinement, or reports `null` when no such instance is
 * stored.
 *
 * Reads then writes without a transaction, unlike the character upsert. It
 * touches only `refinementLevel`, so a concurrent update loses one of the two
 * values rather than corrupting the record.
 */
export async function update(
  userId: string,
  weaponInstanceId: UUID,
  refinementLevel: number,
): Promise<CollectionWeapon | null> {
  const docRef = collectionRef(userId).doc(weaponInstanceId);
  const existing = readSnapshot(await docRef.get(), (data) => fromDocument(weaponInstanceId, data));

  if (existing === null) {
    return null;
  }

  const now = new Date().toISOString() as ISOTimestamp;

  const weapon: CollectionWeapon = {
    weaponInstanceId,
    weaponId: existing.weaponId,
    refinementLevel,
    createdAt: existing.createdAt,
    updatedAt: now,
  };

  await docRef.set(toDocument(weapon));

  return weapon;
}

/** Succeeds whether or not the record was there, so absence isn't reported. */
export async function remove(userId: string, weaponInstanceId: UUID): Promise<void> {
  await collectionRef(userId).doc(weaponInstanceId).delete();
}
