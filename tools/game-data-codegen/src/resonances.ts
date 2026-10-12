// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

import { ELEMENTAL_RESONANCES, ELEMENTS, RESONANCE_TRIGGERS } from '@genshin/game-data';
import type { Element, ElementalResonance, ResonanceCondition } from '@genshin/game-data';

import { resolveGeneratedPath, serializeEntry, writeGeneratedModule } from './emit.js';
import { toId } from './slug.js';

/**
 * genshin-db has no resonance data, so this generator reads the game's own
 * tables from the AnimeGameData datamine.
 *
 * The repository carries no license. Its content is extracted from the game
 * client, so the text is HoYoverse's, as genshin-db's is, and nothing from the
 * repository is vendored.
 */
const ANIME_GAME_DATA = {
  repository: 'DimbreathBot/AnimeGameData',
  resonances: 'ExcelBinOutput/TeamResonanceExcelConfigData.json',
  // The main `TextMapEN.json` doesn't carry resonance strings; the medium one does.
  textMap: 'TextMap/TextMap_MediumEN.json',
} as const;

const RESONANCES_MODULE = 'src/resonances.generated.ts';

const SOURCE_PREFIX = `https://github.com/${ANIME_GAME_DATA.repository}/tree/`;

/**
 * The generated module's header names the commit it was built from, which
 * makes the module its own pin: the commit moves only when the data does.
 */
function pinnedCommit(): string {
  const module = readFileSync(resolveGeneratedPath(RESONANCES_MODULE), 'utf8');
  const commit = new RegExp(`${SOURCE_PREFIX}([0-9a-f]{40})`).exec(module)?.[1];
  if (!commit) {
    throw new Error(`${RESONANCES_MODULE} names no ${ANIME_GAME_DATA.repository} commit`);
  }

  return commit;
}

/**
 * The fields of one `TeamResonanceExcelConfigData` record this generator reads.
 *
 * Upstream omits a field holding its default, so an absent `cond` is
 * {@link PAIR_COND} and an absent element count is zero.
 */
export interface UpstreamResonance {
  teamResonanceId: number;
  cond?: string;
  nameTextMapHash: number;
  descTextMapHash: number;
  [field: string]: unknown;
}

/** English strings keyed by the decimal text map hash. */
export type TextMap = Readonly<Record<string, unknown>>;

type GeneratedResonance = Omit<ElementalResonance, 'id'> & { id: string };

/** Upstream's count fields use internal element names, such as `grass` for Dendro. */
const ELEMENT_BY_COUNT_FIELD: ReadonlyMap<string, Element> = new Map([
  ['fireAvatarCount', ELEMENTS.PYRO],
  ['waterAvatarCount', ELEMENTS.HYDRO],
  ['windAvatarCount', ELEMENTS.ANEMO],
  ['electricAvatarCount', ELEMENTS.ELECTRO],
  ['grassAvatarCount', ELEMENTS.DENDRO],
  ['iceAvatarCount', ELEMENTS.CRYO],
  ['rockAvatarCount', ELEMENTS.GEO],
]);

const PAIR_COND = 'TEAM_RESONANCE_COND_NONE';
const UNIQUE_ELEMENTS_COND = 'TEAM_RESONANCE_COND_ALL_DIFFERENT';

function isUpstreamResonance(value: unknown): value is UpstreamResonance {
  return (
    typeof value === 'object' &&
    value !== null &&
    'teamResonanceId' in value &&
    typeof value.teamResonanceId === 'number' &&
    (!('cond' in value) || typeof value.cond === 'string') &&
    'nameTextMapHash' in value &&
    typeof value.nameTextMapHash === 'number' &&
    'descTextMapHash' in value &&
    typeof value.descTextMapHash === 'number'
  );
}

function isTextMap(value: unknown): value is TextMap {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function lookUp(textMap: TextMap, hash: number, what: string): string {
  const text = textMap[String(hash)];
  if (typeof text !== 'string' || !text) {
    throw new Error(`No English text for ${what} (hash ${hash})`);
  }

  return text;
}

/**
 * Upstream gives a pair resonance one element count of two and Protective
 * Canopy no counts, marking it through `cond` instead.
 */
function toCondition(record: UpstreamResonance, name: string): ResonanceCondition {
  const counts = Object.entries(record).filter(
    ([field, count]) => field.endsWith('AvatarCount') && count !== 0,
  );

  const unmapped = counts.filter(([field]) => !ELEMENT_BY_COUNT_FIELD.has(field));
  if (unmapped.length > 0) {
    throw new Error(`Unmapped element count for "${name}": ${JSON.stringify(unmapped)}`);
  }

  const cond = record.cond ?? PAIR_COND;

  if (cond === UNIQUE_ELEMENTS_COND && counts.length === 0) {
    return { trigger: RESONANCE_TRIGGERS.UNIQUE_ELEMENTS };
  }

  const pair = cond === PAIR_COND && counts.length === 1 ? counts[0] : undefined;
  const element = pair?.[1] === 2 ? ELEMENT_BY_COUNT_FIELD.get(pair[0]) : undefined;
  if (element) return { trigger: RESONANCE_TRIGGERS.PAIR, element };

  throw new Error(
    `Unrecognised trigger for "${name}": cond ${cond}, counts ${JSON.stringify(counts)}`,
  );
}

/**
 * Each element has one pair resonance, and Protective Canopy covers the
 * all-different party. Anything else means the game changed a rule the
 * condition union encodes.
 */
function assertComplete(resonances: readonly GeneratedResonance[]): void {
  const pairs = resonances.flatMap(({ condition }) =>
    condition.trigger === RESONANCE_TRIGGERS.PAIR ? [condition.element] : [],
  );
  const unique = resonances.filter(
    ({ condition }) => condition.trigger === RESONANCE_TRIGGERS.UNIQUE_ELEMENTS,
  );

  const missing = Object.values(ELEMENTS).filter((element) => !pairs.includes(element));
  const repeated = pairs.filter((element, index) => pairs.indexOf(element) !== index);

  if (missing.length > 0 || repeated.length > 0 || unique.length !== 1) {
    throw new Error(
      `Expected one pair resonance per element and one all-different resonance; missing ${JSON.stringify(missing)}, repeated ${JSON.stringify(repeated)}, ${unique.length} all-different`,
    );
  }
}

/**
 * The resonance roster in upstream id order, built from upstream's parsed JSON
 * without fetching, so tests run offline.
 *
 * @throws Error when upstream has reshaped either file, a record lacks English
 *   text or fits no condition, or the roster isn't one resonance per element
 *   plus Protective Canopy.
 */
export function buildResonances(records: unknown, textMap: unknown): GeneratedResonance[] {
  if (!Array.isArray(records) || !records.every(isUpstreamResonance)) {
    throw new Error(`${ANIME_GAME_DATA.resonances} no longer holds records in a known shape`);
  }
  if (!isTextMap(textMap)) {
    throw new Error(`${ANIME_GAME_DATA.textMap} is no longer a hash-to-text object`);
  }

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

async function fetchJson(commit: string, path: string): Promise<unknown> {
  const url = `https://raw.githubusercontent.com/${ANIME_GAME_DATA.repository}/${commit}/${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetching ${url} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function serializeResonance({ id, name, condition, description }: GeneratedResonance): string {
  const trigger =
    condition.trigger === RESONANCE_TRIGGERS.PAIR
      ? `{ trigger: '${condition.trigger}', element: '${condition.element}' }`
      : `{ trigger: '${condition.trigger}' }`;

  return serializeEntry(id, [
    `name: ${JSON.stringify(name)},`,
    `condition: ${trigger},`,
    `description: ${JSON.stringify(description)},`,
  ]);
}

/**
 * Regenerate `@genshin/game-data`'s `resonances.generated.ts` from
 * AnimeGameData at `commit`, defaulting to the pinned one.
 *
 * Records matching the shipped ones leave the module, and so the pin,
 * untouched, which keeps a commit that changes nothing out of review.
 *
 * @throws Error when a fetch fails or upstream has reshaped either file.
 */
export async function generateResonances(
  commit: string = pinnedCommit(),
): Promise<{ count: number; written: boolean }> {
  const [records, textMap] = await Promise.all([
    fetchJson(commit, ANIME_GAME_DATA.resonances),
    fetchJson(commit, ANIME_GAME_DATA.textMap),
  ]);
  const resonances = buildResonances(records, textMap);

  if (isDeepStrictEqual(resonances, Object.values(ELEMENTAL_RESONANCES))) {
    return { count: resonances.length, written: false };
  }

  writeGeneratedModule({
    path: RESONANCES_MODULE,
    exportName: 'RESONANCE_DATA',
    command: 'resonances',
    entries: resonances.map(serializeResonance),
    upstream: { source: `${SOURCE_PREFIX}${commit}` },
  });

  return { count: resonances.length, written: true };
}
