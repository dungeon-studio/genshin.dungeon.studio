// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ISOTimestamp, ProfileUpdate, UserProfile } from '@genshin/domain';

import { db } from '@/lib/firebase/firestore.js';

import { fromDocument, toDocument } from './document.js';

function docRef(userId: string) {
  return db.collection('users').doc(userId);
}

export async function get(userId: string): Promise<UserProfile | null> {
  const doc = await docRef(userId).get();

  if (!doc.exists) {
    return null;
  }

  return fromDocument(doc.data()!);
}

export async function update(userId: string, fields: ProfileUpdate): Promise<UserProfile> {
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

  const current = fromDocument(existing.data()!);
  const updated: UserProfile = {
    ...current,
    ...fields,
    updatedAt: now,
  };

  await ref.update({ ...toDocument(updated) });
  return updated;
}
