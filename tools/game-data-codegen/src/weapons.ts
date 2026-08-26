// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity, WeaponStatType, WeaponType } from '@genshin/game-data';
import genshinDb from 'genshin-db';
import type { Weapon as DbWeapon } from 'genshin-db';

import { serializeEntry, writeGeneratedModule } from './emit.js';
import { toWeaponStatType, toWeaponType } from './genshin-db-enums.js';
import { queryInEnglish } from './language.js';
import { byVersionThenName } from './roster-order.js';
import { toId } from './slug.js';

/** Lowest rarity included in the roster; 1–3 star weapons are fodder for team building. */
const MINIMUM_RARITY = 4;

/**
 * One record on its way to being emitted, which is not the consumer's `Weapon`.
 *
 * `passive` is one object here and two flat fields once serialised, so unlike
 * the character and artifact shapes this one can't be the consumer's type with
 * `id` widened. It has to be kept in step with `Weapon` by hand.
 */
export interface GeneratedWeapon {
  id: string;
  name: string;
  type: WeaponType;
  rarity: Rarity;
  baseATK: number;
  version: string;
  subStat?: { type: WeaponStatType; value: number };
  passive?: { name: string; description: string };
}

function isRosterMember(record: DbWeapon | undefined): record is DbWeapon {
  if (!record) return false;
  // `dupealias` marks non-obtainable duplicates (e.g. Prized Isshin Blade).
  if (record.dupealias) return false;
  return record.rarity >= MINIMUM_RARITY;
}

function toWeapon(record: DbWeapon): GeneratedWeapon {
  const weapon: GeneratedWeapon = {
    id: toId(record.name, 'weapon'),
    name: record.name,
    type: toWeaponType(record.weaponType, record.name),
    rarity: record.rarity,
    baseATK: Math.round(record.baseAtkValue),
    version: record.version,
  };

  if (record.mainStatType && record.baseStatText) {
    // `baseStatText` is the in-game display, e.g. "9.6%" (percent) or "36" (flat EM).
    weapon.subStat = {
      type: toWeaponStatType(record.mainStatType, record.name),
      value: parseFloat(record.baseStatText),
    };
  }

  if (record.effectName && record.r1?.description) {
    weapon.passive = { name: record.effectName, description: record.r1.description };
  }

  return weapon;
}

function byRosterOrder(a: GeneratedWeapon, b: GeneratedWeapon): number {
  return b.rarity - a.rarity || byVersionThenName(a, b);
}

/**
 * The weapon roster in emission order, without writing anything.
 *
 * Split from `generateWeapons` so tests can assert on the records rather than
 * on a file. Aborts on upstream drift, such as a stat this tool has no mapping
 * for, rather than emitting a partial record.
 *
 * @throws Error naming the weapon that couldn't be built.
 */
export function buildWeapons(): GeneratedWeapon[] {
  queryInEnglish();

  return genshinDb
    .weapons('names', { matchCategories: true })
    .map((name) => genshinDb.weapons(name))
    .filter(isRosterMember)
    .map(toWeapon)
    .sort(byRosterOrder);
}

function serializeWeapon(weapon: GeneratedWeapon): string {
  const fields = [
    `name: ${JSON.stringify(weapon.name)},`,
    `type: '${weapon.type}',`,
    `rarity: ${weapon.rarity},`,
    `baseATK: ${weapon.baseATK},`,
    `version: '${weapon.version}',`,
  ];

  if (weapon.subStat) {
    fields.push(
      'subStat: {',
      `  type: ${JSON.stringify(weapon.subStat.type)},`,
      `  value: ${weapon.subStat.value},`,
      '},',
    );
  }

  if (weapon.passive) {
    fields.push(
      `passiveName: ${JSON.stringify(weapon.passive.name)},`,
      `passiveDescription: ${JSON.stringify(weapon.passive.description)},`,
    );
  }

  return serializeEntry(weapon.id, fields);
}

/**
 * Regenerate `@genshin/game-data`'s `weapons.generated.ts` from genshin-db.
 * Returns the number of weapons written.
 */
export function generateWeapons(): number {
  const weapons = buildWeapons();

  writeGeneratedModule({
    path: 'src/weapons.generated.ts',
    exportName: 'WEAPON_DATA',
    command: 'weapons',
    entries: weapons.map(serializeWeapon),
  });

  return weapons.length;
}
