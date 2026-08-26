// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import genshinDb from 'genshin-db';
import type { Character as DbCharacter } from 'genshin-db';

import { CHARACTER_RELEASE_DATES } from './character-release-dates.js';
import { serializeEntry, writeGeneratedModule } from './emit.js';
import { toElement, toWeaponType } from './genshin-db-enums.js';
import { queryInEnglish } from './language.js';
import { byVersionThenName } from './roster-order.js';
import { toId, toKebabCase } from './slug.js';

/** genshin-db leaves `region` blank for characters with no established homeland. */
const UNKNOWN_REGION = 'Unknown';

/** Crossover characters. */
const EXCLUDED_IDS = new Set(['aloy']);

/**
 * One record as it will be emitted.
 *
 * The consumer's `Character` with only `id` widened, rather than a second
 * declaration of the same shape kept in step by hand. The consumer narrows `id`
 * to the union of ids the last generation produced, which is the thing this
 * run replaces.
 */
export type GeneratedCharacter = Omit<Character, 'id'> & { id: string };

function isRosterMember(record: DbCharacter | undefined): record is DbCharacter {
  if (!record) return false;
  // `ELEMENT_NONE` is the Traveler and the Wonderland Manekins, who borrow an
  // element rather than having one to file them under.
  if (record.elementType === 'ELEMENT_NONE') return false;
  return !EXCLUDED_IDS.has(toKebabCase(record.name));
}

function toCharacter(record: DbCharacter): GeneratedCharacter {
  const id = toId(record.name, 'character');

  const releaseDate = CHARACTER_RELEASE_DATES[id];
  if (!releaseDate) {
    throw new Error(
      `No release date for "${id}"; add the debut-banner date to CHARACTER_RELEASE_DATES`,
    );
  }

  return {
    id,
    name: record.name,
    element: toElement(record.elementType, record.name),
    weaponType: toWeaponType(record.weaponType, record.name),
    rarity: record.rarity,
    region: record.region || UNKNOWN_REGION,
    version: record.version,
    releaseDate,
  };
}

function byRosterOrder(a: GeneratedCharacter, b: GeneratedCharacter): number {
  return b.rarity - a.rarity || byVersionThenName(a, b);
}

/**
 * The character roster in emission order, without writing anything.
 *
 * Split from `generateCharacters` so tests can assert on the records rather
 * than on a file. Aborts on a character absent from
 * {@link CHARACTER_RELEASE_DATES}, which is how a new debut is caught rather
 * than emitted with a missing date.
 *
 * @throws Error naming the character that couldn't be built.
 */
export function buildCharacters(): GeneratedCharacter[] {
  queryInEnglish();

  return genshinDb
    .characters('names', { matchCategories: true })
    .map((name) => genshinDb.characters(name))
    .filter(isRosterMember)
    .map(toCharacter)
    .sort(byRosterOrder);
}

function serializeCharacter(character: GeneratedCharacter): string {
  return serializeEntry(character.id, [
    `name: ${JSON.stringify(character.name)},`,
    `element: '${character.element}',`,
    `weaponType: '${character.weaponType}',`,
    `rarity: ${character.rarity},`,
    `region: ${JSON.stringify(character.region)},`,
    `version: '${character.version}',`,
    `releaseDate: '${character.releaseDate}',`,
  ]);
}

/**
 * Regenerate `@genshin/game-data`'s `characters.generated.ts` from genshin-db.
 * Returns the number of characters written.
 */
export function generateCharacters(): number {
  const characters = buildCharacters();

  writeGeneratedModule({
    path: 'src/characters.generated.ts',
    exportName: 'CHARACTER_DATA',
    command: 'characters',
    entries: characters.map(serializeCharacter),
  });

  return characters.length;
}
