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
import { nextCharacter } from './merge.js';

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

/**
 * Upserts a character, reporting whether the record was new so the route can
 * answer 201 rather than 200.
 *
 * Reads and writes in one transaction: two concurrent saves would otherwise
 * both see no existing record and the later one would overwrite `createdAt`.
 */
export async function save(
  userId: string,
  characterId: CharacterId,
  constellationLevel: ConstellationLevel,
): Promise<SaveResult> {
  const docRef = collectionRef(userId).doc(characterId);

  return db.runTransaction(async (transaction) => {
    const existing = readSnapshot(await transaction.get(docRef), (data) =>
      fromDocument(characterId, data),
    );
    const now = new Date().toISOString() as ISOTimestamp;

    const character = nextCharacter(characterId, constellationLevel, existing, now);

    transaction.set(docRef, toDocument(character));

    return { character, created: existing === null };
  });
}

/** Succeeds whether or not the record was there, so absence isn't reported. */
export async function remove(userId: string, characterId: string): Promise<void> {
  await collectionRef(userId).doc(characterId).delete();
}
