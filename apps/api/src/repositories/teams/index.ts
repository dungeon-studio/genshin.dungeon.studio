// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam, ISOTimestamp, TeamSlot } from '@genshin/domain';

import { db } from '@/firebase/firestore.js';
import type { Page, PageRequest } from '@/http/page.js';
import { readPage } from '@/repositories/firestore/page.js';
import { readSnapshot } from '@/repositories/firestore/snapshot.js';

import { fromDocument, toDocument } from './document.js';
import { nextTeam, type TeamUpdates } from './merge.js';

function collectionRef(userId: string) {
  return db.collection('users').doc(userId).collection('teams');
}

function isSlotId(id: string): boolean {
  return /^[1-4]$/.test(id);
}

/**
 * One page of the teams the user has saved.
 *
 * Skips any document whose ID isn't a slot number, so a stray write under the
 * collection can't break a read. A page can then hold fewer teams than its
 * limit while another page remains.
 */
export async function list(userId: string, request: PageRequest): Promise<Page<CollectionTeam>> {
  const page = await readPage(collectionRef(userId), request, (doc) =>
    isSlotId(doc.id) ? fromDocument(Number(doc.id) as TeamSlot, doc.data()) : null,
  );

  return { ...page, items: page.items.filter((team) => team !== null) };
}

/**
 * Every team the user has saved, which is fewer than four until they've saved
 * all four, for checks that span every slot.
 */
export async function listAll(userId: string): Promise<CollectionTeam[]> {
  const snapshot = await collectionRef(userId).get();

  return snapshot.docs
    .filter((doc) => isSlotId(doc.id))
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

/**
 * Merges an update into a slot, reporting whether the record was new so the
 * route can answer 201 rather than 200.
 *
 * Reads then writes without a transaction, so two concurrent saves to one slot
 * resolve last-writer-wins rather than merging.
 */
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

/** Succeeds whether or not the slot was saved, so absence isn't reported. */
export async function remove(userId: string, slot: TeamSlot): Promise<void> {
  await collectionRef(userId).doc(String(slot)).delete();
}
