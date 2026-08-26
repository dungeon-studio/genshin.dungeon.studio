// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { ELEMENTS, WEAPON_STAT_TYPES } from '@genshin/game-data';
import type { Element, WeaponStatType, WeaponType } from '@genshin/game-data';

/**
 * Translation of the genshin-db enums into this project's vocabulary.
 *
 * One module owns every table because a genshin-db enum is rarely confined to
 * the roster it appears in: character and weapon records both carry
 * `weaponType`. Upstream adding a value none of these tables map is drift the
 * generators abort on rather than emit a record for.
 */

const ELEMENT_BY_GENSHIN_DB: Record<string, Element> = {
  ELEMENT_ANEMO: ELEMENTS.ANEMO,
  ELEMENT_CRYO: ELEMENTS.CRYO,
  ELEMENT_DENDRO: ELEMENTS.DENDRO,
  ELEMENT_ELECTRO: ELEMENTS.ELECTRO,
  ELEMENT_GEO: ELEMENTS.GEO,
  ELEMENT_HYDRO: ELEMENTS.HYDRO,
  ELEMENT_PYRO: ELEMENTS.PYRO,
};

const WEAPON_TYPE_BY_GENSHIN_DB: Record<string, WeaponType> = {
  WEAPON_SWORD_ONE_HAND: 'Sword',
  WEAPON_CLAYMORE: 'Claymore',
  WEAPON_POLE: 'Polearm',
  WEAPON_BOW: 'Bow',
  WEAPON_CATALYST: 'Catalyst',
};

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

/**
 * @throws Error naming the unmapped value, the kind of enum it belongs to, and
 * the record that carries it, which together say what upstream changed.
 */
function translate<T>(table: Record<string, T>, kind: string, value: string, subject: string): T {
  const mapped = table[value];
  if (!mapped) throw new Error(`Unknown ${kind} "${value}" for ${subject}`);

  return mapped;
}

/** @throws Error when genshin-db reports an element this project has no name for. */
export function toElement(value: string, subject: string): Element {
  return translate(ELEMENT_BY_GENSHIN_DB, 'element', value, subject);
}

/** @throws Error when genshin-db reports a weapon type this project has no name for. */
export function toWeaponType(value: string, subject: string): WeaponType {
  return translate(WEAPON_TYPE_BY_GENSHIN_DB, 'weapon type', value, subject);
}

/** @throws Error when genshin-db reports a sub-stat this project has no name for. */
export function toWeaponStatType(value: string, subject: string): WeaponStatType {
  return translate(SUB_STAT_BY_GENSHIN_DB, 'sub-stat', value, subject);
}
