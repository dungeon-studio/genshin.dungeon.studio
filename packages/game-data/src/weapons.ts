// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from './rarities.js';
import { WEAPON_DATA } from './weapons.generated.js';

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

export type WeaponId = keyof typeof WEAPON_DATA;

/**
 * Weapon definition
 */
export interface Weapon {
  id: WeaponId;
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

/** Keyed so a repeated ID is a `tsc` error (TS1117), not a silent overwrite. */
export const WEAPONS: Readonly<Record<WeaponId, Weapon>> = WEAPON_DATA;

/** Display order, as the generator writes it: 5-star first, newest version first. */
export const WEAPON_ROSTER: readonly Weapon[] = Object.values(WEAPONS);

/** `hasOwn`, not a bare index: `constructor` and friends sit on every object's prototype. */
function isWeaponId(id: string): id is WeaponId {
  return Object.hasOwn(WEAPONS, id);
}

export function getWeaponById(id: string): Weapon | undefined {
  return isWeaponId(id) ? WEAPONS[id] : undefined;
}
