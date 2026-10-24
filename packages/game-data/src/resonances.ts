// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Element } from './elements.js';
import { RESONANCE_DATA } from './resonances.generated.js';

const RESONANCE_PARTY_SIZE = 4;

export const RESONANCE_TRIGGERS = {
  PAIR: 'PAIR',
  UNIQUE_ELEMENTS: 'UNIQUE_ELEMENTS',
} as const;

export type ResonanceTrigger = (typeof RESONANCE_TRIGGERS)[keyof typeof RESONANCE_TRIGGERS];

/**
 * Protective Canopy needs every element in the party to differ; each other
 * resonance needs one element twice.
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
 * The seven pair resonances and Protective Canopy.
 *
 * Keyed so a repeated ID is a `tsc` error (TS1117), not a silent overwrite.
 */
export const ELEMENTAL_RESONANCES: Readonly<Record<ResonanceId, ElementalResonance>> =
  RESONANCE_DATA;

/**
 * The resonances a party's elements activate, in any order.
 *
 * Resonance needs a full party of {@link RESONANCE_PARTY_SIZE}, so a smaller
 * one activates nothing.
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
