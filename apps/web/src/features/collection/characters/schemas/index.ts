// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter } from '@genshin/domain';
import { assertCollectionCharacter } from '@genshin/domain';

import { V1PersistedCollectionSchema } from './v1.js';

// The version zustand `persist` stamps onto every write. Bump this and add a
// `schemas/v{n}.ts` whenever the persisted shape changes; the compatibility gate
// (apps/api/scripts/check-schema-compat.ts) then forces the change to only widen.
export const CURRENT_VERSION = 1 as const;

// Rehydration guard for the `genshin-collection` store. Runs only when the
// persisted version is older than CURRENT_VERSION, so unversioned pre-alpha data
// (treated as v0) is adopted here. Structurally invalid blobs are discarded
// wholesale; individually malformed or unknown-character entries are dropped so
// one bad record can't poison the collection. Signed-in users re-merge from the
// server afterward, so a discard is never a real loss.
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
