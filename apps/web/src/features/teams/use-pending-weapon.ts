// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeaponId, TeamSlot } from '@genshin/domain';
import { useCallback, useState } from 'react';

interface PendingWeapon {
  slot: TeamSlot;
  memberIndex: number;
  collectionWeaponId: CollectionWeaponId;
}

export interface UsePendingWeaponResult {
  /** The weapon awaiting a character for the member given to the hook, if any. */
  collectionWeaponId: CollectionWeaponId | undefined;
  select: (collectionWeaponId: CollectionWeaponId) => void;
  clear: () => void;
}

/**
 * Holds a weapon chosen for a member that has no character yet.
 *
 * A team member is keyed by its character, so the domain model has nowhere to put a
 * weapon picked first. It waits here until a character assignment commits the pair,
 * and is dropped if the user leaves without one.
 *
 * The selection belongs to the member it was made on: editing a different member
 * hides it rather than moving it, so returning to the original member restores it.
 */
export function usePendingWeapon(
  slot: TeamSlot | null,
  memberIndex: number | null,
): UsePendingWeaponResult {
  const [pending, setPending] = useState<PendingWeapon | null>(null);

  const isCurrentMember =
    pending !== null && pending.slot === slot && pending.memberIndex === memberIndex;

  const select = useCallback(
    (collectionWeaponId: CollectionWeaponId) => {
      if (slot === null || memberIndex === null) return;
      setPending({ slot, memberIndex, collectionWeaponId });
    },
    [slot, memberIndex],
  );

  const clear = useCallback(() => {
    setPending(null);
  }, []);

  return {
    collectionWeaponId: isCurrentMember ? pending.collectionWeaponId : undefined,
    select,
    clear,
  };
}
