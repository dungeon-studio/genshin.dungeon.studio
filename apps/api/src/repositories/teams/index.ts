// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam, ISOTimestamp, TeamSlot } from '@genshin/domain';

import { db } from '@/firebase/firestore.js';
import { readSnapshot } from '@/repositories/snapshot.js';

import { fromDocument, toDocument } from './document.js';
import { nextTeam, type TeamUpdates } from './merge.js';

function collectionRef(userId: string) {
  return db.collection('users').doc(userId).collection('teams');
}

export async function list(userId: string): Promise<CollectionTeam[]> {
  const snapshot = await collectionRef(userId).get();

  return snapshot.docs
    .filter((doc) => /^[1-4]$/.test(doc.id))
    .map((doc) => fromDocument(Number(doc.id) as TeamSlot, doc.data()));
}

export async function get(userId: string, slot: TeamSlot): Promise<CollectionTeam | null> {
  const snapshot = await collectionRef(userId).doc(String(slot)).get();

  return readSnapshot(snapshot, (data) => fromDocument(slot, data));
}

export interface SaveResult {
  team: CollectionTeam;
  created: boolean;
}

export async function save(
  userId: string,
  slot: TeamSlot,
  updates: TeamUpdates,
): Promise<SaveResult> {
  const docRef = collectionRef(userId).doc(String(slot));
  const existing = readSnapshot(await docRef.get(), (data) => fromDocument(slot, data));
  const now = new Date().toISOString() as ISOTimestamp;

  const team = nextTeam(slot, updates, existing, now);

  await docRef.set(toDocument(team));

  return { team, created: existing === null };
}

export async function remove(userId: string, slot: TeamSlot): Promise<void> {
  await collectionRef(userId).doc(String(slot)).delete();
}
