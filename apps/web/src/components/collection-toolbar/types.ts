// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/** Configures the one filter row that differs between collection types. */
export interface FilterCategoryConfig<T extends string> {
  values: readonly T[];
  selected: Set<T>;
  onToggle: (value: T) => void;
  /** Active-state classes for a value, e.g. per-element background color. */
  activeClassName: (value: T) => string;
  iconPath: (value: T, variant: 'light' | 'dark') => string;
  /** Render the category row (default true). */
  show?: boolean;
}

export interface FilterCounts {
  filteredCount: number;
  totalCount: number;
  ownedCount: number;
  filteredOwnedCount: number;
}

export interface Noun {
  one: string;
  other: string;
}
