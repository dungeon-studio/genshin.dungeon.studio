// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
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

describe('CharacterCard', () => {
  it('adds an unowned character when its card is clicked', async () => {
    const onAdd = vi.fn();
    render(<CharacterCard character={AMBER} onAdd={onAdd} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add Amber to collection' }));

    expect(onAdd).toHaveBeenCalledWith('amber');
  });

  it('removes an owned character without offering to add it again', async () => {
    const onRemove = vi.fn();
    render(<CharacterCard character={AMBER} owned onRemove={onRemove} />);

    expect(screen.queryByRole('button', { name: /Add Amber/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Amber from collection' }));

    expect(onRemove).toHaveBeenCalledWith('amber');
  });

  it('sets a new constellation level from the popover', async () => {
    const onConstellationChange = vi.fn();
    render(
      <CharacterCard
        character={AMBER}
        owned
        constellationLevel={2}
        onRemove={vi.fn()}
        onConstellationChange={onConstellationChange}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Constellation level 2 for Amber, click to edit' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Set constellation level 5' }));

    expect(onConstellationChange).toHaveBeenCalledWith('amber', 5);
  });

  it('offers every constellation level, marking the current one', async () => {
    render(
      <CharacterCard
        character={AMBER}
        owned
        constellationLevel={2}
        onRemove={vi.fn()}
        onConstellationChange={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Constellation level 2 for Amber, click to edit' }),
    );

    expect(screen.getAllByRole('button', { name: /^Set constellation level/ })).toHaveLength(7);
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
