// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { compareVersions } from '@genshin/game-data';
import genshinDb from 'genshin-db';

import { writeGeneratedModule } from './emit.js';
import { queryInEnglish } from './language.js';
import { createIdAssigner } from './slug.js';

/** Only sets with 5-star pieces are tracked; the rest are levelling fodder. */
const ENDGAME_RARITY = 5;

export interface GeneratedArtifactSet {
  id: string;
  name: string;
  version: string;
  bonuses: Record<2 | 4, string>;
}

export function buildArtifactSets(): GeneratedArtifactSet[] {
  queryInEnglish();

  const assignId = createIdAssigner('artifact set');
  const names = genshinDb.artifacts('names', { matchCategories: true });
  const sets: GeneratedArtifactSet[] = [];

  for (const name of names) {
    const record = genshinDb.artifacts(name);
    if (!record?.rarityList.includes(ENDGAME_RARITY)) continue;

    // The single-piece circlet sets (Prayers for Illumination and friends) cap
    // at 4 stars, so anything here without both bonuses is upstream drift.
    if (!record.effect2Pc || !record.effect4Pc) {
      throw new Error(`Artifact set "${record.name}" is missing a 2- or 4-piece bonus`);
    }

    sets.push({
      id: assignId(record.name),
      name: record.name,
      version: record.version,
      bonuses: { 2: record.effect2Pc, 4: record.effect4Pc },
    });
  }

  // Version descending (newest first), then name for stability.
  sets.sort((a, b) => compareVersions(b.version, a.version) || a.name.localeCompare(b.name));

  return sets;
}

function serializeArtifactSet(set: GeneratedArtifactSet): string {
  return [
    '  {',
    `    id: '${set.id}',`,
    `    name: ${JSON.stringify(set.name)},`,
    `    version: '${set.version}',`,
    '    bonuses: {',
    `      2: ${JSON.stringify(set.bonuses[2])},`,
    `      4: ${JSON.stringify(set.bonuses[4])},`,
    '    },',
    '  },',
  ].join('\n');
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
