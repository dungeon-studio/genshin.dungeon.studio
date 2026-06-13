// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Regenerate `src/weapons.ts` from the offline `genshin-db` dataset.
 *
 * genshin-db is a generation-time input only: this script reads its bundled
 * records and rewrites the `WEAPONS` array between the GENERATED markers in
 * `weapons.ts`. The committed output stays static TypeScript, so the app never
 * depends on genshin-db at runtime.
 *
 * Run with: pnpm --filter @genshin/game-data generate:weapons
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import gdb from 'genshin-db';

import type { Rarity } from '../src/rarities.js';
import { compareVersions } from '../src/versions.js';
import type { WeaponType } from '../src/weapons.js';

/** Lowest rarity included in the roster; 1–2 star fodder is irrelevant to team building. */
const MINIMUM_RARITY = 3;

const WEAPON_TYPE_BY_GENSHIN_DB: Record<string, WeaponType> = {
  WEAPON_SWORD_ONE_HAND: 'Sword',
  WEAPON_CLAYMORE: 'Claymore',
  WEAPON_POLE: 'Polearm',
  WEAPON_BOW: 'Bow',
  WEAPON_CATALYST: 'Catalyst',
};

/** Maps genshin-db `mainStatType` enums to `WEAPON_STAT_TYPES` member names. */
const STAT_TYPE_KEY_BY_GENSHIN_DB: Record<string, string> = {
  FIGHT_PROP_ATTACK_PERCENT: 'ATK_PERCENT',
  FIGHT_PROP_CRITICAL: 'CRIT_RATE',
  FIGHT_PROP_CRITICAL_HURT: 'CRIT_DMG',
  FIGHT_PROP_CHARGE_EFFICIENCY: 'ENERGY_RECHARGE',
  FIGHT_PROP_ELEMENT_MASTERY: 'ELEMENTAL_MASTERY',
  FIGHT_PROP_PHYSICAL_ADD_HURT: 'PHYSICAL_DMG',
  FIGHT_PROP_HP_PERCENT: 'HP_PERCENT',
  FIGHT_PROP_DEFENSE_PERCENT: 'DEF_PERCENT',
};

interface GeneratedWeapon {
  id: string;
  name: string;
  type: WeaponType;
  rarity: Rarity;
  baseATK: number;
  version: string;
  subStatTypeKey?: string;
  subStatValue?: number;
  passiveName?: string;
  passiveDescription?: string;
}

function toKebabCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildWeapons(): GeneratedWeapon[] {
  gdb.setOptions({ queryLanguages: ['English'], resultLanguage: 'English' });

  const names = gdb.weapons('names', { matchCategories: true });
  const weapons: GeneratedWeapon[] = [];

  for (const name of names) {
    const record = gdb.weapon(name);
    // `dupealias` marks non-obtainable duplicates (e.g. Prized Isshin Blade).
    if (!record || record.dupealias || record.rarity < MINIMUM_RARITY) continue;

    const type = WEAPON_TYPE_BY_GENSHIN_DB[record.weaponType];
    if (!type) throw new Error(`Unknown weapon type "${record.weaponType}" for ${record.name}`);

    const weapon: GeneratedWeapon = {
      id: toKebabCase(record.name),
      name: record.name,
      type,
      rarity: record.rarity as Rarity,
      baseATK: Math.round(record.baseAtkValue),
      version: record.version,
    };

    if (record.mainStatType && record.baseStatText) {
      const subStatTypeKey = STAT_TYPE_KEY_BY_GENSHIN_DB[record.mainStatType];
      if (!subStatTypeKey) {
        throw new Error(`Unknown sub-stat "${record.mainStatType}" for ${record.name}`);
      }
      weapon.subStatTypeKey = subStatTypeKey;
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

  if (weapon.subStatTypeKey && weapon.subStatValue !== undefined) {
    lines.push(
      '    subStat: {',
      `      type: WEAPON_STAT_TYPES.${weapon.subStatTypeKey},`,
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

function main(): void {
  const weapons = buildWeapons();

  const block = [
    '// BEGIN GENERATED WEAPONS — regenerate with: pnpm --filter @genshin/game-data generate:weapons',
    'export const WEAPONS: Weapon[] = [',
    weapons.map(serializeWeapon).join('\n'),
    '];',
    '// END GENERATED WEAPONS',
  ].join('\n');

  const weaponsPath = resolve(dirname(fileURLToPath(import.meta.url)), '../src/weapons.ts');
  const source = readFileSync(weaponsPath, 'utf8');
  const marker = /\/\/ BEGIN GENERATED WEAPONS[\s\S]*?\/\/ END GENERATED WEAPONS/;
  if (!marker.test(source)) {
    throw new Error('GENERATED WEAPONS markers not found in weapons.ts');
  }

  writeFileSync(weaponsPath, source.replace(marker, block));
  console.log(`Generated ${weapons.length} weapons into src/weapons.ts`);
}

main();
