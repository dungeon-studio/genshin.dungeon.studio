// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { compareVersions, ELEMENTS } from '@genshin/game-data';
import type { Element, Rarity, WeaponType } from '@genshin/game-data';
import genshinDb from 'genshin-db';
import type { Character as DbCharacter } from 'genshin-db';

import { CHARACTER_RELEASE_DATES } from './character-release-dates.js';
import { serializeEntry, writeGeneratedModule } from './emit.js';
import { queryInEnglish } from './language.js';
import { createIdAssigner, toKebabCase, type IdAssigner } from './slug.js';
import { WEAPON_TYPE_BY_GENSHIN_DB } from './weapons.js';

/** genshin-db leaves `region` blank for characters with no established homeland. */
const UNKNOWN_REGION = 'Unknown';

/** Crossover characters. */
const EXCLUDED_IDS = new Set(['aloy']);

const ELEMENT_BY_GENSHIN_DB: Record<string, Element> = {
  ELEMENT_ANEMO: ELEMENTS.ANEMO,
  ELEMENT_CRYO: ELEMENTS.CRYO,
  ELEMENT_DENDRO: ELEMENTS.DENDRO,
  ELEMENT_ELECTRO: ELEMENTS.ELECTRO,
  ELEMENT_GEO: ELEMENTS.GEO,
  ELEMENT_HYDRO: ELEMENTS.HYDRO,
  ELEMENT_PYRO: ELEMENTS.PYRO,
};

export interface GeneratedCharacter {
  id: string;
  name: string;
  element: Element;
  weaponType: WeaponType;
  rarity: Rarity;
  region: string;
  version: string;
  releaseDate: string;
}

function isRosterMember(record: DbCharacter | undefined): record is DbCharacter {
  if (!record) return false;
  // `ELEMENT_NONE` is the Traveler and the Wonderland Manekins, who borrow an
  // element rather than having one to file them under.
  if (record.elementType === 'ELEMENT_NONE') return false;
  return !EXCLUDED_IDS.has(toKebabCase(record.name));
}

function toCharacter(record: DbCharacter, assignId: IdAssigner): GeneratedCharacter {
  const id = assignId(record.name);

  const element = ELEMENT_BY_GENSHIN_DB[record.elementType];
  if (!element) throw new Error(`Unknown element "${record.elementType}" for ${record.name}`);

  const weaponType = WEAPON_TYPE_BY_GENSHIN_DB[record.weaponType];
  if (!weaponType) {
    throw new Error(`Unknown weapon type "${record.weaponType}" for ${record.name}`);
  }

  const releaseDate = CHARACTER_RELEASE_DATES[id];
  if (!releaseDate) {
    throw new Error(
      `No release date for "${id}"; add the debut-banner date to CHARACTER_RELEASE_DATES`,
    );
  }

  return {
    id,
    name: record.name,
    element,
    weaponType,
    rarity: record.rarity,
    region: record.region || UNKNOWN_REGION,
    version: record.version,
    releaseDate,
  };
}

/** 5-star first, then newest version first; name breaks ties so output is stable. */
function byRosterOrder(a: GeneratedCharacter, b: GeneratedCharacter): number {
  return (
    b.rarity - a.rarity || compareVersions(b.version, a.version) || a.name.localeCompare(b.name)
  );
}

export function buildCharacters(): GeneratedCharacter[] {
  queryInEnglish();

  const assignId = createIdAssigner('character');

  return genshinDb
    .characters('names', { matchCategories: true })
    .map((name) => genshinDb.characters(name))
    .filter(isRosterMember)
    .map((record) => toCharacter(record, assignId))
    .sort(byRosterOrder);
}

function serializeCharacter(character: GeneratedCharacter): string {
  return serializeEntry([
    `id: '${character.id}',`,
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
