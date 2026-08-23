/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { Character } from '@genshin/game-data';

import type { ArtifactPlan } from '../artifact/artifact-plan.js';
import { assertArtifactPlan, deserialiseArtifactPlan } from '../artifact/artifact-plan.js';
import { assertOptionalString, assertString } from '../assertions.js';
import type { CollectionWeaponId } from '../weapon/collection-weapon.js';

/**
 * One character's position in a team, with what it plans to equip.
 *
 * `weaponInstanceId` and `artifactPlan` are both optional, so a team can name a
 * character before the user has decided the rest.
 *
 * `weaponInstanceId` points into the user's own collection rather than naming a
 * weapon, so the refinement it resolves to follows that record. Character
 * details are looked up from `@genshin/game-data` by `characterId`.
 */
export interface CollectionTeamMember {
  characterId: Character['id'];
  weaponInstanceId?: CollectionWeaponId;
  artifactPlan?: ArtifactPlan;
}

/**
 * Asserts a value is a `CollectionTeamMember`, without checking that the
 * identifiers it names exist.
 *
 * Shape only: a `characterId` naming no character and a `weaponInstanceId`
 * naming no owned weapon both pass, so a caller that needs those to resolve
 * has to look them up.
 *
 * @param path - prefix for the field names in a failure, so a guard over an
 * enclosing structure reports the position that broke.
 * @throws TypeError naming the field that failed.
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

/**
 * Builds a `CollectionTeamMember` from untrusted input, keeping only the
 * declared properties.
 *
 * Asserting the shape leaves undeclared properties in place, which would carry
 * a request body's extra fields into storage. Rebuilding the object field by
 * field is what stops them.
 *
 * @throws TypeError naming the field that failed.
 */
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
