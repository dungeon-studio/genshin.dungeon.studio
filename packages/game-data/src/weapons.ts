// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from './rarities.js';
import { WEAPONS } from './weapons.generated.js';

/**
 * Weapon types
 */
export const WEAPON_TYPES = {
  SWORD: 'Sword',
  CLAYMORE: 'Claymore',
  POLEARM: 'Polearm',
  BOW: 'Bow',
  CATALYST: 'Catalyst',
} as const;

export type WeaponType = (typeof WEAPON_TYPES)[keyof typeof WEAPON_TYPES];

/**
 * Weapon stat types
 */
export const WEAPON_STAT_TYPES = {
  ATK_PERCENT: 'ATK%',
  CRIT_RATE: 'CRIT Rate',
  CRIT_DMG: 'CRIT DMG',
  ENERGY_RECHARGE: 'Energy Recharge',
  ELEMENTAL_MASTERY: 'Elemental Mastery',
  PHYSICAL_DMG: 'Physical DMG Bonus',
  HP_PERCENT: 'HP%',
  DEF_PERCENT: 'DEF%',
} as const;

export type WeaponStatType = (typeof WEAPON_STAT_TYPES)[keyof typeof WEAPON_STAT_TYPES];

/**
 * Weapon definition
 */
export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  rarity: Rarity;
  baseATK: number;
  version: string; // Release version (e.g., "1.0", "2.1", "4.3")
  subStat?: {
    type: WeaponStatType;
    value: number;
  };
  passiveName?: string;
  passiveDescription?: string;
}

export { WEAPONS };

const WEAPONS_BY_ID = new Map(WEAPONS.map((w) => [w.id, w]));

/**
 * Helper to find weapon by ID
 */
export function getWeaponById(id: string): Weapon | undefined {
  return WEAPONS_BY_ID.get(id);
}

/**
 * Helper to filter weapons by type
 */
export function getWeaponsByType(type: WeaponType): Weapon[] {
  return WEAPONS.filter((weapon) => weapon.type === type);
}

/**
 * Helper to filter weapons by rarity
 */
export function getWeaponsByRarity(rarity: Rarity): Weapon[] {
  return WEAPONS.filter((weapon) => weapon.rarity === rarity);
}

/**
 * Helper to filter weapons by version
 */
export function getWeaponsByVersion(version: string): Weapon[] {
  return WEAPONS.filter((weapon) => weapon.version === version);
}
