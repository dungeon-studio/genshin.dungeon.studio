// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeaponId, TeamSlot } from '@genshin/domain';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { usePendingWeapon } from './use-pending-weapon';

const WEAPON = 'weapon-instance-1' as CollectionWeaponId;

describe('usePendingWeapon', () => {
  it('ignores a selection made while no member is being edited', () => {
    const { result } = renderHook(() => usePendingWeapon(null, null));

    act(() => {
      result.current.select(WEAPON);
    });

    expect(result.current.collectionWeaponId).toBeUndefined();
  });

  // The selection belongs to the member it was made on. Editing a sibling must not
  // inherit it, and coming back must not have lost it.
  it('surfaces the selection only for the member it was made on', () => {
    const { result, rerender } = renderHook(
      ({ slot, memberIndex }: { slot: TeamSlot; memberIndex: number }) =>
        usePendingWeapon(slot, memberIndex),
      { initialProps: { slot: 1 as TeamSlot, memberIndex: 0 } },
    );

    act(() => {
      result.current.select(WEAPON);
    });
    expect(result.current.collectionWeaponId).toBe(WEAPON);

    rerender({ slot: 1 as TeamSlot, memberIndex: 1 });
    expect(result.current.collectionWeaponId).toBeUndefined();

    rerender({ slot: 2 as TeamSlot, memberIndex: 0 });
    expect(result.current.collectionWeaponId).toBeUndefined();

    rerender({ slot: 1 as TeamSlot, memberIndex: 0 });
    expect(result.current.collectionWeaponId).toBe(WEAPON);
  });

  it('drops the selection when cleared', () => {
    const { result } = renderHook(() => usePendingWeapon(1, 0));

    act(() => {
      result.current.select(WEAPON);
    });
    act(() => {
      result.current.clear();
    });

    expect(result.current.collectionWeaponId).toBeUndefined();
  });
});
