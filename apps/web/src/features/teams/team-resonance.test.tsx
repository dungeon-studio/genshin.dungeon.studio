// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam } from '@genshin/domain';
import type { Element } from '@genshin/game-data';
import { CHARACTERS, ELEMENTAL_RESONANCES } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { TeamResonance } from './team-resonance';

// Elements are resolved from real game data, so fixtures have to be real characters.
function partyOf(...elements: (Element | null)[]): CollectionTeam['members'] {
  const taken = new Set<string>();

  return elements.map((element) => {
    if (element === null) return null;

    const character = CHARACTERS.find((c) => c.element === element && !taken.has(c.id));
    if (!character) throw new Error(`no unused ${element} character in game data`);
    taken.add(character.id);

    return { characterId: character.id };
  }) as CollectionTeam['members'];
}

describe('TeamResonance', () => {
  it('names the resonances a filled party triggers', () => {
    render(<TeamResonance members={partyOf('Pyro', 'Pyro', 'Hydro', 'Hydro')} />);

    expect(screen.getByText(ELEMENTAL_RESONANCES.FERVENT_FLAMES.name)).toBeInTheDocument();
    expect(screen.getByText(ELEMENTAL_RESONANCES.SOOTHING_WATER.name)).toBeInTheDocument();
  });

  it('renders nothing while the party is still filling', () => {
    const { container } = render(
      <TeamResonance members={partyOf('Pyro', 'Pyro', 'Hydro', null)} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('describes the bonus when a badge is focused', async () => {
    const user = userEvent.setup();
    render(<TeamResonance members={partyOf('Pyro', 'Pyro', 'Hydro', 'Hydro')} />);

    await user.tab();

    expect(
      await screen.findByText(ELEMENTAL_RESONANCES.FERVENT_FLAMES.description),
    ).toBeInTheDocument();
  });
});
