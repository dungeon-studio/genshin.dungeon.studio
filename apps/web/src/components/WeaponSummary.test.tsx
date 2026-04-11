// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WeaponSummary } from './WeaponSummary';

const AMOS_BOW = {
  id: 'amos-bow',
  name: "Amos' Bow",
  type: 'Bow' as const,
  rarity: 5 as const,
  baseATK: 46,
  version: '1.0',
};

describe('WeaponSummary', () => {
  it('renders placeholder when no weapon is provided', () => {
    render(<WeaponSummary />);

    expect(screen.getByText('No weapon')).toBeInTheDocument();
  });

  it('renders the weapon type icon with correct src path', () => {
    render(<WeaponSummary weapon={AMOS_BOW} />);

    const img = screen.getByAltText('Bow');
    expect(img).toHaveAttribute('src', '/weapon-types/bow-light.png');
  });

  it('applies dimmed styling when dimmed prop is true', () => {
    render(<WeaponSummary weapon={AMOS_BOW} dimmed />);

    const img = screen.getByAltText('Bow');
    expect(img.className).toContain('opacity-30');
  });
});
