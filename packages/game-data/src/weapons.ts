// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from './rarities.js';

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

/**
 * Weapon data
 * Currently contains starter set of popular weapons (16 of ~220)
 * See #145 for automated parser to expand to complete weapon roster
 * Sorted by rarity (5-star first), then by version descending (newest first)
 */
export const WEAPONS: Weapon[] = [
  // 5-Star Swords
  {
    id: 'mistsplitter-reforged',
    name: 'Mistsplitter Reforged',
    type: 'Sword',
    rarity: 5,
    baseATK: 48,
    version: '2.0',
    subStat: {
      type: WEAPON_STAT_TYPES.CRIT_DMG,
      value: 9.6,
    },
    passiveName: "Mistsplitter's Edge",
    passiveDescription: "Gain Elemental DMG Bonus based on Mistsplitter's Emblem stacks",
  },
  {
    id: 'primordial-jade-cutter',
    name: 'Primordial Jade Cutter',
    type: 'Sword',
    rarity: 5,
    baseATK: 44,
    version: '1.3',
    subStat: {
      type: WEAPON_STAT_TYPES.CRIT_RATE,
      value: 9.6,
    },
    passiveName: "Protector's Virtue",
    passiveDescription: 'HP increased by 20%. Additionally, provides an ATK Bonus based on HP.',
  },
  // 5-Star Claymores
  {
    id: 'wolfs-gravestone',
    name: "Wolf's Gravestone",
    type: 'Claymore',
    rarity: 5,
    baseATK: 46,
    version: '1.0',
    subStat: {
      type: WEAPON_STAT_TYPES.ATK_PERCENT,
      value: 10.8,
    },
    passiveName: 'Wolfish Tracker',
    passiveDescription:
      "Increases ATK. On hit, attacks against opponents with less than 30% HP increase all party members' ATK.",
  },
  // 5-Star Polearms
  {
    id: 'engulfing-lightning',
    name: 'Engulfing Lightning',
    type: 'Polearm',
    rarity: 5,
    baseATK: 46,
    version: '2.1',
    subStat: {
      type: WEAPON_STAT_TYPES.ENERGY_RECHARGE,
      value: 12.0,
    },
    passiveName: 'Timeless Dream: Eternal Stove',
    passiveDescription:
      'ATK increased based on Energy Recharge. Gain Energy Recharge after using Elemental Burst.',
  },
  {
    id: 'staff-of-homa',
    name: 'Staff of Homa',
    type: 'Polearm',
    rarity: 5,
    baseATK: 46,
    version: '1.3',
    subStat: {
      type: WEAPON_STAT_TYPES.CRIT_DMG,
      value: 14.4,
    },
    passiveName: 'Reckless Cinnabar',
    passiveDescription: 'HP increased. Additionally, provides an ATK Bonus based on Max HP.',
  },
  // 5-Star Bows
  {
    id: 'thundering-pulse',
    name: 'Thundering Pulse',
    type: 'Bow',
    rarity: 5,
    baseATK: 46,
    version: '2.0',
    subStat: {
      type: WEAPON_STAT_TYPES.CRIT_DMG,
      value: 14.4,
    },
    passiveName: 'Rule by Thunder',
    passiveDescription:
      'Increases ATK and grants Thunder Emblem stacks for Normal Attack DMG bonus.',
  },
  // 5-Star Catalysts
  {
    id: 'lost-prayer-to-the-sacred-winds',
    name: 'Lost Prayer to the Sacred Winds',
    type: 'Catalyst',
    rarity: 5,
    baseATK: 46,
    version: '1.0',
    subStat: {
      type: WEAPON_STAT_TYPES.CRIT_RATE,
      value: 7.2,
    },
    passiveName: 'Boundless Blessing',
    passiveDescription: 'Increases Movement SPD. Gains Elemental DMG Bonus every 4s.',
  },
  // 4-Star Swords
  {
    id: 'the-flute',
    name: 'The Flute',
    type: 'Sword',
    rarity: 4,
    baseATK: 42,
    version: '1.0',
    subStat: {
      type: WEAPON_STAT_TYPES.ATK_PERCENT,
      value: 9.0,
    },
    passiveName: 'Chord',
    passiveDescription:
      'Normal or Charged Attacks grant Harmonic. After 5 Harmonics, deal AoE DMG.',
  },
  {
    id: 'sacrificial-sword',
    name: 'Sacrificial Sword',
    type: 'Sword',
    rarity: 4,
    baseATK: 41,
    version: '1.0',
    subStat: {
      type: WEAPON_STAT_TYPES.ENERGY_RECHARGE,
      value: 13.3,
    },
    passiveName: 'Composed',
    passiveDescription:
      'After dealing damage with an Elemental Skill, has a chance to end its own CD.',
  },
  // 4-Star Claymores
  {
    id: 'prototype-archaic',
    name: 'Prototype Archaic',
    type: 'Claymore',
    rarity: 4,
    baseATK: 44,
    version: '1.0',
    subStat: {
      type: WEAPON_STAT_TYPES.ATK_PERCENT,
      value: 6.0,
    },
    passiveName: 'Crush',
    passiveDescription: 'Normal or Charged Attacks have a chance to deal additional AoE DMG.',
  },
  // 4-Star Polearms
  {
    id: 'the-catch',
    name: 'The Catch',
    type: 'Polearm',
    rarity: 4,
    baseATK: 42,
    version: '2.1',
    subStat: {
      type: WEAPON_STAT_TYPES.ENERGY_RECHARGE,
      value: 10.0,
    },
    passiveName: 'Shanty',
    passiveDescription: 'Increases Elemental Burst CRIT Rate and DMG.',
  },
  {
    id: 'dragons-bane',
    name: "Dragon's Bane",
    type: 'Polearm',
    rarity: 4,
    baseATK: 41,
    version: '1.0',
    subStat: {
      type: WEAPON_STAT_TYPES.ELEMENTAL_MASTERY,
      value: 48,
    },
    passiveName: 'Bane of Flame and Water',
    passiveDescription: 'Increases DMG against opponents affected by Hydro or Pyro.',
  },
  // 4-Star Bows
  {
    id: 'stringless',
    name: 'The Stringless',
    type: 'Bow',
    rarity: 4,
    baseATK: 42,
    version: '1.0',
    subStat: {
      type: WEAPON_STAT_TYPES.ELEMENTAL_MASTERY,
      value: 36,
    },
    passiveName: 'Arrowless Song',
    passiveDescription: 'Increases Elemental Skill and Elemental Burst DMG.',
  },
  // 4-Star Catalysts
  {
    id: 'the-widsith',
    name: 'The Widsith',
    type: 'Catalyst',
    rarity: 4,
    baseATK: 42,
    version: '1.0',
    subStat: {
      type: WEAPON_STAT_TYPES.CRIT_DMG,
      value: 12.0,
    },
    passiveName: 'Debut',
    passiveDescription: 'When a character takes the field, gain a random theme song buff.',
  },
  {
    id: 'favonius-codex',
    name: 'Favonius Codex',
    type: 'Catalyst',
    rarity: 4,
    baseATK: 42,
    version: '1.0',
    subStat: {
      type: WEAPON_STAT_TYPES.ENERGY_RECHARGE,
      value: 10.0,
    },
    passiveName: 'Windfall',
    passiveDescription: 'CRIT hits have a chance to generate Elemental Particles.',
  },
];

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
