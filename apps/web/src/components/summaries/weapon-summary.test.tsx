// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { WEAPONS } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { WeaponSummary } from './weapon-summary';

const { 'amos-bow': AMOS_BOW } = WEAPONS;

/**
 * The type icons restate the name beside them, so they render `alt=""`. That
 * keeps them out of the accessibility tree every Testing Library query reads,
 * leaving direct DOM access the only way to reach them.
 */
function typeIconsFor(summary: ReactElement): NodeListOf<HTMLImageElement> {
  const { container } = render(summary);

  // eslint-disable-next-line testing-library/no-container
  return container.querySelectorAll('img');
}

describe('WeaponSummary', () => {
  it('renders placeholder when no weapon is provided', () => {
    render(<WeaponSummary />);

    expect(screen.getByText('No weapon')).toBeInTheDocument();
  });

  it('renders the weapon type icon with correct src path', () => {
    const images = typeIconsFor(<WeaponSummary weapon={AMOS_BOW} />);

    expect(images).toHaveLength(2);
    // Spelled out rather than read back from `getWeaponTypeIconPath`: these two
    // assertions are the only coverage of the type-to-file mapping.
    expect(images[0]).toHaveAttribute('src', '/weapon-types/bow-light.png');
    expect(images[1]).toHaveAttribute('src', '/weapon-types/bow-dark.png');
  });

  it('applies dimmed styling when dimmed prop is true', () => {
    const images = typeIconsFor(<WeaponSummary weapon={AMOS_BOW} dimmed />);

    expect(images[0]).toHaveClass('opacity-30');
    expect(images[1]).toHaveClass('opacity-30');
  });
});
