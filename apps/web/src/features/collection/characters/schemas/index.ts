// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter } from '@genshin/domain';
import { assertCollectionCharacter } from '@genshin/domain';

import { V1PersistedCollectionSchema } from './v1.js';

/**
 * The version zustand `persist` stamps onto every write.
 *
 * Bump this and add a `schemas/v{n}.ts` whenever the persisted shape changes;
 * the compatibility gate (`apps/api/scripts/check-schema-compat.ts`) then
 * forces the change to only widen.
 */
export const CURRENT_VERSION = 1 as const;

/**
 * Reads the `genshin-collection` store back out of browser storage, dropping
 * whatever no longer holds up.
 *
 * Two levels of tolerance, because this runs against data written by an older
 * build on someone else's machine: a blob that doesn't parse is discarded
 * whole, and within one that does, a malformed or unknown-character entry is
 * skipped so a single bad record can't cost the user their collection. A
 * signed-in user re-merges from the server afterwards, so a discard is rarely a
 * real loss.
 */
export function migratePersistedCollection(persisted: unknown): {
  characters: Record<string, CollectionCharacter>;
} {
  const parsed = V1PersistedCollectionSchema.safeParse(persisted);
  if (!parsed.success) return { characters: {} };

  const characters: Record<string, CollectionCharacter> = {};
  for (const entry of Object.values(parsed.data.characters)) {
    try {
      assertCollectionCharacter(entry);
      characters[entry.characterId] = entry;
    } catch {
      // Skip entries that no longer satisfy the domain model.
    }
  }
  return { characters };
}
