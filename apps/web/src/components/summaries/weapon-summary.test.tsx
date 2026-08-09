// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Weapon } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WeaponSummary } from './weapon-summary';

const AMOS_BOW = {
  id: 'amos-bow',
  name: "Amos' Bow",
  type: 'Bow',
  rarity: 5,
  baseATK: 46,
  version: '1.0',
} satisfies Weapon;

// The type icons render `alt=""`: they restate the name beside them, so they
// are decorative and Testing Library's queries, which read the accessibility
// tree, cannot reach them.
/* eslint-disable testing-library/no-container, testing-library/no-node-access */
describe('WeaponSummary', () => {
  it('renders placeholder when no weapon is provided', () => {
    render(<WeaponSummary />);

    expect(screen.getByText('No weapon')).toBeInTheDocument();
  });

  it('renders the weapon type icon with correct src path', () => {
    const { container } = render(<WeaponSummary weapon={AMOS_BOW} />);

    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', '/weapon-types/bow-light.png');
    expect(images[1]).toHaveAttribute('src', '/weapon-types/bow-dark.png');
  });

  it('applies dimmed styling when dimmed prop is true', () => {
    const { container } = render(<WeaponSummary weapon={AMOS_BOW} dimmed />);

    const images = container.querySelectorAll('img');
    expect(images[0]).toHaveClass('opacity-30');
    expect(images[1]).toHaveClass('opacity-30');
  });
});
