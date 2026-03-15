// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { db } from '@/lib/firebase/firestore.js';
import type { ISOTimestamp, ProfileUpdate, UserProfile } from '@genshin/domain';

import { fromDocument, toDocument, type DocumentData } from './document.js';

function docRef(userId: string) {
  return db.collection('users').doc(userId);
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const doc = await docRef(userId).get();

  if (!doc.exists) {
    return null;
  }

  return fromDocument(doc.data() as DocumentData);
}

export async function updateProfile(userId: string, fields: ProfileUpdate): Promise<UserProfile> {
  const ref = docRef(userId);
  const existing = await ref.get();
  const now = new Date().toISOString() as ISOTimestamp;

  if (!existing.exists) {
    const profile: UserProfile = {
      name: fields.name ?? '',
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(toDocument(profile));
    return profile;
  }

  const current = fromDocument(existing.data() as DocumentData);
  const updated: UserProfile = {
    ...current,
    ...fields,
    updatedAt: now,
  };

  await ref.update({ ...toDocument(updated) });
  return updated;
}
