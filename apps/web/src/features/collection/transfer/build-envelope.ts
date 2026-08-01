// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionSnapshot } from './collection-snapshot.js';
import { isEmptyTeam } from './collection-snapshot.js';
import { CURRENT_VERSION } from './schemas/index.js';
import type { V1TransferEnvelope } from './schemas/v1.js';

/**
 * Render the current collection as an export envelope.
 *
 * `exportedAt` is a parameter rather than read from the clock here so the result
 * stays a pure function of its inputs.
 */
export function buildTransferEnvelope(
  snapshot: CollectionSnapshot,
  exportedAt: string,
): V1TransferEnvelope {
  return {
    version: CURRENT_VERSION,
    exportedAt,
    characters: Object.values(snapshot.characters).map(({ characterId, constellationLevel }) => ({
      characterId,
      constellationLevel,
    })),
    weapons: Object.values(snapshot.weapons).map(
      ({ weaponInstanceId, weaponId, refinementLevel }) => ({
        weaponInstanceId,
        weaponId,
        refinementLevel,
      }),
    ),
    teams: Object.values(snapshot.teams)
      .filter((team) => !isEmptyTeam(team))
      .map(({ slot, name, members, description }) => ({
        slot,
        name,
        members,
        ...(description !== undefined ? { description } : {}),
      })),
  };
}

/** The envelope as the bytes written to disk. */
export function serialiseEnvelope(envelope: V1TransferEnvelope): string {
  return `${JSON.stringify(envelope, null, 2)}\n`;
}

/**
 * Filename for a downloaded export.
 *
 * The timestamp is punctuation-stripped so the name survives every filesystem
 * the browser might save it to, and sorts chronologically in a directory listing.
 */
export function exportFilename(exportedAt: string): string {
  const stamp = exportedAt.replace(/[:.]/g, '-');
  return `genshin-collection-${stamp}.json`;
}
