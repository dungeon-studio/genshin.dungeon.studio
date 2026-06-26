// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { db } from '@/lib/firebase/firestore.js';
import type { CollectionCharacter, ISOTimestamp } from '@genshin/domain';

import { fromDocument, toDocument } from './document.js';

function collectionRef(userId: string) {
  return db.collection('users').doc(userId).collection('characters');
}

export async function list(userId: string): Promise<CollectionCharacter[]> {
  const snapshot = await collectionRef(userId).get();

  return snapshot.docs.map((doc) => fromDocument(doc.id, doc.data()));
}

export async function get(
  userId: string,
  characterId: string,
): Promise<CollectionCharacter | null> {
  const doc = await collectionRef(userId).doc(characterId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (data === undefined) {
    return null;
  }

  return fromDocument(characterId, data);
}

export interface SaveResult {
  character: CollectionCharacter;
  created: boolean;
}

export async function save(
  userId: string,
  characterId: string,
  constellationLevel: number,
): Promise<SaveResult> {
  const docRef = collectionRef(userId).doc(characterId);
  const existing = await docRef.get();
  const now = new Date().toISOString() as ISOTimestamp;

  const existingData = existing.exists ? existing.data() : undefined;

  const character: CollectionCharacter = {
    characterId,
    constellationLevel,
    createdAt: existingData ? fromDocument(characterId, existingData).createdAt : now,
    updatedAt: now,
  };

  await docRef.set(toDocument(character));

  return { character, created: !existing.exists };
}

export async function remove(userId: string, characterId: string): Promise<void> {
  await collectionRef(userId).doc(characterId).delete();
}
