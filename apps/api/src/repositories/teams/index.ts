// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { db } from '@/lib/firebase/firestore.js';
import type { CollectionTeam, ISOTimestamp, TeamSlot } from '@genshin/domain';

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
  const doc = await collectionRef(userId).doc(String(slot)).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (data === undefined) {
    return null;
  }

  return fromDocument(slot, data);
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
  const existing = await docRef.get();
  const now = new Date().toISOString() as ISOTimestamp;

  const existingData = existing.exists ? existing.data() : undefined;
  const existingTeam = existingData ? fromDocument(slot, existingData) : null;

  const team: CollectionTeam = {
    slot,
    name: updates.name ?? existingTeam?.name ?? `Team ${slot}`,
    members:
      updates.members !== undefined
        ? updates.members
        : existingTeam
          ? existingTeam.members
          : [null, null, null, null],
    ...(updates.description !== undefined
      ? { description: updates.description }
      : existingTeam?.description !== undefined
        ? { description: existingTeam.description }
        : {}),
    createdAt: existingTeam ? existingTeam.createdAt : now,
    updatedAt: now,
  };

  await docRef.set(toDocument(team));

  return { team, created: !existing.exists };
}

export async function remove(userId: string, slot: TeamSlot): Promise<void> {
  await collectionRef(userId).doc(String(slot)).delete();
}
