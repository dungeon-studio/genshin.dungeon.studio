// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { createWrapper, fakeUser } from '@/test/render';

import { EmptyCollection } from './empty-collection';

function renderEmptyCollection(wrapper: ReturnType<typeof createWrapper>): void {
  render(
    <MemoryRouter>
      <EmptyCollection
        icon={Users}
        title="No characters in your collection"
        description="Visit the characters page to add characters to your collection."
        to="/characters"
        action="Go to Characters"
      />
    </MemoryRouter>,
    { wrapper },
  );
}

describe('EmptyCollection', () => {
  it('points a signed-in user at the page that fills the collection', () => {
    renderEmptyCollection(createWrapper({ user: fakeUser('user-1') }));

    expect(screen.getByRole('link', { name: 'Go to Characters' })).toHaveAttribute(
      'href',
      '/characters',
    );
  });

  it('offers sign-in instead when signed out', () => {
    renderEmptyCollection(createWrapper());

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
