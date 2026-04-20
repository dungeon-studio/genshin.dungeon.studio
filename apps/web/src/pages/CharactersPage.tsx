// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import { CHARACTERS } from '@genshin/game-data';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CharacterCard } from '@/features/collection/characters/CharacterCard';
import { CharacterFilters } from '@/features/collection/characters/CharacterFilters';
import type { CharacterFilterState } from '@/features/collection/characters/filtering';
import { filterCharacters, initialFilterState } from '@/features/collection/characters/filtering';
import { useCollection } from '@/features/collection/characters/useCharacterCollection';

export function CharactersPage() {
  const {
    characters,
    addCharacter,
    removeCharacter,
    setConstellationLevel,
    isOwned,
    isLoading,
    error,
  } = useCollection();

  const [filters, setFilters] = useState<CharacterFilterState>(initialFilterState);

  const ownedCount = Object.keys(characters).length;
  const ownedIds = useMemo(() => new Set(Object.keys(characters)), [characters]);

  const { filteredCharacters, filteredOwnedCount } = useMemo(() => {
    const filtered = filterCharacters(CHARACTERS, filters, ownedIds);
    return {
      filteredCharacters: filtered,
      filteredOwnedCount: filtered.filter((c) => ownedIds.has(c.id)).length,
    };
  }, [filters, ownedIds]);

  function handleConstellationChange(characterId: Character['id'], level: number) {
    setConstellationLevel(characterId, level);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="sr-only">Characters</h1>
        <div className="flex items-center justify-center py-24">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden="true"
            focusable={false}
          />
          <span className="sr-only">Loading collection</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="sr-only">Characters</h1>

      <div className="sticky top-0 z-10 bg-background shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          {error && (
            <p className="mb-3 rounded-md bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
              Failed to sync collection. Local data is still available.
            </p>
          )}
          <CharacterFilters
            filters={filters}
            onChange={setFilters}
            filteredCount={filteredCharacters.length}
            totalCount={CHARACTERS.length}
            ownedCount={ownedCount}
            filteredOwnedCount={filteredOwnedCount}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCharacters.map((character) => {
            const owned = isOwned(character.id);
            const entry = owned ? characters[character.id] : undefined;

            return (
              <div key={character.id}>
                <CharacterCard
                  character={character}
                  owned={owned}
                  constellationLevel={entry?.constellationLevel}
                  onAdd={addCharacter}
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
      </div>
    </>
  );
}
