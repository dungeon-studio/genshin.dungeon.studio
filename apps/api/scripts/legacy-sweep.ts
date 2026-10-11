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

interface SweptRepository {
  readonly name: string;
  readonly currentVersion: number;
  /** Goes through the repository so the sweep counts and migrates as production does. */
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
 * Documents counted per repository name, keyed by stored version. `invalid`
 * counts the documents the repository can't read.
 */
type Census = Map<string, Map<number | 'invalid', number>>;

export interface SweepResult {
  census: Census;
  rewritten: number;
}

function tally(census: Census, repository: string, key: number | 'invalid'): void {
  const counts = census.get(repository) ?? new Map<number | 'invalid', number>();
  census.set(repository, counts.set(key, (counts.get(key) ?? 0) + 1));
}

/**
 * Skips a document written since the sweep read it: every repository write
 * stamps the current version, so it is already migrated.
 */
async function rewrite(snapshot: QueryDocumentSnapshot, migrated: DocumentData): Promise<boolean> {
  return db.runTransaction(async (transaction) => {
    const latest = await transaction.get(snapshot.ref);
    if (latest.updateTime?.isEqual(snapshot.updateTime) !== true) return false;

    transaction.set(snapshot.ref, migrated);
    return true;
  });
}

type ParseResult = { version: number; migrated: DocumentData } | 'invalid';

/**
 * Reports an unreadable document as invalid instead of throwing, so one bad
 * document can't hide the rest of the census.
 */
function parse(repository: SweptRepository, document: QueryDocumentSnapshot): ParseResult {
  const raw = document.data();
  const version = documentVersion(raw);
  if (version === null) return 'invalid';

  try {
    return { version, migrated: repository.migrate(document.id, raw) };
  } catch {
    return 'invalid';
  }
}

async function* storedDocuments(users: Iterable<DocumentReference>) {
  for (const user of users) {
    for (const repository of REPOSITORIES) {
      const snapshot = await user.collection(repository.name).get();
      yield* snapshot.docs.map((document) => ({ repository, document }));
    }
  }
}

/**
 * With `write`, also rewrites each legacy document at the current version.
 */
export async function sweep(
  users: Iterable<DocumentReference>,
  { write }: { write: boolean },
): Promise<SweepResult> {
  const result: SweepResult = { census: new Map(), rewritten: 0 };

  for await (const { repository, document } of storedDocuments(users)) {
    const outcome = parse(repository, document);
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
