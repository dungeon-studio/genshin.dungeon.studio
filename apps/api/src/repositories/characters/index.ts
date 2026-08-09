// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  CharacterId,
  CollectionCharacter,
  ConstellationLevel,
  ISOTimestamp,
} from '@genshin/domain';
import type { DocumentSnapshot } from 'firebase-admin/firestore';

import { db } from '@/firebase/firestore.js';

import { fromDocument, toDocument } from './document.js';

function collectionRef(userId: string) {
  return db.collection('users').doc(userId).collection('characters');
}

// `data()` is undefined exactly when the document is absent, so it subsumes an
// `exists` check.
function fromSnapshot(characterId: string, snapshot: DocumentSnapshot): CollectionCharacter | null {
  const data = snapshot.data();

  return data === undefined ? null : fromDocument(characterId, data);
}

export async function list(userId: string): Promise<CollectionCharacter[]> {
  const snapshot = await collectionRef(userId).get();

  return snapshot.docs.map((doc) => fromDocument(doc.id, doc.data()));
}

export async function get(
  userId: string,
  characterId: string,
): Promise<CollectionCharacter | null> {
  return fromSnapshot(characterId, await collectionRef(userId).doc(characterId).get());
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
    const existing = fromSnapshot(characterId, snapshot);
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
