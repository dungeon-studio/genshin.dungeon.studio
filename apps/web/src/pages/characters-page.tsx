// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import { CHARACTER_ROSTER } from '@genshin/game-data';
import type { JSX } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { Container } from '@/components/chrome/container';
import { LoadFailedPage } from '@/components/chrome/load-failed-page';
import { LoadingPage } from '@/components/chrome/loading-page';
import { promptSignIn } from '@/features/auth';
import { CharacterCard } from '@/features/collection/characters/character-card';
import { CharacterFilters } from '@/features/collection/characters/character-filters';
import type { CharacterFilterState } from '@/features/collection/characters/filtering';
import { filterCharacters, initialFilterState } from '@/features/collection/characters/filtering';
import type { UseCollectionResult } from '@/features/collection/characters/use-character-collection';
import { useCollection } from '@/features/collection/characters/use-character-collection';
import { ownedCharacterIds } from '@/features/collection/characters/use-character-collection-store';

export function CharactersPage(): JSX.Element {
  const collection = useCollection();

  if (collection.isLoading) return <LoadingPage title="Characters" label="Loading collection" />;
  if (collection.loadFailed) {
    return (
      <LoadFailedPage
        title="Characters"
        message="Failed to load your character collection."
        onRetry={collection.retry}
      />
    );
  }

  return <CharacterRoster collection={collection} />;
}

function CharacterRoster({ collection }: { collection: UseCollectionResult }): JSX.Element {
  const {
    characters,
    isAuthenticated,
    addCharacter,
    removeCharacter,
    setConstellationLevel,
    isOwned,
    error,
  } = collection;

  const [filters, setFilters] = useState<CharacterFilterState>(initialFilterState);

  const ownedIds = useMemo(() => ownedCharacterIds(characters), [characters]);
  const ownedCount = ownedIds.size;

  const { filteredCharacters, filteredOwnedCount } = useMemo(() => {
    const filtered = filterCharacters(CHARACTER_ROSTER, filters, ownedIds);
    return {
      filteredCharacters: filtered,
      filteredOwnedCount: filtered.filter((c) => ownedIds.has(c.id)).length,
    };
  }, [filters, ownedIds]);

  // Signed out, the collection is empty, so add is the only action a card offers.
  const handleAddCharacter = useCallback(
    (characterId: Character['id']) => {
      if (!isAuthenticated) {
        promptSignIn('character collection');
        return;
      }

      addCharacter(characterId);
    },
    [isAuthenticated, addCharacter],
  );

  return (
    <>
      <h1 className="sr-only">Characters</h1>

      <div className="top-0 shadow-sm sticky z-10 bg-background">
        <Container className="py-4">
          {error && (
            <p className="mb-3 px-4 py-3 text-sm rounded-md bg-destructive/10 text-center text-destructive">
              Failed to sync character collection.
            </p>
          )}
          <CharacterFilters
            filters={filters}
            onChange={setFilters}
            filteredCount={filteredCharacters.length}
            totalCount={CHARACTER_ROSTER.length}
            ownedCount={ownedCount}
            filteredOwnedCount={filteredOwnedCount}
            collapsible
          />
        </Container>
      </div>

      <Container className="pb-12 pt-4">
        <div className="gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid grid-cols-1">
          {filteredCharacters.map((character) => {
            const owned = isOwned(character.id);
            const entry = owned ? characters[character.id] : undefined;

            return (
              <div key={character.id}>
                <CharacterCard
                  character={character}
                  owned={owned}
                  constellationLevel={entry?.constellationLevel}
                  onAdd={handleAddCharacter}
                  onRemove={removeCharacter}
                  onConstellationChange={setConstellationLevel}
                />
              </div>
            );
          })}
        </div>

        {filteredCharacters.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            No characters match your filters.
          </p>
        )}
      </Container>
    </>
  );
}
