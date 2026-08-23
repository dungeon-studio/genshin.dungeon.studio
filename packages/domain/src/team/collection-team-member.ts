/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { Character } from '@genshin/game-data';

import type { ArtifactPlan } from '../artifact/artifact-plan.js';
import { assertArtifactPlan, deserialiseArtifactPlan } from '../artifact/artifact-plan.js';
import { assertOptionalString, assertString } from '../assertions.js';
import type { CollectionWeaponId } from '../weapon/collection-weapon.js';

/**
 * CollectionTeamMember represents a single character position in a team with
 * equipped weapon and artifacts.
 *
 * Character details should be looked up from @genshin/game-data using characterId.
 * The weaponInstanceId references a specific weapon instance in the user's collection.
 */
export interface CollectionTeamMember {
  characterId: Character['id'];
  weaponInstanceId?: CollectionWeaponId;
  artifactPlan?: ArtifactPlan;
}

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

/** Rebuilds rather than returns the input, so undeclared properties don't survive. */
export function deserialiseCollectionTeamMember(
  value: unknown,
  path = 'CollectionTeamMember',
): CollectionTeamMember {
  assertCollectionTeamMember(value, path);

  return {
    characterId: value.characterId,
    ...(value.weaponInstanceId !== undefined ? { weaponInstanceId: value.weaponInstanceId } : {}),
    ...(value.artifactPlan !== undefined
      ? { artifactPlan: deserialiseArtifactPlan(value.artifactPlan, `${path}.artifactPlan`) }
      : {}),
  };
}
