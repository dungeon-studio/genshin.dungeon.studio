// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { SchemaRegistry } from '@genshin/schema-snapshots';

import { CURRENT_VERSION as collectionCurrent } from '../src/features/collection/characters/schemas/index.js';
import { V1CollectionCharacterSchema } from '../src/features/collection/characters/schemas/v1.js';

/**
 * Every localStorage-persisted zustand store whose shape evolution is gated,
 * keyed by the `persist` store name. The collection registers its per-record
 * entry schema, not the whole-store blob.
 */
export const SCHEMA_REGISTRY: SchemaRegistry = {
  'genshin-collection': {
    versions: { 1: V1CollectionCharacterSchema },
    currentVersion: collectionCurrent,
  },
};
