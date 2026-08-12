// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { findById } from './lookup.js';
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

/**
 * Weapons by ID.
 *
 * Keying by ID is what makes the IDs unique: a repeat is a duplicate property
 * in the generated object literal, which `tsc` rejects (TS1117).
 */
export const WEAPONS: Readonly<Record<WeaponId, Weapon>> = WEAPON_DATA;

/**
 * Weapons in display order: 5-star first, then newest version first.
 *
 * The generator writes the catalogue in that order and object keys keep their
 * insertion order, so this view cannot disagree with `WEAPONS` about which
 * weapons exist.
 */
export const WEAPON_ROSTER: readonly Weapon[] = Object.values(WEAPONS);

/**
 * Helper to find weapon by ID
 */
export function getWeaponById(id: string): Weapon | undefined {
  return findById(WEAPONS, id);
}

/**
 * Helper to filter weapons by type
 */
export function getWeaponsByType(type: WeaponType): Weapon[] {
  return WEAPON_ROSTER.filter((weapon) => weapon.type === type);
}

/**
 * Helper to filter weapons by rarity
 */
export function getWeaponsByRarity(rarity: Rarity): Weapon[] {
  return WEAPON_ROSTER.filter((weapon) => weapon.rarity === rarity);
}

/**
 * Helper to filter weapons by version
 */
export function getWeaponsByVersion(version: string): Weapon[] {
  return WEAPON_ROSTER.filter((weapon) => weapon.version === version);
}
