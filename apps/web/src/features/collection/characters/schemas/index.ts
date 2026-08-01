// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter } from '@genshin/domain';
import { assertCollectionCharacter } from '@genshin/domain';

import { V1PersistedCollectionSchema } from './v1.js';

// The last version the retired `genshin-collection` store wrote. Nothing
// persists under it any more, but the compatibility gate
// (apps/api/scripts/check-schema-compat.ts) still holds the snapshot, because
// browsers left over from the anonymous era hold data this version must read.
export const CURRENT_VERSION = 1 as const;

// Drain guard for the retired `genshin-collection` store: an invalid blob is
// discarded whole and a single malformed or unknown-character entry is dropped,
// so one bad record can't poison the collection. The server is the system of
// record, so a discard costs at most the entries never synced from it.
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
