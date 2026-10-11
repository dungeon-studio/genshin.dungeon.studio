// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { TeamSlot, UUID } from '@genshin/domain';
import type {
  DocumentData,
  DocumentReference,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';

import { db } from '../src/firebase/firestore.js';
import * as characters from '../src/repositories/characters/document.js';
import { documentVersion } from '../src/repositories/schema-version.js';
import * as teams from '../src/repositories/teams/document.js';
import * as weapons from '../src/repositories/weapons/document.js';

type RepositoryName = 'characters' | 'teams' | 'weapons';

interface SweptRepository {
  readonly name: RepositoryName;
  readonly currentVersion: number;
  /** Re-encodes a stored document at the current version, through the repository's own read and write. */
  readonly migrate: (documentId: string, raw: Record<string, unknown>) => DocumentData;
}

const REPOSITORIES: readonly SweptRepository[] = [
  {
    name: 'characters',
    currentVersion: characters.CURRENT_VERSION,
    migrate: (id, raw) => characters.toDocument(characters.fromDocument(id, raw)),
  },
  {
    name: 'teams',
    currentVersion: teams.CURRENT_VERSION,
    migrate: (id, raw) => teams.toDocument(teams.fromDocument(Number(id) as TeamSlot, raw)),
  },
  {
    name: 'weapons',
    currentVersion: weapons.CURRENT_VERSION,
    migrate: (id, raw) => weapons.toDocument(weapons.fromDocument(id as UUID, raw)),
  },
];

/**
 * Documents counted per repository, keyed by the version they were stored at.
 * `invalid` counts the documents no known version accepts.
 */
type Census = Record<RepositoryName, Map<number | 'invalid', number>>;

export interface SweepResult {
  census: Census;
  /** Legacy documents rewritten at the current version. */
  rewritten: number;
}

export function emptyResult(): SweepResult {
  return {
    census: { characters: new Map(), teams: new Map(), weapons: new Map() },
    rewritten: 0,
  };
}

function tally(census: Census, repository: RepositoryName, key: number | 'invalid'): void {
  const counts = census[repository];
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

/**
 * Rewrites a legacy document unless something wrote it after the sweep read it.
 *
 * Every repository write stamps the current version, so a document that moved
 * on is already migrated and overwriting it would discard that write.
 */
async function rewrite(snapshot: QueryDocumentSnapshot, migrated: DocumentData): Promise<boolean> {
  return db.runTransaction(async (transaction) => {
    const latest = await transaction.get(snapshot.ref);
    if (latest.updateTime?.isEqual(snapshot.updateTime) !== true) return false;

    transaction.set(snapshot.ref, migrated);
    return true;
  });
}

/**
 * Reads every versioned document under one user through its repository,
 * counting each by the version it was stored at, and with `write` rewrites the
 * legacy ones at the current version.
 *
 * A document that fails to read is counted as invalid rather than stopping the
 * sweep, so one bad document can't hide the rest of the census.
 */
export async function sweepUser(
  user: DocumentReference,
  { write }: { write: boolean },
  result: SweepResult,
): Promise<void> {
  for (const repository of REPOSITORIES) {
    const snapshot = await user.collection(repository.name).get();

    for (const document of snapshot.docs) {
      const raw = document.data();
      let migrated: DocumentData;
      try {
        migrated = repository.migrate(document.id, raw);
      } catch {
        tally(result.census, repository.name, 'invalid');
        continue;
      }

      // A document that parsed has a version: routing rejected any without one.
      const version = documentVersion(raw) ?? repository.currentVersion;
      tally(result.census, repository.name, version);

      if (write && version < repository.currentVersion && (await rewrite(document, migrated))) {
        result.rewritten += 1;
      }
    }
  }
}

/** Sweeps every user in the database. */
export async function sweep(options: { write: boolean }): Promise<SweepResult> {
  const result = emptyResult();
  // listDocuments, unlike a query, includes users whose own document was never
  // written but whose subcollections were.
  for (const user of await db.collection('users').listDocuments()) {
    await sweepUser(user, options, result);
  }
  return result;
}
