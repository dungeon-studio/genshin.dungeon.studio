/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type {
  ArtifactMinorAffix,
  ArtifactSet,
  CircletMainAffix,
  GobletMainAffix,
  SandsMainAffix,
} from '@genshin/game-data';

/**
 * Artifact plan configuration for a team member.
 *
 * All fields are optional to support incremental planning. Users can fill in
 * whichever aspects they know (e.g. main stats only) and leave the rest for
 * later refinement or AI-assisted optimisation.
 *
 * Artifact sets reference IDs from @genshin/game-data.
 */
export interface ArtifactPlan {
  /** Desired main affix for Sands of Eon */
  sands?: SandsMainAffix;
  /** Desired main affix for Goblet of Eonothem */
  goblet?: GobletMainAffix;
  /** Desired main affix for Circlet of Logos */
  circlet?: CircletMainAffix;
  /** 1–2 artifact set IDs from game-data */
  sets?: [ArtifactSet['id']] | [ArtifactSet['id'], ArtifactSet['id']];
  /** 0–3 priority minor affixes to prioritize */
  priorityMinorAffixes?: ArtifactMinorAffix[];
  /** 0–3 secondary minor affixes (must be disjoint from priorityMinorAffixes) */
  secondaryMinorAffixes?: ArtifactMinorAffix[];
}

/**
 * Narrow a boundary array of set IDs into the 1–2 tuple {@link ArtifactPlan.sets}
 * requires. The Firestore document model, Collection+JSON wire format, and JSON
 * Schema all carry `sets` as a plain array; this is the single place the 1–2
 * length invariant is enforced when that array crosses into the domain model.
 * Throws {@link TypeError} for anything that is not an array of 1 or 2 strings.
 */
export function asArtifactSets(value: unknown): NonNullable<ArtifactPlan['sets']> {
  const ids: readonly unknown[] = Array.isArray(value) ? value : [];
  if (ids.length < 1 || ids.length > 2 || !ids.every((id) => typeof id === 'string')) {
    throw new TypeError(
      `artifactPlan.sets must be an array of 1-2 string IDs, got: ${JSON.stringify(value)}`,
    );
  }
  return ids.length === 1
    ? [ids[0] as ArtifactSet['id']]
    : [ids[0] as ArtifactSet['id'], ids[1] as ArtifactSet['id']];
}
