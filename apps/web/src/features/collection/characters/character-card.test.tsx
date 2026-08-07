// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CharacterCard } from './character-card';

// The interactive owned path — add, remove, raise a constellation — is walked by
// tools/e2e/specs/character-collection.spec.ts. What it never reaches is a card
// rendered without callbacks, or one handed callbacks it must ignore.
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
  it('renders no controls when given no callbacks', () => {
    render(<CharacterCard character={AMBER} owned constellationLevel={4} />);

    expect(screen.getAllByAltText('Pyro').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('offers only the add affordance while unowned', () => {
    render(
      <CharacterCard
        character={AMBER}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onConstellationChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Add Amber to collection' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Remove Amber/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Constellation level/ })).not.toBeInTheDocument();
  });

  it('dims the summary only while unowned', () => {
    const { unmount } = render(<CharacterCard character={AMBER} onAdd={vi.fn()} />);

    expect(screen.getAllByAltText('Pyro')[0]).toHaveClass('opacity-30');
    unmount();

    render(<CharacterCard character={AMBER} owned onRemove={vi.fn()} />);

    expect(screen.getAllByAltText('Pyro')[0]).not.toHaveClass('opacity-30');
  });
});
