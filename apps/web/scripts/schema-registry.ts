// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { z } from 'zod';

import { CURRENT_VERSION as collectionCurrent } from '../src/features/collection/characters/schemas/index.js';
import { V1CollectionCharacterSchema } from '../src/features/collection/characters/schemas/v1.js';
import { CURRENT_VERSION as transferCurrent } from '../src/features/collection/transfer/schemas/index.js';
import { V1TransferEnvelopeSchema } from '../src/features/collection/transfer/schemas/v1.js';

interface StoreSchemas {
  /** Zod schema for each version, keyed by the version the writer stamps. */
  readonly versions: Readonly<Record<number, z.ZodType>>;
  /** The version written onto every new document. */
  readonly currentVersion: number;
  /** Directory under `src/features/collection` holding the Zod source. */
  readonly source: string;
}

/**
 * Every web-side shape whose evolution is gated: data a released build wrote
 * that a later build still has to read.
 *
 * `genshin-collection` is the localStorage blob zustand `persist` writes, keyed
 * by its store name. Its schema is the per-record entry, not the whole-store
 * blob: the collection keys entries under a `Record`, and jsoncompat can't see
 * into a `Record` value, so snapshotting the wrapper would leave the entry
 * fields ungated. This mirrors the api side, which snapshots one Firestore
 * document rather than the collection.
 *
 * `collection-transfer` is the exported collection file, under a stronger
 * constraint still: a file exported today has to import into a build shipped
 * years later. The whole envelope is snapshotted because it nests its entries in
 * arrays, which jsoncompat does see into.
 */
export const SCHEMA_REGISTRY: Record<string, StoreSchemas> = {
  'genshin-collection': {
    versions: { 1: V1CollectionCharacterSchema },
    currentVersion: collectionCurrent,
    source: 'characters',
  },
  'collection-transfer': {
    versions: { 1: V1TransferEnvelopeSchema },
    currentVersion: transferCurrent,
    source: 'transfer',
  },
};

/** Render a schema as the canonical JSON Schema snapshot string (trailing newline included). */
export function toSnapshot(schema: z.ZodType): string {
  return `${JSON.stringify(z.toJSONSchema(schema), null, 2)}\n`;
}
