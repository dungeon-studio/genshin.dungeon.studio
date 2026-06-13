// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

import { compareVersions } from '@genshin/game-data';
import type { Rarity, WeaponType } from '@genshin/game-data';
import gdb from 'genshin-db';

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

const MARKER = /\/\/ BEGIN GENERATED WEAPONS[\s\S]*?\/\/ END GENERATED WEAPONS/;

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
  gdb.setOptions({ queryLanguages: [gdb.Language.English], resultLanguage: gdb.Language.English });

  const names = gdb.weapons('names', { matchCategories: true });
  const weapons: GeneratedWeapon[] = [];

  for (const name of names) {
    const record = gdb.weapons(name);
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

/** Locates `weapons.ts` in the installed `@genshin/game-data` workspace package. */
function resolveWeaponsSource(): string {
  const require = createRequire(import.meta.url);
  const packageJson = require.resolve('@genshin/game-data/package.json');
  return resolve(dirname(packageJson), 'src/weapons.ts');
}

/**
 * Regenerate the `WEAPONS` array in `@genshin/game-data` from genshin-db.
 * Returns the number of weapons written.
 */
export function generateWeapons(): number {
  const weapons = buildWeapons();

  const block = [
    '// BEGIN GENERATED WEAPONS — regenerate with: pnpm --filter @genshin/game-data-codegen generate weapons',
    'export const WEAPONS: Weapon[] = [',
    weapons.map(serializeWeapon).join('\n'),
    '];',
    '// END GENERATED WEAPONS',
  ].join('\n');

  const weaponsPath = resolveWeaponsSource();
  const source = readFileSync(weaponsPath, 'utf8');
  if (!MARKER.test(source)) {
    throw new Error('GENERATED WEAPONS markers not found in weapons.ts');
  }

  writeFileSync(weaponsPath, source.replace(MARKER, block));
  return weapons.length;
}
