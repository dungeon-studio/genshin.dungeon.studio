/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { Character } from '@genshin/game-data';

import type { ArtifactPlan } from '../artifact/artifact-plan.js';
import { assertArtifactPlan } from '../artifact/artifact-plan.js';
import { assertOptionalString, assertString } from '../assertions.js';
import type { UUID } from '../uuid.js';

/**
 * CollectionTeamMember represents a single character position in a team with
 * equipped weapon and artifacts.
 *
 * Character details should be looked up from @genshin/game-data using characterId.
 * The weaponInstanceId references a specific weapon instance in the user's collection.
 */
export interface CollectionTeamMember {
  characterId: Character['id'];
  weaponInstanceId?: UUID;
  artifactPlan?: ArtifactPlan;
}

/**
 * Assert that `value` has the shape of a {@link CollectionTeamMember}.
 *
 * @param path - Prefix for error messages, so a member reports its position
 *   within the team (e.g. `CollectionTeam.members[0]`).
 */
export function assertCollectionTeamMember(
  value: unknown,
  path = 'CollectionTeamMember',
): asserts value is CollectionTeamMember {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`${path} must be a non-null object, got: ${JSON.stringify(value)}`);
  }
  const member = value as Record<string, unknown>;
  assertString(member.characterId, `${path}.characterId`);
  assertOptionalString(member.weaponInstanceId, `${path}.weaponInstanceId`);
  if (member.artifactPlan !== undefined) {
    assertArtifactPlan(member.artifactPlan, `${path}.artifactPlan`);
  }
}
