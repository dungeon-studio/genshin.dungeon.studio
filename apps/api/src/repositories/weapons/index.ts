// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { db } from '@/lib/firebase/firestore.js';
import type { CollectionWeapon, ISOTimestamp, UUID } from '@genshin/types';
import { randomUUID } from 'node:crypto';

import { fromDocument, toDocument, type DocumentData } from './document.js';

function collectionRef(userId: string, weaponId: string) {
  return db
    .collection('users')
    .doc(userId)
    .collection('weapons')
    .doc(weaponId)
    .collection('instances');
}

export async function listWeapons(userId: string): Promise<Record<string, CollectionWeapon[]>> {
  const weaponsRef = db.collection('users').doc(userId).collection('weapons');
  const weaponDocs = await weaponsRef.listDocuments();

  const results: Record<string, CollectionWeapon[]> = {};

  const snapshots = await Promise.all(
    weaponDocs.map(async (weaponDoc) => ({
      weaponId: weaponDoc.id,
      snapshot: await weaponDoc.collection('instances').get(),
    })),
  );

  for (const { weaponId, snapshot } of snapshots) {
    const instances = snapshot.docs.map((doc) =>
      fromDocument(doc.id as UUID, weaponId, doc.data() as DocumentData),
    );
    if (instances.length > 0) {
      results[weaponId] = instances;
    }
  }

  return results;
}

export async function listWeaponInstances(
  userId: string,
  weaponId: string,
): Promise<CollectionWeapon[]> {
  const snapshot = await collectionRef(userId, weaponId).get();

  return snapshot.docs.map((doc) =>
    fromDocument(doc.id as UUID, weaponId, doc.data() as DocumentData),
  );
}

export async function getWeaponInstance(
  userId: string,
  weaponId: string,
  weaponInstanceId: UUID,
): Promise<CollectionWeapon | null> {
  const doc = await collectionRef(userId, weaponId).doc(weaponInstanceId).get();

  if (!doc.exists) {
    return null;
  }

  return fromDocument(weaponInstanceId as UUID, weaponId, doc.data() as DocumentData);
}

export async function createWeaponInstance(
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

  const batch = db.batch();
  batch.set(
    db.collection('users').doc(userId).collection('weapons').doc(weaponId),
    {},
    { merge: true },
  );
  batch.set(collectionRef(userId, weaponId).doc(weaponInstanceId), toDocument(weapon));
  await batch.commit();

  return weapon;
}

export async function updateWeaponInstance(
  userId: string,
  weaponId: string,
  weaponInstanceId: UUID,
  refinementLevel: number,
): Promise<CollectionWeapon | null> {
  const docRef = collectionRef(userId, weaponId).doc(weaponInstanceId);
  const existing = await docRef.get();

  if (!existing.exists) {
    return null;
  }

  const existingData = existing.data() as DocumentData;
  const now = new Date().toISOString() as ISOTimestamp;

  const weapon: CollectionWeapon = {
    weaponInstanceId,
    weaponId,
    refinementLevel,
    createdAt: existingData.createdAt as ISOTimestamp,
    updatedAt: now,
  };

  await docRef.set(toDocument(weapon));

  return weapon;
}

export async function deleteWeaponInstance(
  userId: string,
  weaponId: string,
  weaponInstanceId: UUID,
): Promise<void> {
  await collectionRef(userId, weaponId).doc(weaponInstanceId).delete();
}
