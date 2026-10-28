// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { CHARACTER_ROSTER } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { useCollectionStore } from '@/features/collection/characters/use-character-collection-store';
import { charactersDocument, makeCharacter } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { createWrapper, fakeUser } from '@/test/render';

import { CharactersPage } from './characters-page';

const [CHARACTER] = CHARACTER_ROSTER;
if (!CHARACTER) throw new Error('character roster is empty');

beforeEach(() => {
  useCollectionStore.getState().clearCharacters();
});

describe('CharactersPage loading the collection', () => {
  it('reports a failed load in place of the roster, and recovers on retry', async () => {
    server.use(
      http.get('http://localhost:8080/characters', () => new HttpResponse(null, { status: 500 })),
    );
    const user = userEvent.setup({ delay: null });

    render(
      <MemoryRouter>
        <CharactersPage />
      </MemoryRouter>,
      { wrapper: createWrapper({ user: fakeUser('user-1') }) },
    );

    expect(
      await screen.findByText('Failed to load your character collection.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /to collection$/ })).not.toBeInTheDocument();

    server.use(
      http.get('http://localhost:8080/characters', () =>
        HttpResponse.json(charactersDocument([makeCharacter(CHARACTER.id)])),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('button', { name: `Remove ${CHARACTER.name} from collection` }),
    ).toBeInTheDocument();
  });
});
