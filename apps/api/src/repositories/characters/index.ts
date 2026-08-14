// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  CharacterId,
  CollectionCharacter,
  ConstellationLevel,
  ISOTimestamp,
} from '@genshin/domain';

import { db } from '@/firebase/firestore.js';
import { readSnapshot } from '@/repositories/snapshot.js';

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
  const snapshot = await collectionRef(userId).doc(characterId).get();

  return readSnapshot(snapshot, (data) => fromDocument(characterId, data));
}

export interface SaveResult {
  character: CollectionCharacter;
  created: boolean;
}

export async function save(
  userId: string,
  characterId: CharacterId,
  constellationLevel: ConstellationLevel,
): Promise<SaveResult> {
  const docRef = collectionRef(userId).doc(characterId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(docRef);
    const existing = readSnapshot(snapshot, (data) => fromDocument(characterId, data));
    const now = new Date().toISOString() as ISOTimestamp;

    const character: CollectionCharacter = {
      characterId,
      constellationLevel,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    transaction.set(docRef, toDocument(character));

    return { character, created: !snapshot.exists };
  });
}

export async function remove(userId: string, characterId: string): Promise<void> {
  await collectionRef(userId).doc(characterId).delete();
}
