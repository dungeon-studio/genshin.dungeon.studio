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
  /** Primary artifact set: a 4-piece, or the first half of a 2+2 split */
  primarySetId?: ArtifactSet['id'];
  /** Second 2-piece set for a 2+2 split; only meaningful alongside primarySetId */
  secondarySetId?: ArtifactSet['id'];
  /** 0–3 priority minor affixes to prioritize */
  priorityMinorAffixes?: ArtifactMinorAffix[];
  /** 0–3 secondary minor affixes (must be disjoint from priorityMinorAffixes) */
  secondaryMinorAffixes?: ArtifactMinorAffix[];
}
