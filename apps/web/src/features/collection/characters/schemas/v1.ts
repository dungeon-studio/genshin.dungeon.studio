// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { z } from 'zod';

// Structural shape of one persisted collection entry. Kept as loose as the
// Firestore-side V1CharacterSchema (apps/api): the snapshot this generates gates
// structural compatibility, while assertCollectionCharacter enforces the domain
// semantics (known character, constellation range, ISO timestamps) at migrate time.
const V1CollectionCharacterSchema = z.object({
  characterId: z.string(),
  constellationLevel: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// The persisted localStorage shape for the `genshin-collection` store: exactly
// what `partialize` emits, so the JSON Schema snapshot stays faithful to what a
// released version wrote.
export const V1PersistedCollectionSchema = z.object({
  characters: z.record(z.string(), V1CollectionCharacterSchema),
});
