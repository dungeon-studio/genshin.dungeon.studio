// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CharacterCard } from './character-card';

const AMBER = {
  id: 'amber',
  name: 'Amber',
  element: 'Pyro',
  weaponType: 'Bow',
  rarity: 4,
  region: 'Mondstadt',
  version: '1.0',
  releaseDate: '2020-09-28',
} satisfies Character;

/** C0 through C6. */
const CONSTELLATION_LEVEL_COUNT = 7;

/**
 * Renders the owned, interactive card.
 *
 * `onRemove` is what selects that branch — an owned card with no callbacks at
 * all renders the read-only variant instead, controls and all omitted.
 */
function renderOwnedCard(props: Partial<ComponentProps<typeof CharacterCard>> = {}) {
  return render(<CharacterCard character={AMBER} owned onRemove={vi.fn()} {...props} />);
}

async function openConstellationPopover(currentLevel: number) {
  await userEvent.click(
    screen.getByRole('button', {
      name: `Constellation level ${currentLevel} for Amber, click to edit`,
    }),
  );
}

describe('CharacterCard', () => {
  it('adds an unowned character when its card is clicked', async () => {
    const onAdd = vi.fn();
    render(<CharacterCard character={AMBER} onAdd={onAdd} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add Amber to collection' }));

    expect(onAdd).toHaveBeenCalledWith('amber');
  });

  it('removes an owned character without offering to add it again', async () => {
    const onRemove = vi.fn();
    renderOwnedCard({ onRemove });

    expect(screen.queryByRole('button', { name: /Add Amber/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Amber from collection' }));

    expect(onRemove).toHaveBeenCalledWith('amber');
  });

  it('sets a new constellation level from the popover', async () => {
    const onConstellationChange = vi.fn();
    renderOwnedCard({ constellationLevel: 2, onConstellationChange });

    await openConstellationPopover(2);
    await userEvent.click(screen.getByRole('button', { name: 'Set constellation level 5' }));

    expect(onConstellationChange).toHaveBeenCalledWith('amber', 5);
  });

  it('offers every constellation level, marking the current one', async () => {
    renderOwnedCard({ constellationLevel: 2, onConstellationChange: vi.fn() });

    await openConstellationPopover(2);

    expect(screen.getAllByRole('button', { name: /^Set constellation level/ })).toHaveLength(
      CONSTELLATION_LEVEL_COUNT,
    );
    expect(screen.getByRole('button', { name: 'Set constellation level 2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders no controls when given no callbacks', () => {
    render(<CharacterCard character={AMBER} owned constellationLevel={4} />);

    expect(screen.getByText('Amber')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
