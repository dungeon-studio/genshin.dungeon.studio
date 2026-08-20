// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CharacterSummary } from './character-summary';

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

describe('CharacterSummary', () => {
  it('renders placeholder when no character is provided', () => {
    render(<CharacterSummary />);

    expect(screen.getByText('No character')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the element icon with correct src path', () => {
    render(<CharacterSummary character={AMBER} />);

    const images = screen.getAllByAltText('Pyro');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', '/elements/pyro-light.png');
    expect(images[1]).toHaveAttribute('src', '/elements/pyro-dark.png');
  });

  it('applies dimmed styling when dimmed prop is true', () => {
    render(<CharacterSummary character={AMBER} dimmed />);

    const images = screen.getAllByAltText('Pyro');
    expect(images[0]).toHaveClass('opacity-30');
    expect(images[1]).toHaveClass('opacity-30');
  });
});
