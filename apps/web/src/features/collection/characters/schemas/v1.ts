// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { z } from 'zod';

// One persisted collection entry. The compatibility gate snapshots this rather
// than the whole store because it can't see inside the store's `Record`.
// Kept as loose as the Firestore-side V1CharacterSchema (apps/api): the snapshot
// gates structure only, while assertCollectionCharacter enforces the domain
// semantics (known character, constellation range, ISO timestamps) at migrate time.
export const V1CollectionCharacterSchema = z.object({
  characterId: z.string(),
  constellationLevel: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// The full persisted localStorage shape for the `genshin-collection` store —
// exactly what `partialize` emits. Used to structurally validate the blob in
// `migrate`; the committed snapshot is the entry schema above, not this wrapper.
export const V1PersistedCollectionSchema = z.object({
  characters: z.record(z.string(), V1CollectionCharacterSchema),
});
