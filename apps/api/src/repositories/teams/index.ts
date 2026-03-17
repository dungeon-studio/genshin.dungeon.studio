// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { db } from '@/lib/firebase/firestore.js';
import type { CollectionTeam, ISOTimestamp, TeamSlot } from '@genshin/domain';

import { fromDocument, toDocument, type DocumentData } from './document.js';

function collectionRef(userId: string) {
  return db.collection('users').doc(userId).collection('teams');
}

export async function listTeams(userId: string): Promise<CollectionTeam[]> {
  const snapshot = await collectionRef(userId).get();

  return snapshot.docs.map((doc) =>
    fromDocument(Number(doc.id) as TeamSlot, doc.data() as DocumentData),
  );
}

export async function getTeam(userId: string, slot: TeamSlot): Promise<CollectionTeam | null> {
  const doc = await collectionRef(userId).doc(String(slot)).get();

  if (!doc.exists) {
    return null;
  }

  return fromDocument(slot, doc.data() as DocumentData);
}

export interface SaveTeamResult {
  team: CollectionTeam;
  created: boolean;
}

export async function saveTeam(
  userId: string,
  slot: TeamSlot,
  updates: {
    name?: string;
    members?: CollectionTeam['members'];
    description?: string;
  },
): Promise<SaveTeamResult> {
  const docRef = collectionRef(userId).doc(String(slot));
  const existing = await docRef.get();
  const now = new Date().toISOString() as ISOTimestamp;

  const existingData = existing.exists ? (existing.data() as DocumentData) : null;

  const team: CollectionTeam = {
    slot,
    name: updates.name ?? existingData?.name ?? `Team ${slot}`,
    members:
      updates.members !== undefined
        ? updates.members
        : existingData
          ? fromDocument(slot, existingData).members
          : [],
    ...(updates.description !== undefined
      ? { description: updates.description }
      : existingData?.description
        ? { description: existingData.description }
        : {}),
    createdAt: existingData ? (existingData.createdAt as ISOTimestamp) : now,
    updatedAt: now,
  };

  await docRef.set(toDocument(team));

  return { team, created: !existing.exists };
}

export async function deleteTeam(userId: string, slot: TeamSlot): Promise<void> {
  await collectionRef(userId).doc(String(slot)).delete();
}
