// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { CHARACTERS } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CharacterSummary } from './character-summary';

const { amber: AMBER } = CHARACTERS;

describe('CharacterSummary', () => {
  it('renders placeholder when no character is provided', () => {
    render(<CharacterSummary />);

    expect(screen.getByText('No character')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the element icon with correct src path', () => {
    render(<CharacterSummary character={AMBER} />);

    const images = screen.getAllByAltText(AMBER.element);
    expect(images).toHaveLength(2);
    // The only coverage of the element-to-file mapping, so the paths stay literal.
    expect(images[0]).toHaveAttribute('src', '/elements/pyro-light.png');
    expect(images[1]).toHaveAttribute('src', '/elements/pyro-dark.png');
  });

  it('applies dimmed styling when dimmed prop is true', () => {
    render(<CharacterSummary character={AMBER} dimmed />);

    const images = screen.getAllByAltText(AMBER.element);
    expect(images[0]).toHaveClass('opacity-30');
    expect(images[1]).toHaveClass('opacity-30');
  });
});
