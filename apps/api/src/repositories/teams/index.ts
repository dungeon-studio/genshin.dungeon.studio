// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam, ISOTimestamp, TeamSlot } from '@genshin/domain';

import { db } from '@/firebase/firestore.js';
import { readSnapshot } from '@/repositories/snapshot.js';

import { fromDocument, toDocument } from './document.js';

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
  updates: {
    name?: string;
    members?: CollectionTeam['members'];
    description?: string;
  },
): Promise<SaveResult> {
  const docRef = collectionRef(userId).doc(String(slot));
  const existing = readSnapshot(await docRef.get(), (data) => fromDocument(slot, data));
  const now = new Date().toISOString() as ISOTimestamp;

  const description = updates.description ?? existing?.description;

  const team: CollectionTeam = {
    slot,
    name: updates.name ?? existing?.name ?? `Team ${slot}`,
    members: updates.members ?? existing?.members ?? [null, null, null, null],
    ...(description !== undefined ? { description } : {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await docRef.set(toDocument(team));

  return { team, created: existing === null };
}

export async function remove(userId: string, slot: TeamSlot): Promise<void> {
  await collectionRef(userId).doc(String(slot)).delete();
}
