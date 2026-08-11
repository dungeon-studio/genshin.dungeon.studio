// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { compareVersions, WEAPON_STAT_TYPES } from '@genshin/game-data';
import type { Rarity, WeaponStatType, WeaponType } from '@genshin/game-data';
import genshinDb from 'genshin-db';

import { writeGeneratedModule } from './emit.js';
import { queryInEnglish } from './language.js';
import { createIdAssigner } from './slug.js';

/** Lowest rarity included in the roster; 1–3 star weapons are fodder for team building. */
const MINIMUM_RARITY = 4;

const WEAPON_TYPE_BY_GENSHIN_DB: Record<string, WeaponType> = {
  WEAPON_SWORD_ONE_HAND: 'Sword',
  WEAPON_CLAYMORE: 'Claymore',
  WEAPON_POLE: 'Polearm',
  WEAPON_BOW: 'Bow',
  WEAPON_CATALYST: 'Catalyst',
};

/** Maps genshin-db `mainStatType` enums to `WeaponStatType` values. */
const SUB_STAT_BY_GENSHIN_DB: Record<string, WeaponStatType> = {
  FIGHT_PROP_ATTACK_PERCENT: WEAPON_STAT_TYPES.ATK_PERCENT,
  FIGHT_PROP_CRITICAL: WEAPON_STAT_TYPES.CRIT_RATE,
  FIGHT_PROP_CRITICAL_HURT: WEAPON_STAT_TYPES.CRIT_DMG,
  FIGHT_PROP_CHARGE_EFFICIENCY: WEAPON_STAT_TYPES.ENERGY_RECHARGE,
  FIGHT_PROP_ELEMENT_MASTERY: WEAPON_STAT_TYPES.ELEMENTAL_MASTERY,
  FIGHT_PROP_PHYSICAL_ADD_HURT: WEAPON_STAT_TYPES.PHYSICAL_DMG,
  FIGHT_PROP_HP_PERCENT: WEAPON_STAT_TYPES.HP_PERCENT,
  FIGHT_PROP_DEFENSE_PERCENT: WEAPON_STAT_TYPES.DEF_PERCENT,
};

export interface GeneratedWeapon {
  id: string;
  name: string;
  type: WeaponType;
  rarity: Rarity;
  baseATK: number;
  version: string;
  subStatType?: WeaponStatType;
  subStatValue?: number;
  passiveName?: string;
  passiveDescription?: string;
}

export function buildWeapons(): GeneratedWeapon[] {
  queryInEnglish();

  const assignId = createIdAssigner('weapon');
  const names = genshinDb.weapons('names', { matchCategories: true });
  const weapons: GeneratedWeapon[] = [];

  for (const name of names) {
    const record = genshinDb.weapons(name);
    // `dupealias` marks non-obtainable duplicates (e.g. Prized Isshin Blade).
    if (!record || record.dupealias || record.rarity < MINIMUM_RARITY) continue;

    const type = WEAPON_TYPE_BY_GENSHIN_DB[record.weaponType];
    if (!type) throw new Error(`Unknown weapon type "${record.weaponType}" for ${record.name}`);

    const weapon: GeneratedWeapon = {
      id: assignId(record.name),
      name: record.name,
      type,
      rarity: record.rarity,
      baseATK: Math.round(record.baseAtkValue),
      version: record.version,
    };

    if (record.mainStatType && record.baseStatText) {
      const subStatType = SUB_STAT_BY_GENSHIN_DB[record.mainStatType];
      if (!subStatType) {
        throw new Error(`Unknown sub-stat "${record.mainStatType}" for ${record.name}`);
      }
      weapon.subStatType = subStatType;
      // `baseStatText` is the in-game display, e.g. "9.6%" (percent) or "36" (flat EM).
      weapon.subStatValue = parseFloat(record.baseStatText);
    }

    if (record.effectName && record.r1?.description) {
      weapon.passiveName = record.effectName;
      weapon.passiveDescription = record.r1.description;
    }

    weapons.push(weapon);
  }

  // 5-star first, then version descending (newest first), then name for stability.
  weapons.sort(
    (a, b) =>
      b.rarity - a.rarity || compareVersions(b.version, a.version) || a.name.localeCompare(b.name),
  );

  return weapons;
}

function serializeWeapon(weapon: GeneratedWeapon): string {
  const lines = [
    '  {',
    `    id: '${weapon.id}',`,
    `    name: ${JSON.stringify(weapon.name)},`,
    `    type: '${weapon.type}',`,
    `    rarity: ${weapon.rarity},`,
    `    baseATK: ${weapon.baseATK},`,
    `    version: '${weapon.version}',`,
  ];

  if (weapon.subStatType && weapon.subStatValue !== undefined) {
    lines.push(
      '    subStat: {',
      `      type: ${JSON.stringify(weapon.subStatType)},`,
      `      value: ${weapon.subStatValue},`,
      '    },',
    );
  }

  if (weapon.passiveName) lines.push(`    passiveName: ${JSON.stringify(weapon.passiveName)},`);
  if (weapon.passiveDescription) {
    lines.push(`    passiveDescription: ${JSON.stringify(weapon.passiveDescription)},`);
  }

  lines.push('  },');
  return lines.join('\n');
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
