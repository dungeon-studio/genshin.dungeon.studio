// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, ISOTimestamp } from '@genshin/domain';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeWeapon } from '@/test/fixtures';

import { WeaponInstanceSidebar } from './weapon-instance-sidebar';

const OLDER = makeWeapon('older', 'favonius-sword', {
  createdAt: '2026-01-01T00:00:00.000Z' as ISOTimestamp,
});
const NEWER = makeWeapon('newer', 'favonius-sword', {
  createdAt: '2026-01-02T00:00:00.000Z' as ISOTimestamp,
});

function sidebarWith(instances: CollectionWeapon[]) {
  return (
    <WeaponInstanceSidebar
      weaponId="favonius-sword"
      instances={instances}
      onClose={vi.fn()}
      onAdd={vi.fn()}
      onRemove={vi.fn()}
      onRefinementChange={vi.fn()}
    />
  );
}

function rowRefinements(): (string | null)[] {
  return screen.getAllByText(/^R\d$/).map((element) => element.textContent);
}

describe('WeaponInstanceSidebar', () => {
  it('keeps an edited row in place when its refinement rises', () => {
    const { rerender } = render(sidebarWith([NEWER, OLDER]));

    rerender(sidebarWith([{ ...NEWER, refinementLevel: 5 }, OLDER]));

    expect(rowRefinements()).toEqual(['R1', 'R5']);
  });
});
