// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Nav } from './nav';

function renderNav(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Nav />
    </MemoryRouter>,
  );
}

describe('Nav', () => {
  it('marks the Teams link as active on the root route', () => {
    renderNav('/');

    const teamsLink = screen.getByRole('link', { name: 'Teams' });
    expect(teamsLink.className).toContain('border-blue-500');
  });

  it('marks the Characters link as active on /characters', () => {
    renderNav('/characters');

    const charactersLink = screen.getByRole('link', { name: 'Characters' });
    expect(charactersLink.className).toContain('border-blue-500');

    const teamsLink = screen.getByRole('link', { name: 'Teams' });
    expect(teamsLink.className).toContain('border-transparent');
  });

  it('marks the Weapons link as active on /weapons', () => {
    renderNav('/weapons');

    const weaponsLink = screen.getByRole('link', { name: 'Weapons' });
    expect(weaponsLink.className).toContain('border-blue-500');
  });
});
