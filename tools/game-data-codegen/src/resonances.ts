// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Element, ResonanceCondition } from '@genshin/game-data';

import { serializeEntry, writeGeneratedModule } from './emit.js';
import { toId } from './slug.js';

/**
 * genshin-db has no resonance data, so this generator reads the game's own
 * tables from the AnimeGameData datamine instead.
 *
 * The repository carries no license. What it holds is extracted from the game
 * client, so the names and effect text are HoYoverse's, as genshin-db's are.
 * The generator fetches the two files it needs at a pinned commit and nothing
 * from the repository is vendored. Bumping `commit` and regenerating is how a
 * rebalance reaches `@genshin/game-data`.
 */
const ANIME_GAME_DATA = {
  repository: 'DimbreathBot/AnimeGameData',
  commit: '433284d22ef1a704e9d49ae22fb96cf7a245828e',
  resonances: 'ExcelBinOutput/TeamResonanceExcelConfigData.json',
  // The main `TextMapEN.json` doesn't carry resonance strings; the medium one does.
  textMap: 'TextMap/TextMap_MediumEN.json',
} as const;

/** The fields of one `TeamResonanceExcelConfigData` record this generator reads. */
export interface UpstreamResonance {
  teamResonanceId: number;
  cond: string;
  nameTextMapHash: number;
  descTextMapHash: number;
  [field: string]: unknown;
}

/** English strings keyed by the decimal text map hash. */
export type TextMap = Readonly<Record<string, string>>;

export interface GeneratedResonance {
  id: string;
  name: string;
  condition: ResonanceCondition;
  description: string;
}

/** Upstream's internal element names, as they prefix each `*AvatarCount` field. */
const ELEMENT_COUNT_FIELDS: Readonly<Record<string, Element>> = {
  fireAvatarCount: 'Pyro',
  waterAvatarCount: 'Hydro',
  windAvatarCount: 'Anemo',
  electricAvatarCount: 'Electro',
  grassAvatarCount: 'Dendro',
  iceAvatarCount: 'Cryo',
  rockAvatarCount: 'Geo',
};

const PAIR_COND = 'TEAM_RESONANCE_COND_NONE';
const UNIQUE_ELEMENTS_COND = 'TEAM_RESONANCE_COND_ALL_DIFFERENT';

function lookUp(textMap: TextMap, hash: number, what: string): string {
  const text = textMap[String(hash)];
  if (!text) throw new Error(`No English text for ${what} (hash ${hash})`);

  return text;
}

/**
 * Reads the trigger from the per-element avatar counts. A pair resonance
 * names exactly one element with a count of two; Protective Canopy names none
 * and keys off `cond` instead.
 */
function toCondition(record: UpstreamResonance, name: string): ResonanceCondition {
  const required = Object.entries(record).filter(
    ([field, value]) => field.endsWith('AvatarCount') && value !== 0,
  );

  const unmapped = required.filter(([field]) => !Object.hasOwn(ELEMENT_COUNT_FIELDS, field));
  if (unmapped.length > 0) {
    throw new Error(`Unmapped element count for "${name}": ${JSON.stringify(unmapped)}`);
  }

  if (record.cond === UNIQUE_ELEMENTS_COND && required.length === 0) {
    return { trigger: 'UNIQUE_ELEMENTS' };
  }

  const [pair] = required;
  if (record.cond === PAIR_COND && required.length === 1 && pair?.[1] === 2) {
    return { trigger: 'PAIR', element: ELEMENT_COUNT_FIELDS[pair[0]] };
  }

  throw new Error(
    `Unrecognised trigger for "${name}": cond ${record.cond}, counts ${JSON.stringify(required)}`,
  );
}

/**
 * Every element has one pair resonance and Protective Canopy covers the
 * all-different party. Anything else means upstream changed the game rule the
 * condition union encodes.
 */
function assertComplete(resonances: readonly GeneratedResonance[]): void {
  const pairs = resonances.flatMap(({ condition }) =>
    condition.trigger === 'PAIR' ? [condition.element] : [],
  );
  const unique = resonances.filter(({ condition }) => condition.trigger === 'UNIQUE_ELEMENTS');
  const elements = Object.values(ELEMENT_COUNT_FIELDS);

  const missing = elements.filter((element) => !pairs.includes(element));
  const repeated = pairs.filter((element, index) => pairs.indexOf(element) !== index);

  if (missing.length > 0 || repeated.length > 0 || unique.length !== 1) {
    throw new Error(
      `Expected one pair resonance per element and one all-different resonance; missing ${JSON.stringify(missing)}, repeated ${JSON.stringify(repeated)}, ${unique.length} all-different`,
    );
  }
}

/**
 * The resonance roster in upstream id order, without fetching or writing
 * anything.
 *
 * @throws Error naming the record that doesn't fit the condition union, or
 *   when the roster isn't one resonance per element plus Protective Canopy.
 */
export function buildResonances(
  records: readonly UpstreamResonance[],
  textMap: TextMap,
): GeneratedResonance[] {
  const resonances = [...records]
    .sort((a, b) => a.teamResonanceId - b.teamResonanceId)
    .map((record) => {
      const name = lookUp(textMap, record.nameTextMapHash, `resonance ${record.teamResonanceId}`);

      return {
        id: toId(name, 'resonance'),
        name,
        condition: toCondition(record, name),
        description: lookUp(textMap, record.descTextMapHash, `"${name}" description`),
      };
    });

  assertComplete(resonances);

  return resonances;
}

function rawUrl(path: string): string {
  return `https://raw.githubusercontent.com/${ANIME_GAME_DATA.repository}/${ANIME_GAME_DATA.commit}/${path}`;
}

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(rawUrl(path));
  if (!response.ok) throw new Error(`GET ${rawUrl(path)}: ${response.status}`);

  return response.json();
}

function serializeResonance({ id, name, condition, description }: GeneratedResonance): string {
  const trigger =
    condition.trigger === 'PAIR'
      ? `{ trigger: 'PAIR', element: '${condition.element}' }`
      : `{ trigger: 'UNIQUE_ELEMENTS' }`;

  return serializeEntry(id, [
    `name: ${JSON.stringify(name)},`,
    `condition: ${trigger},`,
    `description: ${JSON.stringify(description)},`,
  ]);
}

/**
 * Regenerate `@genshin/game-data`'s `resonances.generated.ts` from
 * AnimeGameData. Returns the number of resonances written.
 */
export async function generateResonances(): Promise<number> {
  const [records, textMap] = await Promise.all([
    fetchJson(ANIME_GAME_DATA.resonances),
    fetchJson(ANIME_GAME_DATA.textMap),
  ]);
  // Both files are upstream's own export format; buildResonances checks every
  // field it reads, so a shape change fails there rather than here.
  const resonances = buildResonances(records as UpstreamResonance[], textMap as TextMap);

  writeGeneratedModule({
    path: 'src/resonances.generated.ts',
    exportName: 'RESONANCE_DATA',
    command: 'resonances',
    entries: resonances.map(serializeResonance),
    provenance: [
      `Source: https://github.com/${ANIME_GAME_DATA.repository} at ${ANIME_GAME_DATA.commit}`,
      `  ${ANIME_GAME_DATA.resonances}`,
      `  ${ANIME_GAME_DATA.textMap}`,
      'Names and effect text are HoYoverse in-game English, extracted from the',
      'game client. Bump the commit in tools/game-data-codegen/src/resonances.ts',
      'to pick up a rebalance.',
    ],
  });

  return resonances.length;
}
