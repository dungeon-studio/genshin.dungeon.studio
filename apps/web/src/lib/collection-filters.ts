// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Filter dimensions every collection shares. A collection's own filter state
 * narrows `sortField` to the fields it can sort by; these two are the same
 * everywhere, and `BaseFilterState` expects exactly them.
 */

export type OwnershipFilter = 'all' | 'owned' | 'unowned';
export type SortDirection = 'asc' | 'desc';
