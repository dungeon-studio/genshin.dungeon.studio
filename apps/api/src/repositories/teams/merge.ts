// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam, ISOTimestamp, TeamSlot } from '@genshin/domain';

export interface TeamUpdates {
  name?: string;
  members?: CollectionTeam['members'];
  description?: string;
}

/**
 * The team a save leaves behind: a field the save omits falls back to the
 * stored team, and one neither supplies takes a default.
 *
 * `??` and not `||`, so an empty-string name or description is a value and does
 * not fall through to the stored one.
 */
export function nextTeam(
  slot: TeamSlot,
  updates: TeamUpdates,
  existing: CollectionTeam | null,
  now: ISOTimestamp,
): CollectionTeam {
  const description = updates.description ?? existing?.description;

  return {
    slot,
    name: updates.name ?? existing?.name ?? `Team ${slot}`,
    members: updates.members ?? existing?.members ?? [null, null, null, null],
    ...(description !== undefined ? { description } : {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}
