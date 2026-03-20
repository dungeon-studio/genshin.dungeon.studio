// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import { CHARACTERS } from '@genshin/game-data';
import { useMemo, useState } from 'react';

import { CharacterCard } from '@/components/CharacterCard';
import type { CharacterFilterState } from '@/components/CharacterFilters';
import { CharacterFilters, filterCharacters } from '@/components/CharacterFilters';
import { useCollectionStore } from '@/features/collection/useCollectionStore';

function initialFilterState(): CharacterFilterState {
  return {
    search: '',
    elements: new Set(),
    rarities: new Set(),
    ownership: 'all',
    sortField: 'release',
    sortDirection: 'desc',
  };
}

export function CharactersPage() {
  const addCharacter = useCollectionStore((s) => s.addCharacter);
  const removeCharacter = useCollectionStore((s) => s.removeCharacter);
  const setConstellationLevel = useCollectionStore((s) => s.setConstellationLevel);
  const isOwned = useCollectionStore((s) => s.isOwned);
  const characters = useCollectionStore((s) => s.characters);

  const [filters, setFilters] = useState<CharacterFilterState>(initialFilterState);

  const ownedCount = Object.keys(characters).length;
  const ownedIds = useMemo(() => new Set(Object.keys(characters)), [characters]);

  const filteredCharacters = useMemo(
    () => filterCharacters(CHARACTERS, filters, ownedIds),
    [filters, ownedIds],
  );

  function handleConstellationChange(characterId: Character['id'], level: number) {
    setConstellationLevel(characterId, level);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="sr-only">Characters</h1>

      <CharacterFilters
        filters={filters}
        onChange={setFilters}
        filteredCount={filteredCharacters.length}
        totalCount={CHARACTERS.length}
        ownedCount={ownedCount}
        filteredOwnedCount={filteredCharacters.filter((c) => ownedIds.has(c.id)).length}
      />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <p className="py-12 text-center text-muted-foreground">No characters match your filters.</p>
      )}
    </div>
  );
}
