// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { MobileNav } from './mobile-nav';
import { NAV_LINKS } from './nav-links';

function renderMobileNav() {
  return render(
    <MemoryRouter>
      <MobileNav />
    </MemoryRouter>,
  );
}

describe('MobileNav', () => {
  it('reveals every nav link once the menu is opened', async () => {
    const user = userEvent.setup();
    renderMobileNav();

    expect(screen.queryByRole('link', { name: 'Teams' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));

    for (const link of NAV_LINKS) {
      expect(screen.getByRole('link', { name: link.label })).toBeInTheDocument();
    }
  });

  it('closes the menu when a link is selected', async () => {
    const user = userEvent.setup();
    renderMobileNav();

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    await user.click(screen.getByRole('link', { name: 'Characters' }));

    expect(screen.queryByRole('link', { name: 'Characters' })).not.toBeInTheDocument();
  });
});
