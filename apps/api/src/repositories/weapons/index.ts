// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';

import type { CollectionWeapon, ISOTimestamp, UUID } from '@genshin/domain';

import { db } from '@/lib/firebase/firestore.js';

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

function nowTimestamp(): ISOTimestamp {
  return new Date().toISOString() as ISOTimestamp;
}

async function write(userId: string, weapon: CollectionWeapon): Promise<void> {
  await collectionRef(userId).doc(weapon.weaponInstanceId).set(toDocument(weapon));
}

export async function create(
  userId: string,
  weaponId: string,
  refinementLevel: number,
): Promise<CollectionWeapon> {
  const now = nowTimestamp();

  const weapon: CollectionWeapon = {
    weaponInstanceId: randomUUID() as UUID,
    weaponId,
    refinementLevel,
    createdAt: now,
    updatedAt: now,
  };

  await write(userId, weapon);

  return weapon;
}

export interface SaveResult {
  weapon: CollectionWeapon;
  created: boolean;
}

/**
 * Create or replace the instance at `weaponInstanceId`.
 *
 * Unlike `create`, the caller names the instance, so a restore can put a weapon
 * back under the identifier its teams already reference. `createdAt` survives a
 * replacement, keeping the collection's original acquisition order.
 */
export async function save(
  userId: string,
  weaponInstanceId: UUID,
  weaponId: string,
  refinementLevel: number,
): Promise<SaveResult> {
  const existing = await get(userId, weaponInstanceId);
  const now = nowTimestamp();

  const weapon: CollectionWeapon = {
    weaponInstanceId,
    weaponId,
    refinementLevel,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await write(userId, weapon);

  return { weapon, created: existing === null };
}

export async function update(
  userId: string,
  weaponInstanceId: UUID,
  refinementLevel: number,
): Promise<CollectionWeapon | null> {
  const existing = await get(userId, weaponInstanceId);

  if (existing === null) {
    return null;
  }

  const weapon: CollectionWeapon = { ...existing, refinementLevel, updatedAt: nowTimestamp() };

  await write(userId, weapon);

  return weapon;
}

export async function remove(userId: string, weaponInstanceId: UUID): Promise<void> {
  await collectionRef(userId).doc(weaponInstanceId).delete();
}
