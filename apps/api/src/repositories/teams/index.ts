// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam, ISOTimestamp, TeamSlot } from '@genshin/domain';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { db } from '@/firebase/firestore.js';
import { readPage, type Page, type PageRequest } from '@/repositories/firestore/page.js';
import { readSnapshot } from '@/repositories/firestore/snapshot.js';

import { fromDocument, toDocument } from './document.js';
import { nextTeam, type TeamUpdates } from './merge.js';

function collectionRef(userId: string) {
  return db.collection('users').doc(userId).collection('teams');
}

/**
 * Reads a stored team, or `null` for a document whose ID isn't a slot number,
 * so a stray write under the collection can't break a read.
 */
function readTeam(doc: QueryDocumentSnapshot): CollectionTeam | null {
  return /^[1-4]$/.test(doc.id) ? fromDocument(Number(doc.id) as TeamSlot, doc.data()) : null;
}

/**
 * One page of the user's saved teams, for a list response; see `listAll` for
 * checks across every slot.
 *
 * Skipping stray documents can leave a page short of its limit while another
 * page remains.
 */
export async function list(userId: string, request: PageRequest): Promise<Page<CollectionTeam>> {
  const page = await readPage(collectionRef(userId), request, readTeam);

  return { ...page, items: page.items.filter((team) => team !== null) };
}

/** Every saved team, unpaged, for checks that span all four slots. */
export async function listAll(userId: string): Promise<CollectionTeam[]> {
  const snapshot = await collectionRef(userId).get();

  return snapshot.docs.map(readTeam).filter((team) => team !== null);
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
