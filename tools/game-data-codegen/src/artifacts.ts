// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ArtifactSet } from '@genshin/game-data';
import genshinDb from 'genshin-db';
import type { Artifact as DbArtifact } from 'genshin-db';

import { serializeEntry, writeGeneratedModule } from './emit.js';
import { queryInEnglish } from './language.js';
import { byVersionThenName } from './roster-order.js';
import { toId } from './slug.js';

/** Only sets with 5-star pieces are tracked; the rest are leveling fodder. */
const ENDGAME_RARITY = 5;

/**
 * One record as it will be emitted.
 *
 * The consumer's `ArtifactSet` with only `id` widened, rather than a second
 * declaration of the same shape kept in step by hand. The consumer narrows `id`
 * to the union of ids the last generation produced, which is the thing this
 * run replaces.
 */
export type GeneratedArtifactSet = Omit<ArtifactSet, 'id'> & { id: string };

function isEndgameSet(record: DbArtifact | undefined): record is DbArtifact {
  return record?.rarityList.includes(ENDGAME_RARITY) ?? false;
}

function toArtifactSet(record: DbArtifact): GeneratedArtifactSet {
  // Only the single-piece circlet sets carry one bonus, and they cap at
  // 4 stars, so a 5-star set missing either is upstream drift.
  if (!record.effect2Pc || !record.effect4Pc) {
    throw new Error(`Artifact set "${record.name}" is missing a 2- or 4-piece bonus`);
  }

  return {
    id: toId(record.name, 'artifact set'),
    name: record.name,
    version: record.version,
    bonuses: { 2: record.effect2Pc, 4: record.effect4Pc },
  };
}

/**
 * The artifact roster in emission order, without writing anything.
 *
 * Split from `generateArtifactSets` so tests can assert on the records rather
 * than on a file. Aborts on upstream drift, such as a 5-star set missing a
 * bonus, rather than emitting a partial record.
 *
 * @throws Error naming the set that couldn't be built.
 */
export function buildArtifactSets(): GeneratedArtifactSet[] {
  queryInEnglish();

  return genshinDb
    .artifacts('names', { matchCategories: true })
    .map((name) => genshinDb.artifacts(name))
    .filter(isEndgameSet)
    .map(toArtifactSet)
    .sort(byVersionThenName);
}

function serializeArtifactSet(set: GeneratedArtifactSet): string {
  return serializeEntry(set.id, [
    `name: ${JSON.stringify(set.name)},`,
    `version: '${set.version}',`,
    'bonuses: {',
    `  2: ${JSON.stringify(set.bonuses[2])},`,
    `  4: ${JSON.stringify(set.bonuses[4])},`,
    '},',
  ]);
}

/**
 * Regenerate `@genshin/game-data`'s `artifacts.generated.ts` from genshin-db.
 * Returns the number of artifact sets written.
 */
export function generateArtifactSets(): number {
  const sets = buildArtifactSets();

  writeGeneratedModule({
    path: 'src/artifacts.generated.ts',
    exportName: 'ARTIFACT_SET_DATA',
    command: 'artifacts',
    entries: sets.map(serializeArtifactSet),
  });

  return sets.length;
}
