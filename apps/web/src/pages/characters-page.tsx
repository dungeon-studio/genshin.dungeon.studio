// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ConstellationLevel } from '@genshin/domain';
import type { Character } from '@genshin/game-data';
import { CHARACTER_ROSTER } from '@genshin/game-data';
import { Loader2 } from 'lucide-react';
import type { JSX } from 'react';
import { useMemo, useState } from 'react';

import { Container } from '@/components/chrome/container';
import { CharacterCard } from '@/features/collection/characters/character-card';
import { CharacterFilters } from '@/features/collection/characters/character-filters';
import type { CharacterFilterState } from '@/features/collection/characters/filtering';
import { filterCharacters, initialFilterState } from '@/features/collection/characters/filtering';
import { useCollection } from '@/features/collection/characters/use-character-collection';
import { ownedCharacterIds } from '@/features/collection/characters/use-character-collection-store';

export function CharactersPage(): JSX.Element {
  const {
    characters,
    ensureCharacter,
    removeCharacter,
    setConstellationLevel,
    isOwned,
    isLoading,
    error,
  } = useCollection();

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

  function handleConstellationChange(characterId: Character['id'], level: ConstellationLevel) {
    setConstellationLevel(characterId, level);
  }

  if (isLoading) {
    return (
      <Container className="py-12">
        <h1 className="sr-only">Characters</h1>
        <div className="py-24 flex items-center justify-center">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden="true"
            focusable={false}
          />
          <span className="sr-only">Loading collection</span>
        </div>
      </Container>
    );
  }

  return (
    <>
      <h1 className="sr-only">Characters</h1>

      <div className="top-0 shadow-sm sticky z-10 bg-background">
        <Container className="py-4">
          {error && (
            <p className="mb-3 px-4 py-3 text-sm rounded-md bg-destructive/10 text-center text-destructive">
              Failed to sync collection. Local data is still available.
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
                  onAdd={ensureCharacter}
                  onRemove={removeCharacter}
                  onConstellationChange={handleConstellationChange}
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
