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

type ReadResult = { version: number; migrated: DocumentData } | 'invalid';

/**
 * Reads a stored document through its repository.
 *
 * A document that fails to read is reported invalid rather than thrown, so one
 * bad document can't hide the rest of the census.
 */
function read(repository: SweptRepository, document: QueryDocumentSnapshot): ReadResult {
  const raw = document.data();
  const version = documentVersion(raw);
  if (version === null) return 'invalid';

  try {
    return { version, migrated: repository.migrate(document.id, raw) };
  } catch {
    return 'invalid';
  }
}

/** Every versioned document under the given users, paired with its repository. */
async function* storedDocuments(users: Iterable<DocumentReference>) {
  for (const user of users) {
    for (const repository of REPOSITORIES) {
      const snapshot = await user.collection(repository.name).get();
      yield* snapshot.docs.map((document) => ({ repository, document }));
    }
  }
}

/**
 * Reads every versioned document under the given users through its repository,
 * counting each by the version it was stored at, and with `write` rewrites the
 * legacy ones at the current version.
 */
export async function sweep(
  users: Iterable<DocumentReference>,
  { write }: { write: boolean },
): Promise<SweepResult> {
  const result: SweepResult = {
    census: { characters: new Map(), teams: new Map(), weapons: new Map() },
    rewritten: 0,
  };

  for await (const { repository, document } of storedDocuments(users)) {
    const outcome = read(repository, document);
    if (outcome === 'invalid') {
      tally(result.census, repository.name, 'invalid');
      continue;
    }

    tally(result.census, repository.name, outcome.version);
    const legacy = outcome.version < repository.currentVersion;
    if (write && legacy && (await rewrite(document, outcome.migrated))) result.rewritten += 1;
  }

  return result;
}
