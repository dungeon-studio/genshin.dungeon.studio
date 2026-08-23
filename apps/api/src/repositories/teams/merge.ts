// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam, ISOTimestamp, TeamSlot } from '@genshin/domain';

/** What a save is changing. An absent field leaves the stored value alone. */
export interface TeamUpdates {
  name?: string;
  members?: CollectionTeam['members'];
  description?: string;
}

/**
 * The team to store, from an update and whatever was already there.
 *
 * `createdAt` survives from the existing record while `updatedAt` always moves,
 * so a save that changes nothing still stamps a new modification time. A slot
 * with nothing stored yields a complete default team rather than a partial one.
 *
 * @remarks
 * `??` throughout: an empty name or description is a value, not an omission.
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
