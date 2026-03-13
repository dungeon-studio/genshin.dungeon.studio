// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { db } from '@/lib/firebase/firestore.js';
import type { CollectionCharacter, ISOTimestamp } from '@genshin/types';

import { fromDocument, toDocument, type DocumentData } from './document.js';

function collectionRef(userId: string) {
  return db.collection('users').doc(userId).collection('characters');
}

export async function listCharacters(userId: string): Promise<CollectionCharacter[]> {
  const snapshot = await collectionRef(userId).get();

  return snapshot.docs.map((doc) => fromDocument(doc.id, doc.data() as DocumentData));
}

export async function getCharacter(
  userId: string,
  characterId: string,
): Promise<CollectionCharacter | null> {
  const doc = await collectionRef(userId).doc(characterId).get();

  if (!doc.exists) {
    return null;
  }

  return fromDocument(characterId, doc.data() as DocumentData);
}

export interface SaveCharacterResult {
  character: CollectionCharacter;
  created: boolean;
}

export async function saveCharacter(
  userId: string,
  characterId: string,
  constellationLevel: number,
): Promise<SaveCharacterResult> {
  const docRef = collectionRef(userId).doc(characterId);
  const existing = await docRef.get();
  const now = new Date().toISOString() as ISOTimestamp;

  const character: CollectionCharacter = {
    characterId,
    constellationLevel,
    createdAt: existing.exists
      ? ((existing.data() as DocumentData).createdAt as ISOTimestamp)
      : now,
    updatedAt: now,
  };

  await docRef.set(toDocument(character));

  return { character, created: !existing.exists };
}

export async function deleteCharacter(userId: string, characterId: string): Promise<void> {
  await collectionRef(userId).doc(characterId).delete();
}
