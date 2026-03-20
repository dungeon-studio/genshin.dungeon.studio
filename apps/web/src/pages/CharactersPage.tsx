// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import { CHARACTERS } from '@genshin/game-data';

import { CharacterCard } from '@/components/CharacterCard';
import { useCollectionStore } from '@/features/collection/useCollectionStore';

export function CharactersPage() {
  const addCharacter = useCollectionStore((s) => s.addCharacter);
  const removeCharacter = useCollectionStore((s) => s.removeCharacter);
  const setConstellationLevel = useCollectionStore((s) => s.setConstellationLevel);
  const isOwned = useCollectionStore((s) => s.isOwned);
  const characters = useCollectionStore((s) => s.characters);

  const ownedCount = Object.keys(characters).length;

  function handleConstellationChange(characterId: Character['id'], level: number) {
    setConstellationLevel(characterId, level);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="sr-only">Characters</h1>
      <p className="text-sm text-muted-foreground">
        {ownedCount} / {CHARACTERS.length} owned
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CHARACTERS.map((character) => {
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
    </div>
  );
}
