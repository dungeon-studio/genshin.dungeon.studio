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

const ROUTES = [
  { route: '/', link: 'Teams' },
  { route: '/characters', link: 'Characters' },
  { route: '/weapons', link: 'Weapons' },
];

describe('Nav', () => {
  it.each(ROUTES)('marks the $link link as active on $route', ({ route, link }) => {
    renderNav(route);

    expect(screen.getByRole('link', { name: link })).toHaveClass('border-primary');
  });

  it('leaves the links for every other route inactive', () => {
    renderNav('/characters');

    expect(screen.getByRole('link', { name: 'Teams' })).toHaveClass('border-transparent');
  });
});
