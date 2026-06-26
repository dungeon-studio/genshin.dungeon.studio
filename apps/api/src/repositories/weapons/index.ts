// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { db } from '@/lib/firebase/firestore.js';
import type { CollectionWeapon, ISOTimestamp, UUID } from '@genshin/domain';
import { randomUUID } from 'node:crypto';

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
  const doc = await collectionRef(userId).doc(weaponInstanceId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (data === undefined) {
    return null;
  }

  return fromDocument(weaponInstanceId, data);
}

export async function create(
  userId: string,
  weaponId: string,
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

export async function update(
  userId: string,
  weaponInstanceId: UUID,
  refinementLevel: number,
): Promise<CollectionWeapon | null> {
  const docRef = collectionRef(userId).doc(weaponInstanceId);
  const existing = await docRef.get();

  if (!existing.exists) {
    return null;
  }

  const existingData = existing.data();
  if (existingData === undefined) {
    return null;
  }

  const existingWeapon = fromDocument(weaponInstanceId, existingData);
  const now = new Date().toISOString() as ISOTimestamp;

  const weapon: CollectionWeapon = {
    weaponInstanceId,
    weaponId: existingWeapon.weaponId,
    refinementLevel,
    createdAt: existingWeapon.createdAt,
    updatedAt: now,
  };

  await docRef.set(toDocument(weapon));

  return weapon;
}

export async function remove(userId: string, weaponInstanceId: UUID): Promise<void> {
  await collectionRef(userId).doc(weaponInstanceId).delete();
}
