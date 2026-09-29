// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character, Element } from '@genshin/game-data';

import type { BaseFilterState } from '@/lib/collection-filters';
import { filterCollection, initialBaseFilterState } from '@/lib/collection-filters';

export interface CharacterFilterState extends BaseFilterState {
  elements: Set<Element>;
}

export function initialFilterState(): CharacterFilterState {
  return { ...initialBaseFilterState(), elements: new Set<Element>() };
}

/** Release order uses each character's release date, which separates characters that shipped in one version. */
export function filterCharacters(
  characters: readonly Character[],
  filters: CharacterFilterState,
  ownedIds: ReadonlySet<string>,
): Character[] {
  return filterCollection(characters, filters, ownedIds, {
    category: (c) => c.element,
    selectedCategories: (f) => f.elements,
    compareRelease: (a, b) => a.releaseDate.localeCompare(b.releaseDate),
  });
}
