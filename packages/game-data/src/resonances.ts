// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Element } from './elements.js';

/**
 * Party size at which elemental resonance activates. Resonance is inert in an
 * incomplete party no matter how the elements line up.
 */
const RESONANCE_PARTY_SIZE = 4;

/**
 * How a resonance's element requirement is expressed
 */
export const RESONANCE_TRIGGERS = {
  PAIR: 'PAIR',
  UNIQUE_ELEMENTS: 'UNIQUE_ELEMENTS',
} as const;

export type ResonanceTrigger = (typeof RESONANCE_TRIGGERS)[keyof typeof RESONANCE_TRIGGERS];

export type ResonanceCondition =
  | { trigger: typeof RESONANCE_TRIGGERS.PAIR; element: Element }
  | { trigger: typeof RESONANCE_TRIGGERS.UNIQUE_ELEMENTS };

export interface ElementalResonance {
  name: string;
  condition: ResonanceCondition;
  description: string;
}

/**
 * Elemental resonance definitions
 *
 * MAINTENANCE NOTE: Update this file when resonance effects are rebalanced.
 * Reference: https://genshin-impact.fandom.com/wiki/Elemental_Resonance
 */
export const ELEMENTAL_RESONANCES = {
  FERVENT_FLAMES: {
    name: 'Fervent Flames',
    condition: { trigger: RESONANCE_TRIGGERS.PAIR, element: 'Pyro' },
    description: 'ATK +25%. Affected by Cryo for 40% less time.',
  },
  SOOTHING_WATER: {
    name: 'Soothing Water',
    condition: { trigger: RESONANCE_TRIGGERS.PAIR, element: 'Hydro' },
    description: 'HP +25%. Affected by Pyro for 40% less time.',
  },
  HIGH_VOLTAGE: {
    name: 'High Voltage',
    condition: { trigger: RESONANCE_TRIGGERS.PAIR, element: 'Electro' },
    description:
      'Superconduct, Overloaded, Electro-Charged, Quicken, Hyperbloom, and Aggravate generate an Electro Particle, once every 5s. Affected by Hydro for 40% less time.',
  },
  SHATTERING_ICE: {
    name: 'Shattering Ice',
    condition: { trigger: RESONANCE_TRIGGERS.PAIR, element: 'Cryo' },
    description:
      'CRIT Rate +15% against enemies that are Frozen or affected by Cryo. Affected by Electro for 40% less time.',
  },
  IMPETUOUS_WINDS: {
    name: 'Impetuous Winds',
    condition: { trigger: RESONANCE_TRIGGERS.PAIR, element: 'Anemo' },
    description: 'Stamina consumption −15%. Movement SPD +10%. Skill CD −5%.',
  },
  ENDURING_ROCK: {
    name: 'Enduring Rock',
    condition: { trigger: RESONANCE_TRIGGERS.PAIR, element: 'Geo' },
    description:
      'Shield strength +15%. While shielded, DMG +15% and hitting an enemy reduces its Geo RES by 20% for 15s.',
  },
  SPRAWLING_GREENERY: {
    name: 'Sprawling Greenery',
    condition: { trigger: RESONANCE_TRIGGERS.PAIR, element: 'Dendro' },
    description:
      'EM +50. Triggering Burning, Quicken, or Bloom grants a further +30 EM; triggering Aggravate, Spread, Hyperbloom, or Burgeon grants +20 EM. Each lasts 6s and stacks with the others.',
  },
  PROTECTIVE_CANOPY: {
    name: 'Protective Canopy',
    condition: { trigger: RESONANCE_TRIGGERS.UNIQUE_ELEMENTS },
    description: 'All Elemental RES +15%. Physical RES +15%.',
  },
} as const satisfies Record<string, ElementalResonance>;

/**
 * Resonances active for a party's elements
 *
 * Elements may repeat and arrive in any order; a party short of
 * {@link RESONANCE_PARTY_SIZE} members resonates with nothing.
 */
export function getActiveResonances(elements: Element[]): ElementalResonance[] {
  if (elements.length !== RESONANCE_PARTY_SIZE) return [];

  const counts = new Map<Element, number>();
  for (const element of elements) {
    counts.set(element, (counts.get(element) ?? 0) + 1);
  }

  return Object.values(ELEMENTAL_RESONANCES).filter((resonance) =>
    resonance.condition.trigger === RESONANCE_TRIGGERS.PAIR
      ? (counts.get(resonance.condition.element) ?? 0) >= 2
      : counts.size === RESONANCE_PARTY_SIZE,
  );
}
