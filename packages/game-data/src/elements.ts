// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Genshin Impact element types
 */
export const ELEMENTS = {
  PYRO: 'Pyro',
  HYDRO: 'Hydro',
  ANEMO: 'Anemo',
  ELECTRO: 'Electro',
  DENDRO: 'Dendro',
  CRYO: 'Cryo',
  GEO: 'Geo',
} as const;

export type Element = (typeof ELEMENTS)[keyof typeof ELEMENTS];

/**
 * Elemental reaction type categories
 */
export const REACTION_TYPES = {
  AMPLIFYING: 'AMPLIFYING',
  TRANSFORMATIVE: 'TRANSFORMATIVE',
  ADDITIVE: 'ADDITIVE',
  DENDRO_CORE: 'DENDRO_CORE',
  STATUS: 'STATUS',
  LUNAR: 'LUNAR',
} as const;

export type ReactionType = (typeof REACTION_TYPES)[keyof typeof REACTION_TYPES];

/**
 * Elemental reaction definitions
 *
 * MAINTENANCE NOTE: Update this file when new reactions are added to the game.
 * Last updated: Version 5.1 (added Lunar reactions)
 * Reference: https://genshin-impact.fandom.com/wiki/Elemental_Reaction
 */
interface ReactionInfo {
  type: ReactionType;
  elements?: Element[];
  note?: string;
  requirement?: string;
  version: string; // Release version when reaction was introduced or significantly changed
}

export const ELEMENT_REACTION_TYPES: Record<string, ReactionInfo> = {
  // Amplifying Reactions (damage multipliers) - version 1.0
  VAPORIZE: {
    type: REACTION_TYPES.AMPLIFYING,
    elements: [ELEMENTS.PYRO, ELEMENTS.HYDRO],
    version: '1.0',
  },
  MELT: {
    type: REACTION_TYPES.AMPLIFYING,
    elements: [ELEMENTS.PYRO, ELEMENTS.CRYO],
    version: '1.0',
  },

  // Transformative Reactions (fixed damage + EM scaling) - version 1.0 base
  OVERLOADED: {
    type: REACTION_TYPES.TRANSFORMATIVE,
    elements: [ELEMENTS.PYRO, ELEMENTS.ELECTRO],
    version: '1.0',
  },
  SUPERCONDUCT: {
    type: REACTION_TYPES.TRANSFORMATIVE,
    elements: [ELEMENTS.CRYO, ELEMENTS.ELECTRO],
    version: '1.0',
  },
  ELECTROCHARGED: {
    type: REACTION_TYPES.TRANSFORMATIVE,
    elements: [ELEMENTS.HYDRO, ELEMENTS.ELECTRO],
    version: '1.0',
  },
  SHATTER: {
    type: REACTION_TYPES.TRANSFORMATIVE,
    note: 'Triggered by hitting Frozen',
    version: '1.0',
  },
  SWIRL: { type: REACTION_TYPES.TRANSFORMATIVE, elements: [ELEMENTS.ANEMO], version: '1.0' },
  BURNING: {
    type: REACTION_TYPES.TRANSFORMATIVE,
    elements: [ELEMENTS.PYRO, ELEMENTS.DENDRO],
    version: '3.0',
  },

  // Additive Reactions (flat damage bonus to triggering attack) - version 3.0
  AGGRAVATE: {
    type: REACTION_TYPES.ADDITIVE,
    elements: [ELEMENTS.ELECTRO, ELEMENTS.DENDRO],
    version: '3.0',
  },
  SPREAD: {
    type: REACTION_TYPES.ADDITIVE,
    elements: [ELEMENTS.DENDRO, ELEMENTS.ELECTRO],
    version: '3.0',
  },

  // Dendro Core Reactions (create Dendro Cores that burst) - version 3.0
  BLOOM: {
    type: REACTION_TYPES.DENDRO_CORE,
    elements: [ELEMENTS.HYDRO, ELEMENTS.DENDRO],
    version: '3.0',
  },
  HYPERBLOOM: {
    type: REACTION_TYPES.DENDRO_CORE,
    elements: [ELEMENTS.ELECTRO],
    requirement: 'Bloom active',
    version: '3.0',
  },
  BURGEON: {
    type: REACTION_TYPES.DENDRO_CORE,
    elements: [ELEMENTS.PYRO],
    requirement: 'Bloom active',
    version: '3.0',
  },

  // Special/Status Reactions - version 1.0
  FROZEN: {
    type: REACTION_TYPES.STATUS,
    elements: [ELEMENTS.HYDRO, ELEMENTS.CRYO],
    version: '1.0',
  },
  CRYSTALLIZE: { type: REACTION_TYPES.STATUS, elements: [ELEMENTS.GEO], version: '1.0' },

  // Lunar Reactions (version 5.1+ content, Fontaine region) - version 5.1
  LUNAR_CHARGED: {
    type: REACTION_TYPES.LUNAR,
    elements: [ELEMENTS.HYDRO, ELEMENTS.ELECTRO],
    note: 'Enhanced Electro-Charged with bonus scaling',
    version: '5.1',
  },
  LUNAR_BLOOM: {
    type: REACTION_TYPES.LUNAR,
    elements: [ELEMENTS.HYDRO, ELEMENTS.DENDRO],
    note: 'Enhanced Bloom variant',
    version: '5.1',
  },
  LUNAR_CRYSTALLIZE: {
    type: REACTION_TYPES.LUNAR,
    elements: [ELEMENTS.GEO, ELEMENTS.HYDRO],
    note: 'Enhanced Crystallize with Moondrifts',
    version: '5.1',
  },
} as const;

/**
 * Helper to get all reactions for a specific version
 */
export function getReactionsByVersion(version: string): Record<string, ReactionInfo> {
  return Object.fromEntries(
    Object.entries(ELEMENT_REACTION_TYPES).filter(([, reaction]) => reaction.version === version),
  );
}
