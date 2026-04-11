// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CharacterSummary } from './CharacterSummary';

const AMBER = {
  id: 'amber',
  name: 'Amber',
  element: 'Pyro' as const,
  weaponType: 'Bow' as const,
  rarity: 4 as const,
  region: 'Mondstadt',
  version: '1.0',
};

describe('CharacterSummary', () => {
  it('renders placeholder when no character is provided', () => {
    const { container } = render(<CharacterSummary />);

    expect(screen.getByText('No character')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders the element icon with correct src path', () => {
    render(<CharacterSummary character={AMBER} />);

    const img = screen.getByAltText('Pyro');
    expect(img).toHaveAttribute('src', '/elements/pyro-light.png');
  });

  it('applies dimmed styling when dimmed prop is true', () => {
    render(<CharacterSummary character={AMBER} dimmed />);

    const img = screen.getByAltText('Pyro');
    expect(img.className).toContain('opacity-30');
  });
});
