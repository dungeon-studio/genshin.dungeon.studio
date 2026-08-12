// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { ARTIFACT_SET_DATA } from './artifacts.generated.js';
import { findById } from './lookup.js';

/**
 * Artifact set piece types
 */
export const ARTIFACT_PIECES = {
  FLOWER: 'Flower of Life',
  PLUME: 'Plume of Death',
  SANDS: 'Sands of Eon',
  GOBLET: 'Goblet of Eonothem',
  CIRCLET: 'Circlet of Logos',
} as const;

export type ArtifactPiece = (typeof ARTIFACT_PIECES)[keyof typeof ARTIFACT_PIECES];

type ArtifactSetId = keyof typeof ARTIFACT_SET_DATA;

/**
 * Artifact set definition
 *
 * This is a straight inventory of game data only.
 * Analysis (stat recommendations, playstyle pairings, etc.) is deferred to
 * higher-level application logic and planning layers.
 *
 * FUTURE: Consider adding obsolescedBy field to track when newer sets replace older ones.
 */
export interface ArtifactSet {
  id: ArtifactSetId;
  name: string;
  version: string; // Release version (e.g., "1.0", "3.0", "4.3")
  bonuses: Record<2 | 4, string>; // 2-piece and 4-piece bonus descriptions
}

/**
 * Artifact sets with 5-star pieces, by ID.
 *
 * Lower-rarity sets are leveling fodder, so they never enter the catalogue.
 * Keying by ID is what makes the IDs unique: a repeat is a duplicate property
 * in the generated object literal, which `tsc` rejects (TS1117).
 */
export const ARTIFACT_SETS: Readonly<Record<ArtifactSetId, ArtifactSet>> = ARTIFACT_SET_DATA;

/**
 * Artifact sets in display order: newest release first.
 *
 * The generator writes the catalogue in that order and object keys keep their
 * insertion order, so this view cannot disagree with `ARTIFACT_SETS` about
 * which sets exist.
 */
export const ARTIFACT_SET_ROSTER: readonly ArtifactSet[] = Object.values(ARTIFACT_SETS);

/**
 * Valid main affixes for Sands of Eon
 */
export const SANDS_MAIN_AFFIXES = [
  'HP Percentage',
  'ATK Percentage',
  'DEF Percentage',
  'Elemental Mastery',
  'Energy Recharge',
] as const;

export type SandsMainAffix = (typeof SANDS_MAIN_AFFIXES)[number];

/**
 * Valid main affixes for Goblet of Eonothem
 */
export const GOBLET_MAIN_AFFIXES = [
  'HP Percentage',
  'ATK Percentage',
  'DEF Percentage',
  'Elemental Mastery',
  'Pyro DMG Bonus',
  'Hydro DMG Bonus',
  'Electro DMG Bonus',
  'Cryo DMG Bonus',
  'Geo DMG Bonus',
  'Anemo DMG Bonus',
  'Dendro DMG Bonus',
  'Physical DMG Bonus',
] as const;

export type GobletMainAffix = (typeof GOBLET_MAIN_AFFIXES)[number];

/**
 * Valid main affixes for Circlet of Logos
 */
export const CIRCLET_MAIN_AFFIXES = [
  'HP Percentage',
  'ATK Percentage',
  'DEF Percentage',
  'Elemental Mastery',
  'CRIT Rate',
  'CRIT DMG',
  'Healing Bonus',
] as const;

export type CircletMainAffix = (typeof CIRCLET_MAIN_AFFIXES)[number];

/**
 * Valid artifact minor affixes
 */
export const ARTIFACT_MINOR_AFFIXES = [
  'HP',
  'HP Percentage',
  'ATK',
  'ATK Percentage',
  'DEF',
  'DEF Percentage',
  'Elemental Mastery',
  'Energy Recharge',
  'CRIT Rate',
  'CRIT DMG',
] as const;

export type ArtifactMinorAffix = (typeof ARTIFACT_MINOR_AFFIXES)[number];

/**
 * Union of all artifact main affix types
 */
export type ArtifactMainAffix = SandsMainAffix | GobletMainAffix | CircletMainAffix;

/**
 * Helper to find artifact set by ID
 */
export function getArtifactSetById(id: string): ArtifactSet | undefined {
  return findById(ARTIFACT_SETS, id);
}

/**
 * Helper to filter artifact sets by version
 */
export function getArtifactSetsByVersion(version: string): ArtifactSet[] {
  return ARTIFACT_SET_ROSTER.filter((set) => set.version === version);
}
