// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Element } from './elements.js';
import { RESONANCE_DATA } from './resonances.generated.js';

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

/**
 * A discriminated union rather than an optional element, because Protective
 * Canopy keys off distinct-element count while the others key off a
 * duplicated element.
 */
export type ResonanceCondition =
  | { trigger: typeof RESONANCE_TRIGGERS.PAIR; element: Element }
  | { trigger: typeof RESONANCE_TRIGGERS.UNIQUE_ELEMENTS };

export type ResonanceId = keyof typeof RESONANCE_DATA;

export interface ElementalResonance {
  id: ResonanceId;
  name: string;
  condition: ResonanceCondition;
  /** The in-game effect text. */
  description: string;
}

/**
 * The seven pair resonances and Protective Canopy, generated from the game's
 * own tables. Keyed so a repeated ID is a `tsc` error (TS1117), not a silent
 * overwrite.
 */
export const ELEMENTAL_RESONANCES: Readonly<Record<ResonanceId, ElementalResonance>> =
  RESONANCE_DATA;

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
