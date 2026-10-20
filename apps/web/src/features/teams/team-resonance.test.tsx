// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam } from '@genshin/domain';
import type { Element } from '@genshin/game-data';
import { CHARACTERS, ELEMENTAL_RESONANCES } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { getElementIconPath } from '@/lib/elements';

import { TeamResonance } from './team-resonance';

// Elements are resolved from real game data, so fixtures have to be real characters.
function partyOf(...elements: (Element | null)[]): CollectionTeam['members'] {
  const taken = new Set<string>();

  return elements.map((element) => {
    if (element === null) return null;

    const character = Object.values(CHARACTERS).find(
      (c) => c.element === element && !taken.has(c.id),
    );
    if (!character) throw new Error(`no unused ${element} character in game data`);
    taken.add(character.id);

    return { characterId: character.id };
  }) as CollectionTeam['members'];
}

const fervent = ELEMENTAL_RESONANCES['fervent-flames'];
const soothing = ELEMENTAL_RESONANCES['soothing-water'];
const canopy = ELEMENTAL_RESONANCES['protective-canopy'];
const pyroHydroPairs = partyOf('Pyro', 'Pyro', 'Hydro', 'Hydro');

// Decorative icons have no accessible role to query by.
function iconSources(badgeName: string): (string | null)[] {
  return [...screen.getByRole('button', { name: badgeName }).querySelectorAll('img')].map((icon) =>
    icon.getAttribute('src'),
  );
}

describe('TeamResonance', () => {
  it('names the resonances a filled party triggers', () => {
    render(<TeamResonance members={pyroHydroPairs} />);

    expect(screen.getByRole('button', { name: fervent.name })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: soothing.name })).toBeInTheDocument();
  });

  it('renders nothing while the party is still filling', () => {
    const { container } = render(
      <TeamResonance members={partyOf('Pyro', 'Pyro', 'Hydro', null)} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a pair badge its dark-theme icon in either theme', () => {
    render(<TeamResonance members={pyroHydroPairs} />);

    expect(iconSources(fervent.name)).toStrictEqual([getElementIconPath('Pyro', 'dark')]);
  });

  it('shows Protective Canopy every party element', () => {
    const party: Element[] = ['Pyro', 'Hydro', 'Electro', 'Cryo'];
    render(<TeamResonance members={partyOf(...party)} />);

    expect(iconSources(canopy.name)).toStrictEqual(
      party.flatMap((element) => [
        getElementIconPath(element, 'light'),
        getElementIconPath(element, 'dark'),
      ]),
    );
  });

  it('describes the bonus when a badge is pressed', async () => {
    const user = userEvent.setup();
    render(<TeamResonance members={pyroHydroPairs} />);

    await user.click(screen.getByRole('button', { name: fervent.name }));

    expect(await screen.findByText(fervent.description)).toBeInTheDocument();
  });
});
