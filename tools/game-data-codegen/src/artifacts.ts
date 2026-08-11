// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { compareVersions } from '@genshin/game-data';
import genshinDb from 'genshin-db';
import type { Artifact as DbArtifact } from 'genshin-db';

import { serializeEntry, writeGeneratedModule } from './emit.js';
import { queryInEnglish } from './language.js';
import { createIdAssigner, type IdAssigner } from './slug.js';

/** Only sets with 5-star pieces are tracked; the rest are leveling fodder. */
const ENDGAME_RARITY = 5;

export interface GeneratedArtifactSet {
  id: string;
  name: string;
  version: string;
  bonuses: Record<2 | 4, string>;
}

function isEndgameSet(record: DbArtifact | undefined): record is DbArtifact {
  return record?.rarityList.includes(ENDGAME_RARITY) ?? false;
}

function toArtifactSet(record: DbArtifact, assignId: IdAssigner): GeneratedArtifactSet {
  // Only the single-piece circlet sets carry one bonus, and they cap at
  // 4 stars, so a 5-star set missing either is upstream drift.
  if (!record.effect2Pc || !record.effect4Pc) {
    throw new Error(`Artifact set "${record.name}" is missing a 2- or 4-piece bonus`);
  }

  return {
    id: assignId(record.name),
    name: record.name,
    version: record.version,
    bonuses: { 2: record.effect2Pc, 4: record.effect4Pc },
  };
}

/** Newest first; names break ties so regeneration stays deterministic. */
function byRosterOrder(a: GeneratedArtifactSet, b: GeneratedArtifactSet): number {
  return compareVersions(b.version, a.version) || a.name.localeCompare(b.name);
}

export function buildArtifactSets(): GeneratedArtifactSet[] {
  queryInEnglish();

  const assignId = createIdAssigner('artifact set');

  return genshinDb
    .artifacts('names', { matchCategories: true })
    .map((name) => genshinDb.artifacts(name))
    .filter(isEndgameSet)
    .map((record) => toArtifactSet(record, assignId))
    .sort(byRosterOrder);
}

function serializeArtifactSet(set: GeneratedArtifactSet): string {
  return serializeEntry([
    `id: '${set.id}',`,
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
