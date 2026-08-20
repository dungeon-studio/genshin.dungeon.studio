// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SORT_FIELDS } from '@/features/collection/sort-fields';

import { type BaseFilterState, FilterBar, type FilterCategoryConfig } from './filter-bar';

function baseFilters(overrides: Partial<BaseFilterState> = {}): BaseFilterState {
  return {
    search: '',
    rarities: new Set(),
    ownership: 'all',
    sortField: 'release',
    sortDirection: 'desc',
    ...overrides,
  };
}

function renderBar(
  props: {
    filters?: BaseFilterState;
    category?: Partial<FilterCategoryConfig<string>>;
    showOwnership?: boolean;
    collapsible?: boolean;
    filteredCount?: number;
    totalCount?: number;
    ownedCount?: number;
    filteredOwnedCount?: number;
  } = {},
) {
  const onChange = vi.fn<(filters: BaseFilterState) => void>();
  const onToggle = vi.fn<(value: string) => void>();
  const category: FilterCategoryConfig<string> = {
    values: ['A', 'B'],
    selected: new Set(),
    onToggle,
    activeClassName: () => 'bg-active',
    iconPath: (value, variant) => `/icons/${value}-${variant}.png`,
    ...props.category,
  };

  render(
    <FilterBar
      filters={props.filters ?? baseFilters()}
      onChange={onChange}
      category={category}
      sortFields={SORT_FIELDS}
      noun="items"
      searchLabel="Search items by name"
      filteredCount={props.filteredCount ?? 5}
      totalCount={props.totalCount ?? 5}
      ownedCount={props.ownedCount ?? 2}
      filteredOwnedCount={props.filteredOwnedCount ?? 2}
      showOwnership={props.showOwnership}
      collapsible={props.collapsible}
    />,
  );

  return { onChange, onToggle };
}

describe('FilterBar', () => {
  it('toggles ownership to the picked value', async () => {
    const user = userEvent.setup({ delay: null });
    const { onChange } = renderBar();

    await user.click(screen.getByRole('button', { name: 'owned' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ ownership: 'owned' }));
  });

  it('adds a rarity that was not selected', async () => {
    const user = userEvent.setup({ delay: null });
    const { onChange } = renderBar();

    await user.click(screen.getByRole('button', { name: 'Filter by 5-star' }));

    expect(onChange.mock.calls[0][0].rarities.has(5)).toBe(true);
  });

  it('removes a rarity that was already selected', async () => {
    const user = userEvent.setup({ delay: null });
    const { onChange } = renderBar({ filters: baseFilters({ rarities: new Set([5]) }) });

    await user.click(screen.getByRole('button', { name: 'Filter by 5-star' }));

    expect(onChange.mock.calls[0][0].rarities.has(5)).toBe(false);
  });

  it('delegates category toggles to the config', async () => {
    const user = userEvent.setup({ delay: null });
    const { onToggle } = renderBar();

    await user.click(screen.getByRole('button', { name: 'Filter by A' }));

    expect(onToggle).toHaveBeenCalledWith('A');
  });

  it('cycles the sort field and wraps back to the first', async () => {
    const user = userEvent.setup({ delay: null });
    const { onChange } = renderBar({ filters: baseFilters({ sortField: 'name' }) });

    await user.click(screen.getByRole('button', { name: 'Name' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sortField: 'release' }));
  });

  it('flips the sort direction from descending to ascending', async () => {
    const user = userEvent.setup({ delay: null });
    const { onChange } = renderBar();

    await user.click(screen.getByRole('button', { name: 'Sort descending' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sortDirection: 'asc' }));
  });

  it('flips the sort direction from ascending to descending', async () => {
    const user = userEvent.setup({ delay: null });
    const { onChange } = renderBar({ filters: baseFilters({ sortDirection: 'asc' }) });

    await user.click(screen.getByRole('button', { name: 'Sort ascending' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sortDirection: 'desc' }));
  });

  it('reports what is typed in the search box', async () => {
    const user = userEvent.setup({ delay: null });
    const { onChange } = renderBar();

    await user.type(screen.getByRole('searchbox', { name: 'Search items by name' }), 'x');

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'x' }));
  });

  it('shows a plain count and no ownership controls when ownership is hidden', () => {
    renderBar({ showOwnership: false, filteredCount: 3 });

    expect(screen.getByText(/3 items/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'owned' })).not.toBeInTheDocument();
  });

  it('hides the category row when configured off', () => {
    renderBar({ category: { show: false } });

    expect(screen.queryByRole('button', { name: 'Filter by A' })).not.toBeInTheDocument();
  });

  it('summarizes owned over total when nothing is filtered out', () => {
    renderBar({ filteredCount: 5, totalCount: 5, ownedCount: 2 });

    expect(screen.getByText(/2 \/ 5 owned/)).toBeInTheDocument();
  });

  it('summarizes owned over filtered once a filter narrows the list', () => {
    renderBar({ filteredCount: 3, totalCount: 5, filteredOwnedCount: 1 });

    expect(screen.getByText(/1 \/ 3 owned/)).toBeInTheDocument();
  });

  it('offers no collapse toggle unless asked for one', () => {
    renderBar();

    expect(screen.queryByRole('button', { name: /Filters/ })).not.toBeInTheDocument();
  });

  it('collapses only the chips, leaving search and sort reachable', () => {
    renderBar({ collapsible: true });
    // `aria-controls` holds an element id; no Testing Library query expresses
    // "the region this button controls".
    // eslint-disable-next-line testing-library/no-node-access
    const region = document.getElementById(
      screen.getByRole('button', { name: 'Filters' }).getAttribute('aria-controls') ?? '',
    );

    expect(region).toContainElement(screen.getByRole('button', { name: 'Filter by A' }));
    expect(region).not.toContainElement(
      screen.getByRole('searchbox', { name: 'Search items by name' }),
    );
    expect(region).not.toContainElement(screen.getByRole('button', { name: 'Sort descending' }));
  });

  it('starts collapsed and expands when the toggle is pressed', async () => {
    const user = userEvent.setup({ delay: null });
    renderBar({ collapsible: true });
    const toggle = screen.getByRole('button', { name: /Filters/ });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('counts every kind of narrowing filter on the toggle', () => {
    renderBar({
      collapsible: true,
      filters: baseFilters({ search: 'amber', rarities: new Set([5, 4]), ownership: 'owned' }),
      category: { selected: new Set(['A']) },
    });

    expect(screen.getByRole('button', { name: 'Filters, 5 active' })).toBeInTheDocument();
  });

  it('leaves the toggle unbadged when only the sort field is set', () => {
    renderBar({ collapsible: true, filters: baseFilters({ sortField: 'name' }) });

    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
  });

  it('ignores filters whose rows are hidden when counting', () => {
    renderBar({
      collapsible: true,
      showOwnership: false,
      filters: baseFilters({ ownership: 'owned' }),
      category: { show: false, selected: new Set(['A']) },
    });

    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
  });
});
