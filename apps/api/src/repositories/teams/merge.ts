// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam, ISOTimestamp, TeamSlot } from '@genshin/domain';

export interface TeamUpdates {
  name?: string;
  members?: CollectionTeam['members'];
  description?: string;
}

/** `??` throughout: an empty name or description is a value, not an omission. */
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
