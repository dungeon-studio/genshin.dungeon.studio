// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from './rarities.js';
import { WEAPON_DATA } from './weapons.generated.js';

/**
 * The five weapon classes, keyed for code and valued with the name players see.
 *
 * A character can only equip their own class, so this is what pairs a weapon
 * with a character.
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
 * What a weapon's secondary stat can be.
 *
 * Values are the game's display strings, which spell percentages as `ATK%`
 * where the artifact affix lists spell them `ATK Percentage`. The two
 * vocabularies don't compare.
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
 * The IDs this package currently ships, as a union.
 *
 * Derived from generated data, so regenerating narrows or widens it. An ID held
 * outside the type system, such as one read from storage, is checked with
 * `getWeaponById` rather than cast.
 */
export type WeaponId = keyof typeof WEAPON_DATA;

/**
 * One weapon as the game defines it, the same for every player.
 *
 * `CollectionWeapon` in `@genshin/domain` is the other half: a copy a
 * particular user owns, at a refinement they chose. Nothing a user can change
 * belongs here, which is why there is no refinement level.
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

/**
 * Looks a weapon up by ID, taking a plain string so a caller can hand over
 * stored or user input directly.
 *
 * `undefined` means the ID is outside this package's catalogue, which a weapon
 * the game has since added also produces. A caller rendering a saved
 * collection has to treat that as data it can't render yet rather than as
 * invalid input.
 */
export function getWeaponById(id: string): Weapon | undefined {
  return isWeaponId(id) ? WEAPONS[id] : undefined;
}
