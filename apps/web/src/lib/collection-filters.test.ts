// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { filterCollection, initialBaseFilterState } from './collection-filters';

interface Item {
  id: string;
  name: string;
  rarity: Rarity;
}

const CONFIG = {
  category: () => 'none',
  selectedCategories: () => new Set<string>(),
  compareRelease: () => 0,
};

function sortedIds(items: readonly Item[]): string[] {
  const filters = { ...initialBaseFilterState(), sortDirection: 'asc' as const };
  return filterCollection(items, filters, new Set(), CONFIG).map((item) => item.id);
}

describe('filterCollection', () => {
  it('orders items tied on release and name by ID', () => {
    const alpha: Item = { id: 'alpha', name: 'Twin', rarity: 5 };
    const beta: Item = { id: 'beta', name: 'Twin', rarity: 5 };

    expect(sortedIds([beta, alpha])).toEqual(['alpha', 'beta']);
  });
});
