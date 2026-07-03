// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { z } from 'zod';

// The per-record shape: one persisted collection entry. This is the unit the
// compatibility gate snapshots — jsoncompat can't see into a `Record` value
// (`additionalProperties`), and the collection blob keys every entry under one,
// so the whole-store schema would leave these fields ungated. Kept as loose as
// the Firestore-side V1CharacterSchema (apps/api): the snapshot gates structural
// compatibility, while assertCollectionCharacter enforces the domain semantics
// (known character, constellation range, ISO timestamps) at migrate time.
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
